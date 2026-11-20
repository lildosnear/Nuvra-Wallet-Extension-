import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { Transaction } from '@scure/btc-signer'
import { importVault, lockVault } from '../src/wallet/vault.js'
import { getSendRoute, validateSendAddress, parseAmountToUnits, selectCoins, estimateSend, sendToken } from '../src/wallet/send.js'

const FAST = { memoryKiB: 1024, iterations: 1, parallelism: 1, hashLength: 32 }
const MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
const BTC_TOKEN = { symbol: 'BTC', chain: 'bitcoin' }
const ETH_TOKEN = { symbol: 'ETH', chain: 'bob' }
const DEST_TB1P = 'tb1p0kx5nthpfumfnfnkxylswmwd7rp2x4zzaqtv9tzkszqacydfkgtqua0jyz'
const DEST_EVM = '0x5A07dfbdad03844369dbF78DBB22BdE1Abb1BcDC'

// Route-aware fetch stub. routes: [substring, handler] where handler
// is a value, 'FAIL', or a function(url, options) returning a value.
function stubFetch(routes) {
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url)
    for (const [needle, handler] of routes) {
      if (u.includes(needle)) {
        const value = typeof handler === 'function' ? await handler(u, options) : handler
        if (value === 'FAIL') throw new Error('network down')
        const isText = typeof value === 'string'
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => (isText ? JSON.parse(value) : value),
          text: async () => (isText ? value : JSON.stringify(value)),
        }
      }
    }
    throw new Error('unstubbed URL: ' + u)
  }
}

before(async () => {
  await importVault({ email: 'send@example.com', password: 'correct horse 9', pin: '1234', mnemonic: MNEMONIC, kdf: FAST })
})

test('routes: BTC and ETH are sendable on testnet, other tokens are not', () => {
  assert.equal(getSendRoute(BTC_TOKEN).networkLabel, 'Bitcoin Testnet')
  assert.equal(getSendRoute(ETH_TOKEN).networkLabel, 'BOB Sepolia')
  assert.equal(getSendRoute({ symbol: 'USDC', chain: 'bob' }), null)
  assert.equal(getSendRoute({ symbol: 'ARCH', chain: 'arch-testnet' }), null)
  assert.equal(getSendRoute({ symbol: 'BOB', chain: 'bob-sepolia' }), null)
})

test('send address validation follows the testnet route, not mainnet', () => {
  const btc = getSendRoute(BTC_TOKEN)
  assert.equal(validateSendAddress(btc, DEST_TB1P), true)
  assert.equal(validateSendAddress(btc, 'bc1p0kx5nthpfumfnfnkxylswmwd7rp2x4zzaqtv9tzkszqacydfkgtqua0jyz'.replace('tb1p', 'bc1p')), false)
  const eth = getSendRoute(ETH_TOKEN)
  assert.equal(validateSendAddress(eth, DEST_EVM), true)
  assert.equal(validateSendAddress(eth, DEST_TB1P), false)
})

test('parseAmountToUnits is strict about money', () => {
  assert.equal(parseAmountToUnits('0.00000001', 8), 1n)
  assert.equal(parseAmountToUnits('0.0025', 8), 250000n)
  assert.equal(parseAmountToUnits('1.5', 18), 1500000000000000000n)
  assert.equal(parseAmountToUnits('0.000000001', 8), null) // 9 dp for BTC
  assert.equal(parseAmountToUnits('abc', 8), null)
  assert.equal(parseAmountToUnits('0', 8), null)
  assert.equal(parseAmountToUnits('-1', 8), null)
})

test('selectCoins covers amount plus fee and keeps change above dust', () => {
  const utxos = [{ txid: 'aa'.repeat(32), vout: 0, value: 500000 }]
  const sel = selectCoins(utxos, 100000n, 2, DEST_TB1P, DEST_TB1P)
  // vsize 10.5 + 57.5 + 43 + 43 = 154, at 2 sat/vb = 308 sats
  assert.equal(sel.feeSats, 308n)
  assert.equal(sel.changeSats, 500000n - 100000n - 308n)
  assert.equal(selectCoins(utxos, 499999n, 2, DEST_TB1P, DEST_TB1P), null)
})

