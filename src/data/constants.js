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
  { symbol: 'USDT', name: 'Tether USD',    chain: 'bob',     chainLabel: 'BOB Mainnet', icon: '$', color: '#2ca07f', bg: 'rgba(44,160,127,0.18)',  balance: '100',   fiat: '$100',   rate: 1             },
]

export const ASSETS = [
  { symbol: 'BTC',  name: 'Bitcoin',      chain: 'bitcoin', chainLabel: 'Bitcoin',     icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', balance: '0.042 BTC',  fiat: '$2,841.20', change: '+2.4%',  up: true  },
  { symbol: 'WBTC', name: 'Wrapped BTC',  chain: 'bob',     chainLabel: 'BOB Mainnet', icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', balance: '0.010 WBTC', fiat: '$676.00',   change: '+2.4%',  up: true  },
  { symbol: 'ETH',  name: 'Ethereum',     chain: 'bob',     chainLabel: 'BOB Mainnet', icon: 'Ξ', color: '#627eea', bg: 'rgba(98,126,234,0.15)', balance: '0.5 ETH',    fiat: '$1,612.50', change: '-1.2%',  up: false },
  { symbol: 'USDC', name: 'USD Coin',     chain: 'bob',     chainLabel: 'BOB Mainnet', icon: '$', color: '#2775ca', bg: 'rgba(39,117,202,0.15)', balance: '250 USDC',   fiat: '$250.00',   change: '0.0%',   up: true  },
  { symbol: 'USDT', name: 'Tether USD',   chain: 'bob',     chainLabel: 'BOB Mainnet', icon: '$', color: '#2ca07f', bg: 'rgba(44,160,127,0.15)', balance: '100 USDT',   fiat: '$100.00',   change: '0.0%',   up: true  },
  // Arch rows: kept for the future Arch adapter, filtered out by default.
  { symbol: 'ARCH', name: 'Arch Network', chain: 'arch',    chainLabel: 'Arch — coming soon', icon: '⬡', color: '#EC641D', bg: 'rgba(236,100,29,0.15)', balance: '1,250 ARCH', fiat: '$1,850.00', change: '+5.1%',  up: true  },
]

export const TRANSACTIONS = [
  { id: 1,  chain: 'bob',     type: 'swap',    asset: 'BTC',  icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', amount: '+0.002 BTC',  fiat: '$135',     date: '2026-01-28', time: '09:00', status: 'confirmed', to: 'Self',                hash: '0x4f8a...9c3d', fee: '0.00004 ETH', block: '#4,821,093', network: 'BOB Mainnet' },
  { id: 2,  chain: 'bitcoin', type: 'receive', asset: 'BTC',  icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', amount: '+0.01 BTC',   fiat: '$676',     date: '2026-01-28', time: '09:07', status: 'confirmed', to: 'From: bc1p5d...3297', hash: 'a1b2...c3d4',   fee: '0.0005 BTC',  block: '#881,204',   network: 'Bitcoin' },
  { id: 3,  chain: 'bob',     type: 'send',    asset: 'USDC', icon: '$', color: '#2775ca', bg: 'rgba(39,117,202,0.15)', amount: '-100 USDC',   fiat: '$100',     date: '2026-01-28', time: '09:07', status: 'confirmed', to: '0x742d...f44e',       hash: '0x3d9e...7a5b', fee: '0.00004 ETH', block: '#4,821,100', network: 'BOB Mainnet' },
  { id: 4,  chain: 'bob',     type: 'receive', asset: 'USDC', icon: '$', color: '#2775ca', bg: 'rgba(39,117,202,0.15)', amount: '+250 USDC',   fiat: '$250',     date: '2026-01-25', time: '14:22', status: 'confirmed', to: 'From: 0x8b2c...1e4f', hash: '0x9d4c...6e2b', fee: '0.00004 ETH', block: '#4,818,440', network: 'BOB Mainnet' },
  { id: 5,  chain: 'bitcoin', type: 'send',    asset: 'BTC',  icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', amount: '-0.005 BTC',  fiat: '$338',     date: '2026-01-25', time: '11:05', status: 'confirmed', to: 'bc1qxy...9k2m',       hash: 'e5f6...a7b8',   fee: '0.00012 BTC', block: '#881,050',   network: 'Bitcoin' },
  { id: 6,  chain: 'bob',     type: 'bridge',  asset: 'BTC',  icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', amount: '-0.01 BTC',   fiat: '$676',     date: '2026-01-20', time: '16:48', status: 'pending',   to: 'Bitcoin (via BOB Gateway)', hash: '0x5a7f...2d1e', fee: '0.00004 ETH', block: 'Pending', network: 'BOB → Bitcoin' },
  // Arch row: kept for the future Arch adapter, filtered out by default.
  { id: 7,  chain: 'arch',    type: 'send',    asset: 'ARCH', icon: '⬡', color: '#EC641D', bg: 'rgba(236,100,29,0.15)', amount: '-100 ARCH',   fiat: '$148',     date: '2026-01-18', time: '08:30', status: 'confirmed', to: 'arch1q3x...a1f2',     hash: '0x8b2c...1e4f', fee: '0.001 ARCH',  block: '#4,810,001', network: 'Arch Network' },
]

// Discover entries are DEMO entries only — they are not live
// integrations, carry no TVL, and make no claim about any protocol.
// Real Discover listings arrive per chain in a later phase.
export const PROJECTS = [
  { id: 1, name: 'BOB Gateway (Demo)',    chain: 'bob',     img: null, color: '#EC641D', icon: '🌉', desc: 'Demo entry — native BTC deposits and swaps into BOB, in one click.', tags: ['DeFi'],           verified: false, demo: true },
  { id: 2, name: 'BOB Swap (Demo)',       chain: 'bob',     img: null, color: '#6c5ce7', icon: '🔁', desc: 'Demo entry — swap BTC and stablecoins on BOB.',                        tags: ['DeFi'],           verified: false, demo: true },
  { id: 3, name: 'BOB Earn (Demo)',       chain: 'bob',     img: null, color: '#1fd090', icon: '🌱', desc: 'Demo entry — put BTC to work on BOB. Not a live integration.',          tags: ['DeFi', 'Wallet'], verified: false, demo: true },
  { id: 4, name: 'BTC Vault (Demo)',      chain: 'bitcoin', img: null, color: '#f7931a', icon: '🔐', desc: 'Demo entry — save and track native BTC. Not a live integration.',       tags: ['Wallet'],         verified: false, demo: true },
  { id: 5, name: 'BTC Pay (Demo)',        chain: 'bitcoin', img: null, color: '#0984e3', icon: '⚡', desc: 'Demo entry — pay with native BTC. Not a live integration.',             tags: ['Social', 'Wallet'], verified: false, demo: true },
  { id: 6, name: 'Arch App (Demo)',       chain: 'arch',    img: null, color: '#EC641D', icon: '⬡', desc: 'Demo entry — Arch is not live yet; this listing is a placeholder.',     tags: ['DeFi'],           verified: false, demo: true },
]

export const TRENDING = [
  { rank: 1, name: 'BTC',  sym: 'Bitcoin',     chain: 'bitcoin', icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', price: '$67,542', change: '+2.4%',  up: true,  hot: true  },
  { rank: 2, name: 'WBTC', sym: 'BOB Mainnet', chain: 'bob',     icon: '₿', color: '#f7931a', bg: 'rgba(247,147,26,0.15)', price: '$67,542', change: '+2.4%',  up: true,  hot: false },
  { rank: 3, name: 'ETH',  sym: 'BOB Mainnet', chain: 'bob',     icon: 'Ξ', color: '#627eea', bg: 'rgba(98,126,234,0.15)', price: '$3,142',  change: '-1.2%',  up: false, hot: false },
  { rank: 4, name: 'USDC', sym: 'BOB Mainnet', chain: 'bob',     icon: '$', color: '#2775ca', bg: 'rgba(39,117,202,0.15)', price: '$1.00',   change: '0.0%',   up: true,  hot: false },
  { rank: 5, name: 'USDT', sym: 'BOB Mainnet', chain: 'bob',     icon: '$', color: '#2ca07f', bg: 'rgba(44,160,127,0.15)', price: '$1.00',   change: '0.0%',   up: true,  hot: false },
]

export const ABOUT_TEXTS = {
  'BOB Gateway (Demo)': 'Demo entry only. BOB Gateway is BOB\'s native BTC deposit and swap layer; Nuvra does not integrate it in this build.',
  'BOB Swap (Demo)':    'Demo entry only. A placeholder for swapping BTC and stablecoins on BOB in a later phase.',
  'BOB Earn (Demo)':    'Demo entry only. A placeholder for BTC yield products on BOB; nothing here is a live integration.',
  'BTC Vault (Demo)':   'Demo entry only. A placeholder for native BTC savings on Bitcoin L1.',
  'BTC Pay (Demo)':     'Demo entry only. A placeholder for paying with native BTC.',
  'Arch App (Demo)':    'Demo entry only. Arch is not live yet, so this listing is a placeholder with no integration behind it.',
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
