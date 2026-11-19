import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchBtcBalance, fetchEvmNativeBalance, fetchErc20Balance, loadWalletBalances } from '../src/wallet/balances.js'

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

test('loadWalletBalances: ETH row sums mainnet and Sepolia, failures stay null', async () => {
  stubFetch([
    ['testnet4', { chain_stats: { funded_txo_sum: 5000, spent_txo_sum: 0 }, mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 } }],
    ['mempool.space', { chain_stats: { funded_txo_sum: 100000, spent_txo_sum: 0 }, mempool_stats: { funded_txo_sum: 0, spent_txo_sum: 0 } }],
    ['bob-sepolia', { jsonrpc: '2.0', id: 1, result: '0x1bc16d674ec8000' }], // 0.125 ETH
    ['rpc.gobob.xyz', (options) => {
      const body = JSON.parse(options.body)
      if (body.method === 'eth_getBalance') return { jsonrpc: '2.0', id: 1, result: '0x3782dace9d90000' } // 0.25 ETH
      return { jsonrpc: '2.0', id: 1, result: '0x0' } // BOB token: 0
    }],
  ])
  const b = await loadWalletBalances({ bitcoin: 'bc1px', btcTestnet: 'tb1px', bob: ADDR })
  assert.equal(b.btc, 0.001)
  assert.equal(b.btcTestnet, 0.00005)
  assert.equal(b.ethBobMainnet, 0.25)
  assert.equal(b.ethBobSepolia, 0.125)
  assert.equal(b.eth, 0.375)
  assert.equal(b.bobMainnet, 0)
})