test('BTC testnet send builds, signs and broadcasts a real transaction shape', async () => {
  let broadcastHex = null
  stubFetch([
    ['/utxo', [{ txid: 'aa'.repeat(32), vout: 0, value: 500000, status: { confirmed: true } }]],
    ['/v1/fees/recommended', { halfHourFee: 2, hourFee: 2, economyFee: 1 }],
    ['mempool.space/testnet4/api/tx', (u, options) => { broadcastHex = options.body; return 'bb'.repeat(32) }],
  ])
  const est = await estimateSend({ token: BTC_TOKEN, to: DEST_TB1P, amountText: '0.001' })
  assert.equal(est.feeText, '0.00000308 BTC')
  const res = await sendToken({ token: BTC_TOKEN, to: DEST_TB1P, amountText: '0.001' })
  assert.equal(res.txid, 'bb'.repeat(32))
  assert.equal(res.networkLabel, 'Bitcoin Testnet')
  assert.ok(broadcastHex && broadcastHex.length > 200)
  const tx = Transaction.fromRaw(Buffer.from(broadcastHex, 'hex'))
  assert.equal(tx.inputsLength, 1)
  assert.equal(tx.outputsLength, 2)
  assert.equal(tx.getOutput(0).amount, 100000n)
  assert.equal(tx.getOutput(1).amount, 399692n)
  const wit = tx.getInput(0).finalScriptWitness
  assert.equal(wit.length, 1)
  assert.equal(wit[0].length, 64, 'a 64-byte Schnorr signature signs the input')
})

test('BTC send refuses when the balance cannot cover amount plus fee', async () => {
  stubFetch([
    ['/utxo', [{ txid: 'aa'.repeat(32), vout: 0, value: 50000, status: { confirmed: true } }]],
    ['/v1/fees/recommended', { halfHourFee: 2 }],
  ])
  await assert.rejects(() => sendToken({ token: BTC_TOKEN, to: DEST_TB1P, amountText: '0.001' }), /Not enough Bitcoin testnet balance/)
})

test('BOB Sepolia ETH send signs and broadcasts through the chain RPC', async () => {
  let rawTx = null
  stubFetch([
    ['bob-sepolia.rpc.gobob.xyz', (u, options) => {
      const body = JSON.parse(options.body)
      const results = {
        eth_estimateGas: '0x5208',
        eth_gasPrice: '0x2540be400',
        eth_getBalance: '0xde0b6b3a7640000',
        eth_getTransactionCount: '0x0',
        eth_chainId: '0xc576d',
        eth_blockNumber: '0x100',
        eth_sendRawTransaction: (params) => { rawTx = params[0]; return '0x' + 'cd'.repeat(32) },
      }
      const r = results[body.method]
      const value = typeof r === 'function' ? r(body.params) : (r ?? '0x0')
      return { jsonrpc: '2.0', id: body.id, result: value }
    }],
  ])
  const est = await estimateSend({ token: ETH_TOKEN, to: DEST_EVM, amountText: '0.01' })
  assert.equal(est.feeText, '0.00021 ETH') // 21000 gas at 10 gwei
  const res = await sendToken({ token: ETH_TOKEN, to: DEST_EVM, amountText: '0.01' })
  assert.equal(res.txid, '0x' + 'cd'.repeat(32))
  assert.equal(res.networkLabel, 'BOB Sepolia')
  assert.ok(rawTx && rawTx.startsWith('0x') && rawTx.length > 100, 'a signed raw transaction was broadcast')
})

test('a locked wallet cannot send', async () => {
  lockVault()
  await assert.rejects(() => sendToken({ token: BTC_TOKEN, to: DEST_TB1P, amountText: '0.001' }), /locked/)
})
