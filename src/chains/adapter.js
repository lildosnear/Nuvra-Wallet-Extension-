// ═══════════════════════════════════════════════════════════════════
//   NUVRA WALLET — CHAIN ADAPTER INTERFACE
//
//   Every chain in the registry (./registry.js) is accessed through
//   this one interface, so the UI never talks to a chain SDK directly:
//
//     adapter.chain                 → registry entry for the chain
//     adapter.getAddress()          → this wallet's address on the chain
//     adapter.validateAddress(addr) → boolean, format check for THIS chain
//     adapter.getBalances()         → Promise<Asset[]>   (data/constants shape)
//     adapter.getHistory()          → Promise<Transaction[]>
//     adapter.estimateFee(intent)   → Promise<{ fee, unit }>
//     adapter.explorerUrl(hash)     → string | null, link to a tx
//     adapter.send(intent)          → Promise<{ hash }>  (sign + broadcast)
//     adapter.signAndBroadcast(tx)  → alias used by future real adapters
//
//   THIS PHASE: all adapters are MOCK adapters. getBalances/getHistory
//   return the tagged mock data in src/data/constants.js. send() does
//   NOT sign anything and moves NO funds — it returns a fake hash so
//   the UI flow can be exercised. Real implementations (Bitcoin L1,
//   BOB via an EVM library, BOB Gateway) land behind this same
//   interface in later phases.
//
//   The Arch adapter is disabled: its send/sign methods throw, because
//   Arch is not live yet.
// ═══════════════════════════════════════════════════════════════════

import { getChain, MOCK_ADDRESSES } from './registry.js'
import { ASSETS, TRANSACTIONS } from '../data/constants.js'

const BECH32_CHARS = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const RE_BITCOIN_TAPROOT = new RegExp(`^bc1p[${BECH32_CHARS}]{58}$`)
const RE_BITCOIN_SEGWIT = new RegExp(`^bc1q[${BECH32_CHARS}]{38,58}$`)
const RE_EVM = /^0x[0-9a-fA-F]{40}$/
const RE_ARCH = /^arch1[a-z0-9]{20,60}$/

/**
 * Pure, unit-testable format check for one chain.
 * Accepts a chain id ('bitcoin' | 'bob' | 'bob-sepolia' | 'arch')
 * or a registry chain object. Returns false for unknown chains.
 */
export function validateAddress(chainOrId, address) {
  const chain = typeof chainOrId === 'string' ? getChain(chainOrId) : chainOrId
  if (!chain || typeof address !== 'string') return false
  const addr = address.trim()
  if (!addr) return false
  switch (chain.addressFormat) {
    case 'taproot':
      return RE_BITCOIN_TAPROOT.test(addr) || RE_BITCOIN_SEGWIT.test(addr)
    case 'evm':
      return RE_EVM.test(addr)
    case 'arch':
      return RE_ARCH.test(addr)
    default:
      return false
  }
}

/**
 * Best-effort guess of which chain family an address belongs to.
 * Used only to explain a wrong-chain paste in the UI.
 * Returns 'bitcoin' | 'evm' | 'arch' | null.
 */
export function detectAddressFamily(address) {
  if (typeof address !== 'string') return null
  const addr = address.trim()
  if (RE_EVM.test(addr)) return 'evm'
  if (RE_BITCOIN_TAPROOT.test(addr) || RE_BITCOIN_SEGWIT.test(addr)) return 'bitcoin'
  if (RE_ARCH.test(addr)) return 'arch'
  return null
}

const FAMILY_LABEL = {
  bitcoin: 'Bitcoin',
  evm: 'EVM (0x)',
  arch: 'Arch',
}

export function familyLabel(family) {
  return FAMILY_LABEL[family] || family
}

function mockHash(chainId) {
  // Clearly fake, deterministic-looking demo hash — not a real tx.
  return chainId === 'bitcoin'
    ? 'demo00000000000000000000000000000000000000000000000000000000tx'
    : '0xdemo00000000000000000000000000000000000000000000000000000000'
}

export function createMockAdapter(chain) {
  const notLive = () => {
    throw new Error(
      'Arch is not live yet — sending on Arch is disabled in Nuvra until Arch mainnet is live with user funds.',
    )
  }
  const isArch = chain.id === 'arch'

  return {
    chain,

    getAddress() {
      return MOCK_ADDRESSES[chain.id]
    },

    validateAddress(address) {
      return validateAddress(chain, address)
    },

    async getBalances() {
      return ASSETS.filter((a) => a.chain === chain.id)
    },

    async getHistory() {
      return TRANSACTIONS.filter((t) => t.chain === chain.id)
    },

    async estimateFee() {
      if (isArch) notLive()
      if (chain.type === 'bitcoin') return { fee: '0.00012 BTC', unit: chain.feeUnit, mock: true }
      if (chain.type === 'archvm') return { fee: '0.001 ARCH', unit: chain.feeUnit, mock: true }
      return { fee: '0.00004 ETH', unit: chain.feeUnit, mock: true }
    },

    explorerUrl(hash) {
      if (!chain.explorerUrl || !hash) return null
      return `${chain.explorerUrl}/tx/${hash}`
    },

    // MOCK ONLY: no keys, no signing, no broadcast, no funds move.
    async send() {
      if (isArch) notLive()
      return { hash: mockHash(chain.id), mock: true }
    },

    async signAndBroadcast() {
      if (isArch) notLive()
      return { hash: mockHash(chain.id), mock: true }
    },
  }
}

const adapterCache = new Map()

export function getAdapter(chainId) {
  const chain = getChain(chainId)
  if (!chain) return null
  if (!adapterCache.has(chainId)) adapterCache.set(chainId, createMockAdapter(chain))
  return adapterCache.get(chainId)
}
