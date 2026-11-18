import React, { useState, useMemo } from 'react'
import { TRANSACTIONS } from '../data/constants'
import { useWallet } from '../wallet/WalletContext'

const TOKEN_IMG = {
  BTC:  '/home/token_btc.png',
  ARCH: '/home/token_arch.png',
  ETH:  '/home/token_eth.png',
  USDC: '/home/token_usdc.png',
  WBTC: '/home/token_btc.png',
  tBTC: '/home/token_btc.png',
}

const TYPE_NAV_ICON = {
  bridge:  '/nav_bridge.png',
  swap:    '/nav_swap.png',
  send:    '/home/icon_action_send.png',
  receive: '/home/icon_action_receive.png',
}


// Status pills exactly as the design paints them: bright fills with
// dark text — Completed, Pending and Failed alike (the design's Failed
// pill is the same bright green as Completed).
const STATUS = {
  confirmed: { bg:'#1FD090',  color:'#06301F', label:'Completed' },
  completed: { bg:'#1FD090',  color:'#06301F', label:'Completed' },
  pending:   { bg:'#D8B26A',  color:'#3A2A08', label:'Pending'   },
  failed:    { bg:'#1FD090',  color:'#06301F', label:'Failed'    },
}

const FILTERS = [
  { id:'All',     label:'All',     icon: null },
  { id:'Bridge',  label:'Bridge',  icon:'bridge' },
  { id:'Swap',    label:'Swap',    icon:'swap'   },
  { id:'Send',    label:'Send',    icon:'send'   },
]

// White outline type glyphs, the design's own icon set for this screen:
// planet with a ring (bridge), double arrow (swap), up arrow (send),
// QR grid (receive). Used in the filter chips and the row discs.
function TypeGlyph({ type, size = 18 }) {
  const common = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'#fff', strokeWidth:1.7, strokeLinecap:'round', strokeLinejoin:'round' }
  if (type === 'bridge') return (
    <svg {...common}>
      <circle cx="12" cy="12" r="4.6"/>
      <ellipse cx="12" cy="12" rx="9.6" ry="3.4" transform="rotate(-18 12 12)"/>
    </svg>
  )
  if (type === 'swap') return (
    <svg {...common}>
      <path d="M4 7.5h12.5M13.5 3.8 17.2 7.5l-3.7 3.7"/>
      <path d="M20 16.5H7.5M10.5 12.8l-3.7 3.7 3.7 3.7"/>
    </svg>
  )
  if (type === 'send') return (
    <svg {...common}>
      <path d="M12 20V5.5M6.2 11 12 5.2 17.8 11"/>
    </svg>
  )
  // receive — QR grid
  return (
    <svg {...common}>
      <rect x="4" y="4" width="6.4" height="6.4" rx="1.6"/>
      <rect x="13.6" y="4" width="6.4" height="6.4" rx="1.6"/>
      <rect x="4" y="13.6" width="6.4" height="6.4" rx="1.6"/>
      <path d="M13.6 13.6h2.8v2.8h-2.8zM17.2 17.2H20V20h-2.8z" fill="#fff" stroke="none"/>
    </svg>
  )
}

