// ═══════════════════════════════════════════
//   NUVRA WALLET — SHARED MOCK DATA & CONSTANTS
//   Chain-agnostic: every asset, transaction, recent and project is
//   tagged with a chain id from src/chains/registry.js
//   ('bitcoin' | 'bob' | 'bob-sepolia' | 'arch').
//   ALL of this is demo data — no real balances, no real funds.
//   Default views show Bitcoin L1 + BOB only; 'arch' rows exist so
//   the Arch adapter has data when Arch goes live, and are filtered
//   out by default everywhere.
// ═══════════════════════════════════════════

// Tokens used by swap flows. Default pairs are on BOB
// (e.g. BTC/USDC via BOB Gateway in a later phase) — there is no
// BTC→ARCH default rate anymore.
export const TOKENS = [
  { symbol: 'BTC',  name: 'Bitcoin',       chain: 'bitcoin', chainLabel: 'Bitcoin',    icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.18)',  balance: '0.042', fiat: '$2,841', rate: 51814.766129 },
  { symbol: 'WBTC', name: 'Wrapped BTC',   chain: 'bob',     chainLabel: 'BOB Mainnet', icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.18)',  balance: '0.010', fiat: '$676',   rate: 51814.766129 },
  { symbol: 'ETH',  name: 'Ethereum',      chain: 'bob',     chainLabel: 'BOB Mainnet', icon: 'Ξ', color: '#627eea', bg: 'rgba(98,126,234,0.18)',  balance: '0.5',   fiat: '$1,612', rate: 3142.5        },
  { symbol: 'USDC', name: 'USD Coin',      chain: 'bob',     chainLabel: 'BOB Mainnet', icon: '$', color: '#2775ca', bg: 'rgba(39,117,202,0.18)',  balance: '250',   fiat: '$250',   rate: 1             },
  { symbol: 'WBTC', name: 'Wrapped BTC',   chain: 'bob-sepolia', chainLabel: 'BOB Sepolia', icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.18)',  balance: '0.010', fiat: '$676',   rate: 51814.766129 },
  { symbol: 'ETH',  name: 'Ethereum',      chain: 'bob-sepolia', chainLabel: 'BOB Sepolia', icon: 'Ξ', color: '#627eea', bg: 'rgba(98,126,234,0.18)',  balance: '0.5',   fiat: '$1,612', rate: 3142.5        },
  { symbol: 'USDC', name: 'USD Coin',      chain: 'bob-sepolia', chainLabel: 'BOB Sepolia', icon: '$', color: '#2775ca', bg: 'rgba(39,117,202,0.18)',  balance: '250',   fiat: '$250',   rate: 1             },
  { symbol: 'BOB',  name: 'BOB',           chain: 'bob-sepolia', chainLabel: 'BOB Sepolia', icon: 'B', color: '#ff6b00', bg: 'rgba(255,107,0,0.18)',   balance: '1,000', fiat: '$18',    rate: 0.018         },
  { symbol: 'ARCH', name: 'Arch Network',  chain: 'arch-testnet', chainLabel: 'Arch Testnet', icon: '⬡', color: '#EC641D', bg: 'rgba(236,100,29,0.18)', balance: '1,250', fiat: '$1,850', rate: 1.48          },
]

