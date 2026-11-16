import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CHAINS, getChain, isChainLive, MOCK_ADDRESSES } from '../chains/registry.js'
import { getAdapter } from '../chains/adapter.js'

// ═══════════════════════════════════════════════════════════════════
//   NUVRA WALLET — WALLET CONTEXT (wallet core, UI-facing)
//
//   Holds the selected chain and the mock per-chain accounts.
//   selectedChainId is 'bitcoin' | 'bob' | 'bob-sepolia' | 'all'
//   (aggregate view). 'arch' can never be selected while its status
//   is 'coming-soon' — setSelectedChain refuses it.
//
//   The selection persists to chrome.storage.local inside the
//   extension, and falls back to localStorage in a plain browser
//   (vite dev / preview).
//
//   THIS PHASE: addresses are mock example addresses from the
//   registry. There are no keys in this context and none are stored.
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'nuvra:selectedChainId'
// Network switching is REMOVED for now (Desmond, 2026-11-16): the
// wallet sits on the 'all' aggregate view, the dashboard shows every
// token, and no screen offers a network switch. The chain registry,
// adapters and per-chain data stay in place so switching can be
// switched back on later without a rewrite.
const DEFAULT_CHAIN_ID = 'all'

const WalletContext = createContext(null)

function readLocalStorage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeLocalStorage(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // storage unavailable (private mode etc.) — selection just won't persist
  }
}

function isSelectable(id) {
  return id === 'all' || isChainLive(id)
}

export function WalletProvider({ children }) {
  const [selectedChainId, setSelectedChainId] = useState(DEFAULT_CHAIN_ID)

  // Keep the stored value in step with the locked 'all' view, so a
  // chain picked back when switching existed does not resurface.
  useEffect(() => {
    writeLocalStorage(DEFAULT_CHAIN_ID)
    const chromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
    if (chromeStorage) {
      try { chromeStorage.set({ [STORAGE_KEY]: DEFAULT_CHAIN_ID }) } catch { /* best effort */ }
    }
  }, [])

  const setSelectedChain = useCallback((id) => {
    if (!isSelectable(id)) return // unknown chain, or Arch while coming-soon
    setSelectedChainId(id)
    writeLocalStorage(id)
    const chromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
    if (chromeStorage) {
      try { chromeStorage.set({ [STORAGE_KEY]: id }) } catch { /* best effort */ }
    }
  }, [])

  const value = useMemo(() => {
    const chain = selectedChainId === 'all' ? null : getChain(selectedChainId)
    return {
      chains: CHAINS,
      selectedChainId,
      setSelectedChain,
      // null in the 'all' aggregate view
      chain,
      // Mock per-chain accounts (example addresses — no real keys)
      addresses: MOCK_ADDRESSES,
      address: chain ? MOCK_ADDRESSES[chain.id] : null,
      adapter: chain ? getAdapter(chain.id) : null,
      getAdapterFor: (id) => getAdapter(id),
    }
  }, [selectedChainId, setSelectedChain])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>')
  return ctx
}
