import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchBtcBalance, fetchEvmNativeBalance, fetchErc20Balance, fetchArchBalance, loadWalletBalances } from '../src/wallet/balances.js'

// Stub fetch per test: routes by URL substring.
function stubFetch(routes) {
  globalThis.fetch = async (url, options = {}) => {
    const u = String(url)
    for (const [needle, respond] of routes) {
      if (u.includes(needle)) {
        const body = typeof respond === 'function' ? respond(options) : respond
        if (body === 'FAIL') throw new Error('network down')
        return { ok: true, json: async () => body }
      }
    }
    throw new Error('unstubbed url: ' + u)
  }
}

const ADDR = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94'

test('btc balance: funded minus spent across chain and mempool', async () => {
  stubFetch([['mempool.space', {
    chain_stats: { funded_txo_sum: 300000, spent_txo_sum: 50000 },
    mempool_stats: { funded_txo_sum: 10000, spent_txo_sum: 0 },
  }]])
  assert.equal(await fetchBtcBalance('bc1pwhatever'), 0.0026)
})

test('btc balance: http failure returns null, never a guess', async () => {
  globalThis.fetch = async () => ({ ok: false, json: async () => ({}) })
  assert.equal(await fetchBtcBalance('bc1pwhatever'), null)
  stubFetch([['mempool.space', 'FAIL']])
  assert.equal(await fetchBtcBalance('bc1pwhatever'), null)
})

test('evm native balance: wei hex converts to ETH', async () => {
  stubFetch([['rpc.example', { jsonrpc: '2.0', id: 1, result: '0xde0b6b3a7640000' }]]) // 1 ETH
  assert.equal(await fetchEvmNativeBalance('https://rpc.example', ADDR), 1)
})

test('erc20 balanceOf: raw value scales by decimals', async () => {
  stubFetch([['rpc.example', (options) => {
    const body = JSON.parse(options.body)
    assert.equal(body.method, 'eth_call')
    assert.ok(body.params[0].data.startsWith('0x70a08231'))
    return { jsonrpc: '2.0', id: 1, result: '0x' + (2500n * 10n ** 18n).toString(16) }
  }]])
  assert.equal(await fetchErc20Balance('https://rpc.example', '0xB0BD54846a92b214C04A63B26AD7Dc5e19A60808', ADDR, 18), 2500)
})

test('loadWalletBalances: testnet only — mainnet endpoints are never read', async () => {
  stubFetch([
    ['testnet4', { chain_stats: { funded_txo_sum: 265092, spent_txo_sum: 0 }, mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 } }],
    // Trap routes: if the loader touched mainnet, these distinctive
    // values would leak into the result and fail the asserts below.
    ['mempool.space', { chain_stats: { funded_txo_sum: 999999999, spent_txo_sum: 0 }, mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 } }],
    ['bob-sepolia', { jsonrpc: '2.0', id: 1, result: '0x1bc16d674ec8000' }], // 0.125 ETH
    ['rpc.gobob.xyz', { jsonrpc: '2.0', id: 1, result: '0x7ce66c50e2840000' }], // 9 ETH trap
    ['rpc.testnet.arch.network', { jsonrpc: '2.0', result: { lamports: 100000000000 } }],
  ])
  const b = await loadWalletBalances({ bitcoin: 'bc1px', btcTestnet: 'tb1px', bob: ADDR, 'arch-testnet': '6jcrBGv1Nie81u3CoH3E2qYxrw7KCuAsdsyY5oitqou7' })
  assert.equal(b.btc, 0.00265092)
  assert.equal(b.btcTestnet, 0.00265092)
  assert.equal(b.eth, 0.125)
  assert.equal(b.ethBobSepolia, 0.125)
  assert.equal(b.arch, 100)
})

test('fetchArchBalance: lamports convert at 1e9 per ARCH', async () => {
  stubFetch([['rpc.testnet.arch.network', { jsonrpc: '2.0', result: { lamports: 250000000 } }]])
  assert.equal(await fetchArchBalance('6jcrBGv1Nie81u3CoH3E2qYxrw7KCuAsdsyY5oitqou7'), 0.25)
})

test('fetchArchBalance: a wallet with no on-chain account reads as a true zero', async () => {
  stubFetch([['rpc.testnet.arch.network', { jsonrpc: '2.0', error: { code: 404, message: 'account is not in database' } }]])
  assert.equal(await fetchArchBalance('6jcrBGv1Nie81u3CoH3E2qYxrw7KCuAsdsyY5oitqou7'), 0)
})

test('fetchArchBalance: an unreachable RPC returns null, never a guess', async () => {
  stubFetch([['rpc.testnet.arch.network', 'FAIL']])
  assert.equal(await fetchArchBalance('6jcrBGv1Nie81u3CoH3E2qYxrw7KCuAsdsyY5oitqou7'), null)
  assert.equal(await fetchArchBalance('not-an-address'), null)
})
