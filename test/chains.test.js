// Nuvra — chain registry + address validation tests.
// Run with: npm test   (node --test, no extra framework)
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { CHAINS, getChain, isChainLive, MOCK_ADDRESSES } from '../src/chains/registry.js'
import { validateAddress, detectAddressFamily, getAdapter } from '../src/chains/adapter.js'

const BTC_TAPROOT = 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297'
const BTC_SEGWIT = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
const EVM = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
const ARCH = 'arch1q3x7k9m2p8w4z6v5n0c9d8f7g6h5j4k3l2a1s9d7f6g5h'

// ── Registry invariants ─────────────────────────────────────────────

test('registry contains bitcoin, bob, bob-sepolia and arch', () => {
  const ids = CHAINS.map((c) => c.id)
  for (const id of ['bitcoin', 'bob', 'bob-sepolia', 'arch']) {
    assert.ok(ids.includes(id), `missing chain ${id}`)
  }
})

test('BOB mainnet is chainId 60808 with the BOB RPC and explorer', () => {
  const bob = getChain('bob')
  assert.equal(bob.chainId, 60808)
  assert.equal(bob.rpcUrl, 'https://rpc.gobob.xyz/')
  assert.equal(bob.explorerUrl, 'https://explorer.gobob.xyz')
  assert.equal(bob.status, 'live')
  assert.equal(bob.type, 'evm')
})

test('BOB Sepolia testnet is chainId 808813 and flagged testnet', () => {
  const sep = getChain('bob-sepolia')
  assert.equal(sep.chainId, 808813)
  assert.equal(sep.testnet, true)
})

test('Arch status is coming-soon and not live', () => {
  const arch = getChain('arch')
  assert.equal(arch.status, 'coming-soon')
  assert.equal(isChainLive('arch'), false)
  assert.match(arch.confirmationLabel, /not a Bitcoin confirmation/)
})

test('Bitcoin confirmation label is plain Bitcoin confirmation', () => {
  assert.equal(getChain('bitcoin').confirmationLabel, 'Bitcoin confirmation')
  assert.equal(getChain('bitcoin').feeUnit, 'sat/vB')
})

test('every registry example address validates for its own chain', () => {
  for (const chain of CHAINS) {
    assert.equal(
      validateAddress(chain.id, chain.exampleAddress),
      true,
      `${chain.id} example address should validate`,
    )
    assert.equal(MOCK_ADDRESSES[chain.id], chain.exampleAddress)
  }
})

// ── validateAddress: valid cases ────────────────────────────────────

test('bitcoin accepts taproot (bc1p) and segwit (bc1q) addresses', () => {
  assert.equal(validateAddress('bitcoin', BTC_TAPROOT), true)
  assert.equal(validateAddress('bitcoin', BTC_SEGWIT), true)
})

test('bob and bob-sepolia accept 0x EVM addresses', () => {
  assert.equal(validateAddress('bob', EVM), true)
  assert.equal(validateAddress('bob-sepolia', EVM), true)
})

test('arch accepts arch1 addresses', () => {
  assert.equal(validateAddress('arch', ARCH), true)
})

// ── validateAddress: cross-chain invalid cases ──────────────────────

test('bitcoin rejects EVM and arch addresses', () => {
  assert.equal(validateAddress('bitcoin', EVM), false)
  assert.equal(validateAddress('bitcoin', ARCH), false)
})

test('bob rejects bitcoin and arch addresses', () => {
  assert.equal(validateAddress('bob', BTC_TAPROOT), false)
  assert.equal(validateAddress('bob', BTC_SEGWIT), false)
  assert.equal(validateAddress('bob', ARCH), false)
})

test('arch rejects bitcoin and EVM addresses', () => {
  assert.equal(validateAddress('arch', BTC_TAPROOT), false)
  assert.equal(validateAddress('arch', EVM), false)
})

test('validateAddress rejects empty, garbage and unknown chains', () => {
  assert.equal(validateAddress('bitcoin', ''), false)
  assert.equal(validateAddress('bob', 'not-an-address'), false)
  assert.equal(validateAddress('bob', '0x1234'), false)
  assert.equal(validateAddress('nope', EVM), false)
  assert.equal(validateAddress('bob', null), false)
})

// ── detectAddressFamily (wrong-chain paste explanation) ─────────────

test('detectAddressFamily identifies each family', () => {
  assert.equal(detectAddressFamily(BTC_TAPROOT), 'bitcoin')
  assert.equal(detectAddressFamily(EVM), 'evm')
  assert.equal(detectAddressFamily(ARCH), 'arch')
  assert.equal(detectAddressFamily('hello'), null)
})

// ── Adapters ────────────────────────────────────────────────────────

test('mock adapters return chain-tagged balances and history', async () => {
  const bob = getAdapter('bob')
  const balances = await bob.getBalances()
  assert.ok(balances.length > 0)
  assert.ok(balances.every((a) => a.chain === 'bob'))
  const history = await bob.getHistory()
  assert.ok(history.every((t) => t.chain === 'bob'))
  assert.equal(bob.getAddress(), MOCK_ADDRESSES.bob)
  assert.equal(bob.validateAddress(EVM), true)
  assert.equal(bob.validateAddress(BTC_TAPROOT), false)
})

test('arch adapter send/sign throws a clear not-live error', async () => {
  const arch = getAdapter('arch')
  await assert.rejects(() => arch.send({}), /Arch is not live yet/)
  await assert.rejects(() => arch.signAndBroadcast({}), /Arch is not live yet/)
})

test('mock send on live chains returns a clearly mocked hash', async () => {
  const bob = getAdapter('bob')
  const res = await bob.send({})
  assert.equal(res.mock, true)
  assert.ok(res.hash.includes('demo'))
})
