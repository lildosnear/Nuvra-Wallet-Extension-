// ═══════════════════════════════════════════════════════════════════
//   NUVRA WALLET — REAL TESTNET SENDING (step 3)
//
//   TESTNET ONLY this phase (Desmond's standing rule): Bitcoin
//   sends run on Bitcoin testnet4 and ETH sends run on BOB Sepolia.
//   No mainnet endpoint is called. Keys are derived in memory from
//   the unlocked session's seed and never leave the device; the
//   transaction is built and signed locally, and only the signed
//   transaction is broadcast.
//
//   No blind signing: the Send screen shows the network, the
//   recipient, the amount and the estimated fee, and asks for the
//   wallet PIN before anything is signed.
// ═══════════════════════════════════════════════════════════════════

import { HDKey } from '@scure/bip32'
import { Transaction, p2tr, TEST_NETWORK } from '@scure/btc-signer'
import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { hex } from '@scure/base'
import { getSession } from './vault.js'
import { getChain } from '../chains/registry.js'

const MEMPOOL_T4 = 'https://mempool.space/testnet4/api'
const BTC_DUST = 330n // P2TR dust threshold in sats

async function fetchWithTimeout(url, options = {}, ms = 20000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// ── Send routes ──────────────────────────────────────────────────
// Which tokens can really be sent in this build, and where. A token
// with no route is not sendable yet, and the UI says so plainly
// instead of faking a receipt.
export function getSendRoute(token) {
  if (!token) return null
  if (token.symbol === 'BTC' && token.chain === 'bitcoin') {
    return {
      kind: 'btc-testnet',
      networkLabel: 'Bitcoin Testnet',
      feeSymbol: 'BTC',
      decimals: 8,
      explorerTx: (id) => `https://mempool.space/testnet4/tx/${id}`,
    }
  }
  if (token.symbol === 'ETH' && token.chain === 'bob') {
    return {
      kind: 'evm-sepolia',
      networkLabel: 'BOB Sepolia',
      feeSymbol: 'ETH',
      decimals: 18,
      explorerTx: (id) => `${getChain('bob-sepolia')?.explorerUrl}/tx/${id}`,
    }
  }
  return null
}

const RE_BTC_TESTNET = /^(tb1p[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58}|tb1q[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38,58})$/
const RE_EVM_ADDR = /^0x[0-9a-fA-F]{40}$/

export function validateSendAddress(route, address) {
  if (!route || typeof address !== 'string') return false
  const a = address.trim()
  if (route.kind === 'btc-testnet') return RE_BTC_TESTNET.test(a)
  if (route.kind === 'evm-sepolia') return RE_EVM_ADDR.test(a)
  return false
}

// Strict decimal string to base units. Rejects junk and too many
// decimal places instead of silently rounding money.
export function parseAmountToUnits(text, decimals) {
  const s = String(text || '').trim()
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const [whole, frac = ''] = s.split('.')
  if (frac.length > decimals) return null
  const units = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(frac.padEnd(decimals, '0') || '0')
  return units > 0n ? units : null
}

function sessionSeed() {
  const s = getSession()
  if (!s?.seedBytes) throw new Error('The wallet is locked. Unlock it before sending.')
  return s.seedBytes
}

function deriveBtcTestnetKey(seedBytes) {
  return HDKey.fromMasterSeed(seedBytes).derive("m/86'/1'/0'/0/0")
}

function deriveEvmKeyHex(seedBytes) {
  const child = HDKey.fromMasterSeed(seedBytes).derive("m/44'/60'/0'/0/0")
  return '0x' + [...child.privateKey].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Bitcoin testnet ──────────────────────────────────────────────
async function fetchUtxos(address) {
  const res = await fetchWithTimeout(`${MEMPOOL_T4}/address/${address}/utxo`)
  if (!res || !res.ok) throw new Error('Could not load this wallet’s Bitcoin testnet balance. Check your connection and try again.')
  const list = await res.json()
  return list.map((u) => ({ txid: u.txid, vout: u.vout, value: u.value }))
}

async function fetchFeeRate() {
  const res = await fetchWithTimeout(`${MEMPOOL_T4}/v1/fees/recommended`)
  if (!res || !res.ok) return 1
  const j = await res.json().catch(() => null)
  const rate = j?.halfHourFee || j?.hourFee || j?.economyFee || 1
  return Math.max(1, rate)
}

// Estimated vsize for a P2TR key-path spend: 10.5 overhead, 57.5
// per input, 43 per P2TR output, 31 per P2WPKH output.
function estimateVsize(nIn, outputs) {
  let v = 10.5 + nIn * 57.5
  for (const o of outputs) v += o.startsWith('tb1p') ? 43 : 31
  return v
}

// Largest-first coin selection. Returns { picked, feeSats, changeSats }
// or null when the wallet cannot cover amount + fee.
export function selectCoins(utxos, amountSats, feeRate, toAddress, changeAddress) {
  const sorted = [...utxos].sort((a, b) => b.value - a.value)
  const picked = []
  let sum = 0n
  for (const u of sorted) {
    picked.push(u)
    sum += BigInt(u.value)
    const feeWithChange = BigInt(Math.ceil(estimateVsize(picked.length, [toAddress, changeAddress]) * feeRate))
    if (sum >= amountSats + feeWithChange) {
      const change = sum - amountSats - feeWithChange
      if (change >= BTC_DUST) return { picked, feeSats: feeWithChange, changeSats: change }
      // Change would be dust: fold it into the fee if a one-output
      // transaction is still fully paid for.
      const feeOneOut = BigInt(Math.ceil(estimateVsize(picked.length, [toAddress]) * feeRate))
      if (sum >= amountSats + feeOneOut) return { picked, feeSats: sum - amountSats, changeSats: 0n }
    }
  }
  return null
}

async function prepareBtcSend({ to, amountSats }) {
  const seedBytes = sessionSeed()
  const child = deriveBtcTestnetKey(seedBytes)
  const xonly = child.publicKey.slice(1)
  const from = getSession().addresses.btcTestnet
  const utxos = await fetchUtxos(from)
  const feeRate = await fetchFeeRate()
  const sel = selectCoins(utxos, amountSats, feeRate, to, from)
  if (!sel) {
    const held = utxos.reduce((a, u) => a + BigInt(u.value), 0n)
    throw new Error(`Not enough Bitcoin testnet balance. This send needs ${formatUnits(amountSats, 8)} BTC plus the network fee, and the wallet holds ${formatUnits(held, 8)} BTC.`)
  }
  return { child, xonly, from, sel }
}

function buildSignedBtcTx({ child, xonly, from, sel, to, amountSats }) {
  const payment = p2tr(xonly, undefined, TEST_NETWORK)
  const tx = new Transaction()
  for (const u of sel.picked) {
    tx.addInput({
      txid: u.txid,
      index: u.vout,
      witnessUtxo: { script: payment.script, amount: BigInt(u.value) },
      tapInternalKey: xonly,
    })
  }
  tx.addOutputAddress(to, amountSats, TEST_NETWORK)
  if (sel.changeSats > 0n) tx.addOutputAddress(from, sel.changeSats, TEST_NETWORK)
  tx.sign(child.privateKey)
  tx.finalize()
  const rawHex = hex.encode(tx.extract())
  return { hex: rawHex, txid: tx.id, feeSats: sel.feeSats }
}

async function broadcastBtcTx(hex) {
  const res = await fetchWithTimeout(`${MEMPOOL_T4}/tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: hex,
  })
  const text = res ? await res.text().catch(() => '') : ''
  if (!res || !res.ok) throw new Error(`The Bitcoin testnet node rejected this transaction. ${text.slice(0, 160)}`)
  return text.trim()
}

// ── BOB Sepolia (EVM) ────────────────────────────────────────────
const BOB_SEPOLIA_CHAIN = {
  id: 808813,
  name: 'BOB Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://bob-sepolia.rpc.gobob.xyz'] } },
}

function evmClients(seedBytes) {
  const account = privateKeyToAccount(deriveEvmKeyHex(seedBytes))
  const transport = http(getChain('bob-sepolia')?.rpcUrl)
  const publicClient = createPublicClient({ chain: BOB_SEPOLIA_CHAIN, transport })
  const walletClient = createWalletClient({ account, chain: BOB_SEPOLIA_CHAIN, transport })
  return { account, publicClient, walletClient }
}

async function prepareEvmSend({ to, valueWei }) {
  const seedBytes = sessionSeed()
  const { account, publicClient } = evmClients(seedBytes)
  let gas, gasPrice, balance
  try {
    ;[gas, gasPrice, balance] = await Promise.all([
      publicClient.estimateGas({ account: account.address, to, value: valueWei }),
      publicClient.getGasPrice(),
      publicClient.getBalance({ address: account.address }),
    ])
  } catch {
    throw new Error('Could not reach BOB Sepolia to price this send. Check your connection and try again.')
  }
  const feeWei = gas * gasPrice
  if (balance < valueWei + feeWei) {
    throw new Error(`Not enough ETH on BOB Sepolia. This send needs ${formatUnits(valueWei + feeWei, 18)} ETH including the network fee, and the wallet holds ${formatUnits(balance, 18)} ETH.`)
  }
  return { feeWei, gas, gasPrice }
}

// ── Public API used by the Send screen ───────────────────────────
// estimateSend returns { feeUnits (BigInt), feeText, networkLabel }
// and throws an Error with a plain message when the send cannot be
// made (insufficient funds, unreachable network).
export async function estimateSend({ token, to, amountText }) {
  const route = getSendRoute(token)
  if (!route) return null
  if (!validateSendAddress(route, to)) throw new Error(`Enter a valid ${route.networkLabel} address.`)
  const units = parseAmountToUnits(amountText, route.decimals)
  if (units === null) throw new Error('Enter a valid amount.')
  if (route.kind === 'btc-testnet') {
    const { sel } = await prepareBtcSend({ to: to.trim(), amountSats: units })
    return { route, feeUnits: sel.feeSats, feeText: `${formatUnits(sel.feeSats, 8)} BTC` }
  }
  const { feeWei } = await prepareEvmSend({ to: to.trim(), valueWei: units })
  return { route, feeUnits: feeWei, feeText: `${formatUnits(feeWei, 18)} ETH` }
}

// sendToken builds, signs and broadcasts. Returns
// { txid, explorerUrl, networkLabel, feeText }.
export async function sendToken({ token, to, amountText }) {
  const route = getSendRoute(token)
  if (!route) throw new Error('This token cannot be sent in the testnet build yet.')
  const dest = to.trim()
  if (!validateSendAddress(route, dest)) throw new Error(`Enter a valid ${route.networkLabel} address.`)
  const units = parseAmountToUnits(amountText, route.decimals)
  if (units === null) throw new Error('Enter a valid amount.')

  if (route.kind === 'btc-testnet') {
    const prep = await prepareBtcSend({ to: dest, amountSats: units })
    const { hex, txid, feeSats } = buildSignedBtcTx({ ...prep, to: dest, amountSats: units })
    const broadcastId = await broadcastBtcTx(hex)
    return {
      txid: broadcastId || txid,
      explorerUrl: route.explorerTx(broadcastId || txid),
      networkLabel: route.networkLabel,
      feeText: `${formatUnits(feeSats, 8)} BTC`,
    }
  }

  const seedBytes = sessionSeed()
  const { account, publicClient, walletClient } = evmClients(seedBytes)
  const { feeWei, gas, gasPrice } = await prepareEvmSend({ to: dest, valueWei: units })
  const nonce = await publicClient.getTransactionCount({ address: account.address })
  let hash
  try {
    hash = await walletClient.sendTransaction({ account, to: dest, value: units, gas, gasPrice, nonce })
  } catch (e) {
    throw new Error(`BOB Sepolia rejected this transaction. ${String(e?.shortMessage || e?.message || '').slice(0, 160)}`)
  }
  return {
    txid: hash,
    explorerUrl: route.explorerTx(hash),
    networkLabel: route.networkLabel,
    feeText: `${formatUnits(feeWei, 18)} ETH`,
  }
}