export const ASSETS = [
  { symbol: 'BTC',  name: 'Bitcoin',      chain: 'bitcoin', chainLabel: 'Bitcoin',     icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', balance: '0.042 BTC',  fiat: '$2,841.20', change: '+2.4%',  up: true  },
  { symbol: 'WBTC', name: 'Wrapped BTC',  chain: 'bob',     chainLabel: 'BOB',         icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', balance: '0.020 WBTC', fiat: '$1,352.00', change: '+2.4%',  up: true  },
  { symbol: 'ETH',  name: 'Ethereum',     chain: 'bob',     chainLabel: 'BOB',         icon: 'Ξ', color: '#627eea', bg: 'rgba(98,126,234,0.15)', balance: '1.0 ETH',    fiat: '$3,225.00', change: '-1.2%',  up: false },
  { symbol: 'USDC', name: 'USD Coin',     chain: 'bob',     chainLabel: 'BOB',         icon: '$', color: '#2775ca', bg: 'rgba(39,117,202,0.15)', balance: '500 USDC',   fiat: '$500.00',   change: '0.0%',   up: true  },
  { symbol: 'BOB',  name: 'BOB',          chain: 'bob-sepolia', chainLabel: 'BOB Sepolia', icon: 'B', color: '#ff6b00', bg: 'rgba(255,107,0,0.15)',   balance: '1,000 BOB',  fiat: '$18.00',    change: '0.0%',   up: true  },
  { symbol: 'ARCH', name: 'Arch Network', chain: 'arch-testnet', chainLabel: 'Arch Testnet', icon: '⬡', color: '#EC641D', bg: 'rgba(236,100,29,0.15)', balance: '1,250 ARCH', fiat: '$1,850.00', change: '+5.1%',  up: true  },
  // Arch rows: kept for the future Arch adapter, filtered out by default.
  { symbol: 'ARCH', name: 'Arch Network', chain: 'arch',    chainLabel: 'Arch — coming soon', icon: '⬡', color: '#EC641D', bg: 'rgba(236,100,29,0.15)', balance: '1,250 ARCH', fiat: '$1,850.00', change: '+5.1%',  up: true  },
]

export const TRANSACTIONS = [
  // The Activity rows are the Figma design's own rows (frame 417-555),
  // verbatim: titles, amounts, the shared timestamp and statuses,
  // including the design's placeholder amounts.
  { id: 1, chain: 'bob',          type: 'bridge',  asset: 'BTC',      icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', amount: '-12223 BTC',     fiat: '', date: '2026-01-28', time: '09:07', status: 'confirmed', to: 'Bitcoin (via BOB Gateway)', hash: '0x5a7f...2d1e', fee: '0.00004 ETH', block: '#4,821,093', network: 'BOB → Bitcoin' },
  { id: 2, chain: 'bob',          type: 'swap',    asset: 'BTC/ARCH', icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', amount: '-1222 BTC/ARCH', fiat: '', date: '2026-01-28', time: '09:07', status: 'confirmed', to: 'Self',                      hash: '0x4f8a...9c3d', fee: '0.00004 ETH', block: '#4,821,100', network: 'BOB Mainnet' },
  { id: 3, chain: 'arch-testnet', type: 'send',    asset: 'ARCH',     icon: '⬡', color: '#EC641D', bg: 'rgba(236,100,29,0.15)', amount: '-100 ARCH',      fiat: '', date: '2026-01-28', time: '09:07', status: 'confirmed', to: 'arch1q3x...a1f2',           hash: '0x8b2c...1e4f', fee: '0.001 ARCH',  block: '#4,810,001', network: 'Arch Testnet' },
  { id: 4, chain: 'bitcoin',      type: 'receive', asset: 'BTC',      icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', amount: '+0.01 BTC',      fiat: '', date: '2026-01-28', time: '09:07', status: 'pending',   to: 'From: bc1p5d...3297',       hash: 'a1b2...c3d4',   fee: '0.0005 BTC',  block: 'Pending',   network: 'Bitcoin' },
  { id: 5, chain: 'bob',          type: 'swap',    asset: 'ETH',      icon: 'Ξ', color: '#627eea', bg: 'rgba(98,126,234,0.15)', amount: '-0.1 ETH',       fiat: '', date: '2026-01-28', time: '09:07', status: 'pending',   to: 'Self',                      hash: '0x3d9e...7a5b', fee: '0.00004 ETH', block: 'Pending',   network: 'BOB Mainnet' },
  { id: 6, chain: 'bob',          type: 'bridge',  asset: 'BTC',      icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', amount: '-12223 BTC',     fiat: '', date: '2026-01-28', time: '09:07', status: 'failed',    to: 'Bitcoin (via BOB Gateway)', hash: '0x9d4c...6e2b', fee: '0.00004 ETH', block: '—',         network: 'BOB → Bitcoin' },
]

// Discover listings. The first five are the projects on the Figma
// design's Discover frame, in the design's order, with the design's
// icons and descriptions (two descriptions are cut off in the frame
// itself and are completed minimally: Wasabi "UTXOs", Pups.fun
// "stacking", Anchorage "and institutions"). BOB Gateway and Pakt are
// the BOB features Nuvra needs, added after the design's list.
// Listings only — not live integrations in this build.
export const PROJECTS = [
  { id: 1, name: 'Autara',      chain: 'bitcoin', img: '/discover/icon_autara_dark.png', color: '#7a1f1f', icon: '✦', desc: 'The premier Bitcoin money market.',                              tags: ['DeFi'],   verified: false },
  { id: 2, name: 'Wasabi',      chain: 'bitcoin', img: '/discover/icon_wasabi.png',      color: '#222222', icon: '🌀', desc: 'Perps trading for runes, ordinals, and other UTXOs.',              tags: ['DeFi'],   verified: false },
  { id: 3, name: 'S1GNAL',      chain: 'bitcoin', img: '/discover/icon_s1gnal.png',      color: '#ff7a1a', icon: '✦', desc: 'The BTC growth engine.',                                           tags: ['Social'], verified: false },
  { id: 4, name: 'Pups.fun',    chain: 'bitcoin', img: '/discover/icon_pups.png',        color: '#2f7fe0', icon: '🐶', desc: 'The pups community hub. Risk it all by stacking.',                 tags: ['Social'], verified: false },
  { id: 5, name: 'Anchorage',   chain: 'bitcoin', img: '/discover/icon_anchorage.png',   color: '#111111', icon: '◆', desc: 'The trusted crypto platform for innovators and institutions.',     tags: ['Wallet'], verified: false },
  { id: 6, name: 'BOB Gateway', chain: 'bob',     img: '/discover/icon_bob.png',         color: '#EC641D', icon: '🌉', desc: 'Swap native BTC into BOB assets in one click.',                    tags: ['DeFi'],   verified: false },
  { id: 7, name: 'Pakt',        chain: 'bob',     img: '/discover/icon_pakt.png',        color: '#111111', icon: '🛡', desc: 'Trading guardrails by BOB. Set limits once, trade inside them.',   tags: ['DeFi'],   verified: false },
]

export const TRENDING = [
  { rank: 1, name: 'BTC',  sym: 'Bitcoin',     chain: 'bitcoin', icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', price: '$67,542', change: '+2.4%',  up: true,  hot: true  },
  { rank: 2, name: 'WBTC', sym: 'BOB Mainnet', chain: 'bob',     icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', price: '$67,542', change: '+2.4%',  up: true,  hot: false },
  { rank: 3, name: 'ETH',  sym: 'BOB Mainnet', chain: 'bob',     icon: 'Ξ', color: '#627eea', bg: 'rgba(98,126,234,0.15)', price: '$3,142',  change: '-1.2%',  up: false, hot: false },
  { rank: 4, name: 'USDC', sym: 'BOB Mainnet', chain: 'bob',     icon: '$', color: '#2775ca', bg: 'rgba(39,117,202,0.15)', price: '$1.00',   change: '0.0%',   up: true,  hot: false },
]

export const ABOUT_TEXTS = {
  'Autara':      'Listing from the Nuvra design. Autara is a Bitcoin money market for lending and borrowing.',
  'Wasabi':      'Listing from the Nuvra design. Wasabi offers perps trading for runes, ordinals, and other UTXOs.',
  'S1GNAL':      'Listing from the Nuvra design. S1GNAL is a BTC growth engine.',
  'Pups.fun':    'Listing from the Nuvra design. Pups.fun is the community hub for the PUPS rune community.',
  'Anchorage':   'Listing from the Nuvra design. Anchorage Digital is a custody and crypto platform for institutions.',
  'BOB Gateway': "BOB Gateway is BOB's native BTC deposit and swap layer. It is Nuvra's bridge path in a later phase.",
  'Pakt':        "Pakt is BOB's agent trading guardrails product. Planned as Nuvra's guard layer for automated actions in a later phase.",
}

export const TX_BADGE_COLORS = {
  send:    '#EC641D',
  receive: '#1fd090',
  swap:    '#6c5ce7',
  bridge:  '#0984e3',
}

export const RECENTS = [
  { name: 'Alice', initials: 'AL', color: 'linear-gradient(135deg,#EC641D,#ff5500)', chain: 'bob',     addr: '0x742d...f44e' },
  { name: 'Bob',   initials: 'BO', color: 'linear-gradient(135deg,#6c5ce7,#4834d4)', chain: 'bitcoin', addr: 'bc1p5d...3297' },
  { name: 'Carol', initials: 'CA', color: 'linear-gradient(135deg,#1fd090,#0cb877)', chain: 'bob',     addr: '0x8b2c...1e4f' },
  { name: 'Dave',  initials: 'DA', color: 'linear-gradient(135deg,#fd79a8,#e84393)', chain: 'bitcoin', addr: 'bc1qxy...9k2m' },
  // Arch recent: kept for the future Arch adapter, filtered out by default.
  { name: 'Erin',  initials: 'ER', color: 'linear-gradient(135deg,#EC641D,#BD5017)', chain: 'arch',    addr: 'arch1q3x...a1f2' },
]
