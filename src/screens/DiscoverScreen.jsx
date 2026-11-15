import React, { useState, useMemo } from 'react'
import { PROJECTS } from '../data/constants'
import { useWallet } from '../wallet/WalletContext'

const CATS = ['All', 'Wallet', 'Social', 'DeFi']

function VerifiedBadge() {
  return (
    <div style={{ width:16, height:16, borderRadius:'50%', background:'#0984e3', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  )
}

function ProjectIcon({ p, size=48 }) {
  if (p.img) return <img src={p.img} alt={p.name} style={{ width:size, height:size, borderRadius:size*0.3, objectFit:'cover', flexShrink:0 }}/>
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.3, background: p.color ? `${p.color}22` : 'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${p.color ? p.color+'33' : 'rgba(255,255,255,0.1)'}` }}>
      <span style={{ fontSize:size*0.4, color: p.color || '#fff', fontWeight:700, fontFamily:'Syne,sans-serif' }}>{p.name[0]}</span>
    </div>
  )
}

export default function DiscoverScreen() {
  const [cat,     setCat]     = useState('All')
  const [search,  setSearch]  = useState('')
  const [focused, setFocused] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const { selectedChainId } = useWallet()

  const filtered = useMemo(() => PROJECTS.filter(p => {
    // Projects follow the selected chain; 'all' shows live chains only.
    const mchain = selectedChainId === 'all' ? p.chain !== 'arch' : p.chain === selectedChainId
    const mc = cat === 'All' || p.tags.some(t => t.toLowerCase() === cat.toLowerCase())
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase())
    return mchain && mc && ms
  }), [cat, search, selectedChainId])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#101010', position:'relative', overflow:'hidden' }}>

      {/* Buildings background */}
      <img src="/discover/bg_buildings.png" alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', opacity:0.45, pointerEvents:'none', zIndex:0 }}/>
      {/* Dark overlay to keep text readable */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(13,13,20,0.3) 0%, rgba(13,13,20,0.6) 40%, rgba(13,13,20,0.92) 75%, #101010 100%)', pointerEvents:'none', zIndex:0 }}/>

      {/* Ambient glow */}
      <div style={{ position:'absolute', top:-60, right:-60, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(236,100,29,0.08),transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 0', flexShrink:0, position:'relative', zIndex:3 }}>
        <img src="/logo_nv_orange.png" alt="NV" style={{ width:36, height:24, objectFit:'contain' }}/>

        {/* Search bar */}
        <div style={{ flex:1, margin:'0 12px', display:'flex', alignItems:'center', gap:8, background: focused ? 'rgba(236,100,29,0.06)' : 'rgba(255,255,255,0.06)', border:`1px solid ${focused ? '#EC641D' : 'rgba(255,255,255,0.1)'}`, borderRadius:12, padding:'9px 12px', transition:'all 0.2s' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3"/><path d="M10 10L13 13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.3" strokeLinecap="round"/></svg>
          <input placeholder="Search or type URL" value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:13 }}/>
          {search && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ cursor:'pointer', opacity:0.5 }} onClick={() => setSearch('')}><path d="M2 2L10 10M10 2L2 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round"/></svg>}
        </div>

        {/* Notification + count */}
        <div style={{ position:'relative' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 5C13 3 11 1.5 8 1.5C5 1.5 3 3 3 5C3 8.5 1.5 10 1.5 10H14.5C14.5 10 13 8.5 13 5Z" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" fill="none"/><path d="M9.3 13C9.1 13.5 8.6 13.8 8 13.8C7.4 13.8 6.9 13.5 6.7 13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>
          <div style={{ position:'absolute', top:-4, right:-4, width:18, height:18, borderRadius:'50%', background:'#EC641D', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>1</div>
        </div>
      </div>

      <div className="scroll-body" style={{ padding:'0', position:'relative', zIndex:2 }}>

        {/* Banner */}
        {!search && showBanner && (
          <div style={{ margin:'14px 20px 0', position:'relative', cursor:'pointer' }}>
            <img
              src="/home/banner_ad.png"
              alt="Banner"
              style={{ width:'100%', borderRadius:16, display:'block', objectFit:'cover' }}
            />
            <div onClick={() => setShowBanner(false)}
              style={{ position:'absolute', top:10, right:10, width:24, height:24,
                borderRadius:'50%', background:'rgba(0,0,0,0.45)',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        )}

        {/* Discover header */}
        {!search && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'Syne,sans-serif', fontSize:17, fontWeight:800, color:'#fff' }}>
              Discover
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </div>
        )}
        {!search && (
          <div style={{ padding:'0 20px 10px', fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'DM Sans,sans-serif', position:'relative', zIndex:2 }}>
            Demo entries for the selected chain — not live integrations.
          </div>
        )}

        {/* Category tabs */}
        <div style={{ display:'flex', gap:8, padding: search ? '14px 20px 12px' : '0 20px 14px', overflowX:'auto', scrollbarWidth:'none', flexShrink:0 }}>
          {CATS.map(c => (
            <div key={c} onClick={() => setCat(c)} style={{ padding:'7px 18px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'all 0.2s',
              background: cat===c ? '#EC641D' : 'rgba(255,255,255,0.05)',
              color: cat===c ? '#fff' : 'rgba(255,255,255,0.5)',
              border:`1px solid ${cat===c ? '#EC641D' : 'rgba(255,255,255,0.08)'}`,
            }}>{c}</div>
          ))}
        </div>

        {/* Project list rows */}
        <div style={{ padding:'0 20px 24px', display:'flex', flexDirection:'column', gap:0 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 0', color:'rgba(255,255,255,0.25)' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
              <div style={{ fontSize:14, fontWeight:600 }}>No projects found</div>
            </div>
          ) : filtered.map((p, i) => (
            <div key={p.id}
              style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0',
                borderBottom: i < filtered.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                cursor:'pointer', transition:'opacity 0.15s', animation:`fadeUp 0.25s ${i*0.04}s ease both` }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>

              <ProjectIcon p={p} size={52}/>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <div style={{ fontSize:15, fontWeight:600, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{p.name}</div>
                  {p.verified && <VerifiedBadge/>}
                  {p.demo && <span style={{ fontSize:9, fontWeight:700, letterSpacing:0.5, color:'#EC641D', background:'rgba(236,100,29,0.12)', border:'1px solid rgba(236,100,29,0.3)', borderRadius:6, padding:'1px 5px', fontFamily:'DM Sans,sans-serif' }}>DEMO</span>}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', fontFamily:'DM Sans,sans-serif', lineHeight:1.4,
                  overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical' }}>
                  {p.desc}
                </div>
              </div>

              <button style={{ padding:'7px 14px', borderRadius:10, background:'rgba(236,100,29,0.12)', border:'1px solid rgba(236,100,29,0.25)', color:'#EC641D', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'DM Sans,sans-serif', flexShrink:0 }}>
                Explore
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
