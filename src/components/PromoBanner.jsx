import React, { useState } from 'react'

// Promo banner — Figma layout: dark card r16, headline + sub-copy left,
// coin art right, X close top-right. banner_ad.png carries no baked text
// (it is a lattice pattern), so it is used only as a faint card texture
// under composed text, per the Figma fix brief.
export default function PromoBanner({ style }) {
  const [show, setShow] = useState(true)
  if (!show) return null

  return (
    <div style={{
      position: 'relative', borderRadius: 16, overflow: 'hidden',
      background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)',
      padding: '16px 64px 16px 16px', minHeight: 84,
      display: 'flex', alignItems: 'center', cursor: 'pointer',
      ...style,
    }}>
      {/* Lattice texture from the existing banner art (no baked words) */}
      <img src="/home/banner_ad.png" alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', opacity: 0.14, pointerEvents: 'none',
      }}/>

      {/* Copy */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans,sans-serif', lineHeight: 1.45, marginBottom: 4 }}>
          The Bitcoin-aligned gateway to the Bitcoin ecosystem.
        </div>
        <div style={{ fontSize: 11, color: '#959595', fontFamily: 'DM Sans,sans-serif' }}>
          Explore and earn
        </div>
      </div>

      {/* Coin art */}
      <img src="/home/coin_btc_3d.png" alt="" style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        width: 58, height: 58, objectFit: 'contain', zIndex: 1, pointerEvents: 'none',
      }}/>

      {/* Close */}
      <div onClick={(e) => { e.stopPropagation(); setShow(false) }}
        style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, zIndex: 2,
          borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}
