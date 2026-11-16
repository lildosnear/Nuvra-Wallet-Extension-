import React, { useState, useRef } from 'react'

const ROWS = [['1','2','3'],['4','5','6'],['7','8','9'],['.','0','←']]
const SAVED_PIN = '1234' // In production this would come from secure storage

/**
 * PinModal — FULL-SCREEN overlay that asks the user to enter their PIN,
 * using the same layout as PinScreen (Figma uses the full-screen PIN,
 * not a bottom sheet).
 * onSuccess() is called when the correct PIN is entered.
 * onCancel() is called when the user dismisses (Back pill).
 */
export default function PinModal({ onSuccess, onCancel, title = 'Enter Pin code' }) {
  const [pin,   setPin]   = useState('')
  const [state, setState] = useState('idle') // idle | error | success
  const wrapRef = useRef(null)
  const MAX = 4

  const press = (k) => {
    if (state === 'success') return
    if (k === '←') { setPin(p => p.slice(0,-1)); if (state==='error') setState('idle'); return }
    if (k === '.') return
    if (pin.length >= MAX) return
    const next = pin + k
    setPin(next)
    if (next.length === MAX) setTimeout(() => evaluate(next), 160)
  }

  const evaluate = (entered) => {
    if (entered === SAVED_PIN) {
      setState('success')
      setTimeout(onSuccess, 700)
    } else {
      setState('error')
      if (wrapRef.current) {
        wrapRef.current.style.animation = 'pin_shake 0.45s ease'
        setTimeout(() => { if(wrapRef.current) wrapRef.current.style.animation = '' }, 460)
      }
      setTimeout(() => { setPin(''); setState('idle') }, 900)
    }
  }

  const dotColor = (i) => {
    if (i < pin.length) {
      if (state === 'error')   return '#ff5500'
      if (state === 'success') return '#1fd090'
      return '#EC641D'
    }
    return '#ffffff'
  }

  return (
    <>
      <style>{`
        @keyframes pin_shake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-7px)} 30%{transform:translateX(7px)}
          45%{transform:translateX(-5px)} 60%{transform:translateX(5px)}
          75%{transform:translateX(-3px)} 90%{transform:translateX(3px)}
        }
        @keyframes pinFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Full-screen overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#101010',
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
        animation: 'pinFadeIn 0.25s ease',
      }}>

        {/* ── TOP: NV logo (left) + Back pill (right) ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 0', flexShrink: 0,
        }}>
          <img src="/logo_nv_orange.png" alt="NV" style={{ width:49, height:22, objectFit:'contain', flexShrink:0 }}/>
          <div onClick={onCancel}
            style={{
              width: 64, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#1F1F1F', borderRadius: 20,
              fontSize: 13, color: '#959595',
              fontFamily: 'DM Sans,sans-serif',
              cursor: 'pointer', userSelect: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#2A2A2A'}
            onMouseLeave={e => e.currentTarget.style.background = '#1F1F1F'}
          >
            Back
          </div>
        </div>

        {/* Lock icon */}
        <div style={{ display:'flex', justifyContent:'center', paddingTop:16, flexShrink:0 }}>
          <img src="/pin/lock.png" alt="Lock" style={{
            width: 88, height: 'auto', objectFit: 'contain',
            filter: state === 'success'
              ? 'hue-rotate(90deg) saturate(1.3) drop-shadow(0 10px 24px rgba(31,208,144,0.4))'
              : state === 'error'
              ? 'saturate(0.4) drop-shadow(0 10px 24px rgba(255,85,0,0.35))'
              : 'drop-shadow(0 10px 24px rgba(236,100,29,0.35))',
            transition: 'filter 0.35s ease',
          }}/>
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center', fontSize: 20, fontWeight: 700,
          color: '#fff', fontFamily: 'DM Sans,sans-serif',
          marginTop: 24, marginBottom: 4, flexShrink: 0,
        }}>{title}</div>

        {/* Subtitle — wrong pin */}
        <div style={{
          textAlign: 'center', fontSize: 12,
          color: state === 'error' ? '#ff5500' : 'transparent',
          fontFamily: 'DM Sans,sans-serif', marginBottom: 14,
          transition: 'color 0.2s', flexShrink: 0,
        }}>Wrong PIN, try again</div>

        {/* Dots — empty = solid white, entered = orange */}
        <div ref={wrapRef} style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:28, flexShrink:0 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              background: dotColor(i),
              transition: 'background 0.15s, transform 0.15s',
              transform: i < pin.length ? 'scale(1.1)' : 'scale(1)',
            }}/>
          ))}
        </div>

        {/* Keypad — plain numerals, no key backgrounds */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'0 20px 24px', justifyContent:'center' }}>
          {ROWS.map((row, ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', flex:1 }}>
              {row.map((k, ci) => (
                <div key={ci} onClick={() => press(k)} style={{
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor: k==='.' ? 'default' : 'pointer',
                  userSelect:'none', WebkitTapHighlightColor:'transparent',
                  minHeight: 50,
                }}>
                  {k === '←' ? (
                    <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                      <path d="M9 1H24C24.6 1 25 1.4 25 2V18C25 18.6 24.6 19 24 19H9L1 10L9 1Z" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" fill="none"/>
                      <path d="M12 7L18 13M18 7L12 13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                  ) : k === '.' ? (
                    <span style={{ fontSize:28, fontWeight:300, color:'rgba(255,255,255,0.25)', fontFamily:'DM Sans,sans-serif', lineHeight:1 }}>·</span>
                  ) : (
                    <span style={{ fontSize:28, fontWeight:300, color:'rgba(255,255,255,0.85)', fontFamily:'DM Sans,sans-serif', lineHeight:1 }}>{k}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
