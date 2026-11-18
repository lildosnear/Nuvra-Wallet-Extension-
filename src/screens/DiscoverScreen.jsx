import React, { useState, useMemo } from 'react'
import { PROJECTS, ABOUT_TEXTS } from '../data/constants'
import { useWallet } from '../wallet/WalletContext'
import PromoBanner from '../components/PromoBanner'

const CATS = ['All', 'Wallet', 'Social', 'DeFi']

function ProjectIcon({ p, size=48 }) {
  if (p.img) return <img src={p.img} alt={p.name} style={{ width:size, height:size, borderRadius:size*0.3, objectFit:'cover', flexShrink:0 }}/>
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.3, background: p.color ? `${p.color}22` : 'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${p.color ? p.color+'33' : 'rgba(255,255,255,0.1)'}` }}>
      <span style={{ fontSize:size*0.44, lineHeight:1 }}>{p.icon || p.name[0]}</span>
    </div>
  )
}

// ── Project detail sheet ──────────────────────────────────────────────────────
function ProjectSheet({ p, onClose }) {
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.85)', zIndex:90,
      display:'flex', alignItems:'flex-end', backdropFilter:'blur(8px)' }} onClick={onClose}>
      <div style={{ width:'100%', background:'#101010', borderRadius:'24px 24px 0 0',
        border:'1px solid rgba(255,255,255,0.1)', borderBottom:'none',
        padding:'0 20px 40px', animation:'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 0 18px' }}>
          <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:18, fontWeight:700, color:'#fff' }}>Project</div>
          <div onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', background:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
          <ProjectIcon p={p} size={56}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{p.name}</div>
              
            </div>
            <div style={{ fontSize:12, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>{p.tags.join(' · ')}</div>
          </div>
        </div>

        <div style={{ fontSize:13, color:'#959595', fontFamily:'DM Sans,sans-serif', lineHeight:1.65 }}>
          {ABOUT_TEXTS[p.name] || p.desc}
        </div>
      </div>
    </div>
  )
}

export default function DiscoverScreen() {
  const [cat,     setCat]     = useState('All')
  const [search,  setSearch]  = useState('')
  const [selected, setSelected] = useState(null)
  const { selectedChainId } = useWallet()

  const filtered = useMemo(() => PROJECTS.filter(p => {
    // Projects follow the selected chain; 'all' shows live chains only.
    // Testnets inherit their mainnet family's listings (same products,
    // test deployments): BOB Sepolia shows the BOB entries, Arch
    // Testnet shows the Arch entry.
    const family = { 'bob-sepolia': ['bob-sepolia', 'bob'], 'arch-testnet': ['arch-testnet', 'arch'] }
    const mchain = selectedChainId === 'all'
      ? p.chain !== 'arch'
      : (family[selectedChainId] || [selectedChainId]).includes(p.chain)
    const mc = cat === 'All' || p.tags.some(t => t.toLowerCase() === cat.toLowerCase())
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return mchain && mc && ms
  }), [cat, search, selectedChainId])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#101010', position:'relative', overflow:'hidden' }}>

      {/* Background image — the design's city backdrop for this screen */}
      <img src="/discover/bg_buildings.png" alt=""
        style={{ position:'absolute', left:0, right:0, bottom:0, width:'100%', height:'64%', objectFit:'cover', pointerEvents:'none', zIndex:0,
          }}/>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:1,
        background:'linear-gradient(180deg, #101010 26%, rgba(16,16,16,0.6) 52%, rgba(16,16,16,0) 75%)' }}/>

      {/* TOP BAR — mark, search pill with menu icon inside, count button. No bell, no avatar. */}
      <div style={{ display:'flex', alignItems:'center', padding:'16px 20px 0', flexShrink:0, position:'relative', zIndex:3 }}>
        <img src="/logo_nv_orange.png" alt="NV" style={{ width:49, height:22, objectFit:'contain' }}/>

        {/* Search pill */}
        <div style={{ flex:1, margin:'0 12px', display:'flex', alignItems:'center', gap:8, background:'#1F1F1F', borderRadius:24, padding:'0 14px', height:44, boxSizing:'border-box' }}>
          <input placeholder="Search or type URL" value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:13, minWidth:0 }}/>
          {search && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ cursor:'pointer', opacity:0.5, flexShrink:0 }} onClick={() => setSearch('')}><path d="M2 2L10 10M10 2L2 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round"/></svg>}
          {/* Menu (≡) icon inside the pill, right */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0 }}>
            <path d="M2 4H14M2 8H14M2 12H14" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Count button — black square with "1" */}
        <div style={{ width:40, height:40, borderRadius:10, background:'#000', border:'1px solid rgba(255,255,255,0.1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:14, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>
          1
        </div>
      </div>

      <div className="scroll-body" style={{ padding:'0', position:'relative', zIndex:2 }}>

        {/* Banner — same component as Home */}
        {!search && <PromoBanner style={{ margin:'14px 20px 0' }}/>}

        {/* Discover header */}
        {!search && (
          <div style={{ padding:'18px 20px 4px', fontFamily:'DM Sans,sans-serif', fontSize:18, fontWeight:700, color:'#fff' }}>
            Discover &gt;
          </div>
        )}

        {/* Category filter row — "All" is a gradient pill; the rest are plain text */}
        <div style={{ display:'flex', alignItems:'center', gap:22, padding: search ? '16px 20px 14px' : '2px 20px 14px', overflowX:'auto', scrollbarWidth:'none', flexShrink:0 }}>
          {CATS.map(c => {
            const active = cat === c
            if (c === 'All') {
              return active ? (
                <div key={c} onClick={() => setCat(c)} style={{ padding:'7px 18px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                  background:'linear-gradient(135deg,#EF5200,#EC641D)', color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{c}</div>
              ) : (
                <div key={c} onClick={() => setCat(c)} style={{ fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
                  color:'#959595', fontFamily:'DM Sans,sans-serif' }}>{c}</div>
              )
            }
            return (
              <div key={c} onClick={() => setCat(c)} style={{ fontSize:13, fontWeight: active ? 700 : 500, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'color 0.2s',
                color: active ? '#fff' : '#959595', fontFamily:'DM Sans,sans-serif' }}>{c}</div>
            )
          })}
        </div>

        {/* Project list rows */}
        <div style={{ padding:'0 20px 24px', display:'flex', flexDirection:'column' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>No projects found</div>
            </div>
          ) : filtered.map((p, i) => (
            <div key={p.id}
              onClick={() => setSelected(p)}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px',
                background:'#1A1A1A', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16,
                minHeight:64, boxSizing:'border-box', marginBottom:10,
                cursor:'pointer', transition:'background 0.15s', animation:`fadeUp 0.25s ${i*0.04}s ease both` }}
              onMouseEnter={e => e.currentTarget.style.background='#1F1F1F'}
              onMouseLeave={e => e.currentTarget.style.background='#1A1A1A'}>

              <ProjectIcon p={p} size={48}/>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  
                </div>
                <div style={{ fontSize:11, color:'#959595', fontFamily:'DM Sans,sans-serif',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {p.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project detail sheet */}
      {selected && <ProjectSheet p={selected} onClose={() => setSelected(null)}/>}
    </div>
  )
}