export default function ActivityScreen() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const { selectedChainId } = useWallet()

  const rows = useMemo(() => TRANSACTIONS.map(tx => ({
    ...tx,
    label: `${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} ${tx.asset}`,
    date: `${tx.date} ${tx.time}`,
  })), [])

  const filtered = useMemo(() => rows.filter(tx => {
    // History follows the selected chain; testnets inherit their
    // mainnet family's rows, and 'all' hides the not-yet-live Arch rows.
    const family = { 'bob-sepolia': ['bob-sepolia', 'bob'], 'arch-testnet': ['arch-testnet', 'arch'] }
    const mchain = selectedChainId === 'all'
      ? tx.chain !== 'arch'
      : (family[selectedChainId] || [selectedChainId]).includes(tx.chain)
    const mf = filter === 'All' || tx.type.toLowerCase() === filter.toLowerCase()
    const ms = !search || tx.label.toLowerCase().includes(search.toLowerCase())
    return mchain && mf && ms
  }), [filter, search, rows, selectedChainId])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#101010' }}>

      {/* TOP NAV */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 0', flexShrink:0 }}>
        <img src="/logo_nv_orange.png" alt="NV" style={{ width:49, height:22, objectFit:'contain' }}/>
        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:700, color:'#fff' }}>Activity</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity:0.55 }}>
            <path d="M17 5C17 2.8 13.9 1 10 1C6.1 1 3 2.8 3 5C3 9 1 11 1 11H19C19 11 17 9 17 5Z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" fill="none"/>
            <path d="M11.7 15C11.4 15.6 10.8 16 10 16C9.2 16 8.6 15.6 8.3 15" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <img src="/home/avatar.png" alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(236,100,29,0.45)' }}/>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div style={{ margin:'12px 16px 0', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ flex:1, background:'#1F1F1F', borderRadius:24, padding:'0 14px', height:48, boxSizing:'border-box', display:'flex', alignItems:'center', gap:10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4"/>
            <path d="M11.5 11.5L14 14" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:13 }}
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ cursor:'pointer', opacity:0.4 }} onClick={() => setSearch('')}>
              <path d="M2 2L10 10M10 2L2 10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        {/* Filter button — orange gradient circle */}
        <div style={{
          width:48, height:48, borderRadius:'50%',
          background:'linear-gradient(135deg,#F0834A,#EC641D)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', flexShrink:0,
          boxShadow:'0 4px 14px rgba(236,100,29,0.4)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="Filter">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="2.4" fill="#EE7434" stroke="#fff" strokeWidth="1.6"/>
            <circle cx="15" cy="12" r="2.4" fill="#EC641D" stroke="#fff" strokeWidth="1.6"/>
            <circle cx="8" cy="17" r="2.4" fill="#EC641D" stroke="#fff" strokeWidth="1.6"/>
          </svg>
        </div>
      </div>

      {/* FILTER TABS — one black rounded container, as in the design:
          All is the orange gradient pill; the rest are white icon + white
          text on transparent, inside the same container. */}
      <div style={{ margin:'12px 16px 0', background:'#000', borderRadius:16, padding:6, display:'flex', gap:4, overflowX:'auto', scrollbarWidth:'none', flexShrink:0 }}>
        {FILTERS.map(f => {
          const active = filter === f.id
          return (
            <div key={f.id} onClick={() => setFilter(f.id)} style={{
              display:'flex', alignItems:'center', gap:6,
              padding: f.id === 'All' ? '7px 18px' : '7px 12px',
              borderRadius:12, fontSize:13, fontWeight:600,
              cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.2s',
              background: active ? 'linear-gradient(135deg,#F0834A,#EC641D)' : 'transparent',
              color:'#fff',
            }}>
              {f.icon && <TypeGlyph type={f.icon} size={14}/>}
              {f.label}
            </div>
          )
        })}
      </div>

      {/* TX LIST */}
      <div className="scroll-body" style={{ padding:'10px 16px' }}>
        {filtered.map((tx, i) => {
          const st = STATUS[tx.status] || STATUS.completed

          return (
            <div key={tx.id} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
              background:'#000',
              borderRadius:16, marginBottom:8, minHeight:64, boxSizing:'border-box',
              cursor:'pointer', transition:'background 0.15s',
              animation:`fadeUp 0.22s ${i*0.04}s ease both`,
            }}
              onMouseEnter={e => e.currentTarget.style.background='#0D0D0D'}
              onMouseLeave={e => e.currentTarget.style.background='#000'}
            >
              {/* Type icon — white outline glyph in a dark disc, as in the design */}
              <div style={{
                width:40, height:40, borderRadius:'50%',
                background:'#262626',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0,
              }}>
                <TypeGlyph type={tx.type} size={19}/>
              </div>

              {/* Label + date */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif', marginBottom:3 }}>{tx.label}</div>
                <div style={{ fontSize:11, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>{tx.date}</div>
              </div>

              {/* Amount + status */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginBottom:5 }}>
                  {tx.asset.split('/').map((sym, k) => TOKEN_IMG[sym] && (
                    <img key={sym} src={TOKEN_IMG[sym]} alt="" style={{ width:16, height:16, borderRadius:'50%', marginLeft: k > 0 ? -8 : 0, border:'1.5px solid #000', position:'relative', zIndex: 2 - k }}/>
                  ))}
                  <span style={{ fontSize:12, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>
                    {tx.amount}
                  </span>
                </div>
                <div style={{
                  display:'inline-flex', alignItems:'center', height:24, padding:'0 10px',
                  borderRadius:12, background:st.bg, color:st.color,
                  fontSize:10, fontWeight:700, fontFamily:'DM Sans,sans-serif',
                }}>
                  {st.label}
                </div>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:13, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>No activity yet</div>
          </div>
        )}
        <div style={{ height:16 }}/>
      </div>
    </div>
  )
}
