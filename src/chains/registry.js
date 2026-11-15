// ═══════════════════════════════════════════════════════════════════
//   NUVRA WALLET — CHAIN REGISTRY
//   Nuvra is chain-agnostic: every BTC chain is an entry here, behind
//   one common adapter interface (see ./adapter.js). Adding a chain
//   means adding an entry here plus an adapter — never a new app.
//
//   Status values:
//     'live'         — usable in this build (mock data in this phase)
//     'coming-soon'  — listed in the UI but disabled; do NOT enable
//                      until the chain is verified live with user funds
// ═══════════════════════════════════════════════════════════════════

export const CHAINS = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    shortName: 'Bitcoin',
    type: 'bitcoin',
    status: 'live',
    testnet: false,
    chainId: null,
    rpcUrl: null,
    explorerUrl: 'https://mempool.space',
    addressFormat: 'taproot',
    addressFormatLabel: 'bc1p… (Taproot) or bc1q…',
    exampleAddress: 'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297',
    feeUnit: 'sat/vB',
    confirmationLabel: 'Bitcoin confirmation',
    nativeSymbol: 'BTC',
  },
  {
    id: 'bob',
    name: 'BOB Mainnet',
    shortName: 'BOB',
    type: 'evm',
    status: 'live',
    testnet: false,
    chainId: 60808,
    rpcUrl: 'https://rpc.gobob.xyz/',
    explorerUrl: 'https://explorer.gobob.xyz',
    addressFormat: 'evm',
    addressFormatLabel: '0x… (EVM)',
    exampleAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    feeUnit: 'ETH gas',
    confirmationLabel: 'BOB confirmation',
    nativeSymbol: 'ETH',
  },
  {
    id: 'bob-sepolia',
    name: 'BOB Sepolia (Testnet)',
    shortName: 'BOB Testnet',
    type: 'evm',
    status: 'live',
    testnet: true,
    chainId: 808813,
    rpcUrl: 'https://bob-sepolia.rpc.gobob.xyz',
    explorerUrl: 'https://bob-sepolia.explorer.gobob.xyz',
    addressFormat: 'evm',
    addressFormatLabel: '0x… (EVM)',
    exampleAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    feeUnit: 'ETH gas',
    confirmationLabel: 'BOB confirmation',
    nativeSymbol: 'ETH',
  },
  {
    id: 'arch',
    name: 'Arch Network',
    shortName: 'Arch',
    type: 'archvm',
    // Arch is NOT live with user funds yet. Keep this 'coming-soon'
    // (and sending disabled) until Arch's mainnet launch is verified
    // from Arch's own sources.
    status: 'coming-soon',
    testnet: false,
    chainId: null,
    rpcUrl: null,
    explorerUrl: null,
    addressFormat: 'arch',
    addressFormatLabel: 'arch1…',
    exampleAddress: 'arch1q3x7k9m2p8w4z6v5n0c9d8f7g6h5j4k3l2a1s9d7f6g5h',
    feeUnit: 'ARCH',
    confirmationLabel: 'Arch finality — not a Bitcoin confirmation',
    nativeSymbol: 'ARCH',
  },
]

export const CHAIN_MAP = Object.fromEntries(CHAINS.map((c) => [c.id, c]))

export function getChain(chainId) {
  return CHAIN_MAP[chainId] || null
}

export function isChainLive(chainId) {
  const chain = getChain(chainId)
  return !!chain && chain.status === 'live'
}

// Mock per-chain account addresses for this phase. These are example
// addresses only — there are NO real keys behind them. Phase 1+
// derives real addresses from the wallet seed.
export const MOCK_ADDRESSES = Object.fromEntries(
  CHAINS.map((c) => [c.id, c.exampleAddress]),
)
