// ═══════════════════════════════════════════════════════════════════
//   NUVRA WALLET — LIVE BALANCE READS (step 2: read-only)
//
//   Every read here is a public, read-only lookup of an address the
//   vault derived. No keys are involved and nothing is signed.
//
//   Sources (all verified live on 2026-11-19):
//   - Bitcoin mainnet and testnet4: mempool.space address API
//     (balance = funded − spent across chain + mempool stats)
//   - BOB mainnet (60808) and BOB Sepolia (808813): the chains' own
//     public RPCs from the chain registry (eth_getBalance, and
//     eth_call balanceOf for ERC-20s)
//   - BOB token on BOB mainnet: 0xB0BD…60808 — the contract itself
//     answers symbol() "BOB" and decimals() 18 on the mainnet RPC.
//
//   A failed read returns null (never a made-up number); the UI
//   keeps its previous value for that row when a read fails.
// ═══════════════════════════════════════════════════════════════════

import { getChain } from '../chains/registry.js'

const MEMPOOL_MAINNET = 'https://mempool.space/api'
const MEMPOOL_TESTNET = 'https://mempool.space/testnet4/api'
const TIMEOUT_MS = 10000

export const BOB_TOKEN_MAINNET = {
  address: '0xB0BD54846a92b214C04A63B26AD7Dc5e19A60808',
  decimals: 18,
  symbol: 'BOB',
}

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal })
    if (!res.ok) return null
    return res
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// ── Bitcoin (mempool.space) ──────────────────────────────────────
export async function fetchBtcBalance(address, { testnet = false } = {}) {
  if (!address) return null
  const base = testnet ? MEMPOOL_TESTNET : MEMPOOL_MAINNET
  const res = await fetchWithTimeout(`${base}/address/${address}`)
  if (!res) return null
  try {
    const data = await res.json()
    const sats = (s) => (s.funded_txo_sum || 0) - (s.spent_txo_sum || 0)
    const total = sats(data.chain_stats || {}) + sats(data.mempool_stats || {})
    return total / 1e8
  } catch {
    return null
  }
}

// ── EVM (JSON-RPC) ───────────────────────────────────────────────
async function rpcCall(rpcUrl, method, params) {
  const res = await fetchWithTimeout(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!res) return null
  try {
    const data = await res.json()
    return data?.result ?? null
  } catch {
    return null
  }
}

export async function fetchEvmNativeBalance(rpcUrl, address) {
  if (!rpcUrl || !address) return null
  const hex = await rpcCall(rpcUrl, 'eth_getBalance', [address, 'latest'])
  if (hex === null) return null
  return Number(BigInt(hex)) / 1e18
}

export async function fetchErc20Balance(rpcUrl, tokenAddress, address, decimals = 18) {
  if (!rpcUrl || !tokenAddress || !address) return null
  const data = '0x70a08231' + address.replace(/^0x/, '').toLowerCase().padStart(64, '0')
  const hex = await rpcCall(rpcUrl, 'eth_call', [{ to: tokenAddress, data }, 'latest'])
  if (hex === null) return null
  return Number(BigInt(hex)) / 10 ** decimals
}

// ── Whole-wallet read ────────────────────────────────────────────
// Returns plain numbers in whole units; null means that read
// failed (or the address does not exist), never a guess.
export async function loadWalletBalances(addresses) {
  const bob = getChain('bob')
  const sepolia = getChain('bob-sepolia')
  const evm = addresses?.bob
  const [btc, btcTestnet, ethMain, ethSepolia, bobToken] = await Promise.all([
    fetchBtcBalance(addresses?.bitcoin),
    fetchBtcBalance(addresses?.btcTestnet, { testnet: true }),
    fetchEvmNativeBalance(bob?.rpcUrl, evm),
    fetchEvmNativeBalance(sepolia?.rpcUrl, evm),
    fetchErc20Balance(bob?.rpcUrl, BOB_TOKEN_MAINNET.address, evm, BOB_TOKEN_MAINNET.decimals),
  ])
  const ethParts = [ethMain, ethSepolia].filter((v) => v !== null)
  return {
    btc,
    btcTestnet,
    ethBobMainnet: ethMain,
    ethBobSepolia: ethSepolia,
    // The dashboard's ETH row merges BOB mainnet + Sepolia, so the
    // live figure is their sum (or whichever side answered).
    eth: ethParts.length ? ethParts.reduce((a, b) => a + b, 0) : null,
    bobMainnet: bobToken,
  }
}
