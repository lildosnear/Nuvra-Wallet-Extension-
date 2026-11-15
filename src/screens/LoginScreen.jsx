import React, { useState } from 'react'

/* ── shared input row styles (same as SignUpScreen) ── */
const S = {
  wrap: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    width: '100%',
    height: 48,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10,
    color: '#fff',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 13,
    paddingLeft: 42,
    paddingRight: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
  },
  icon: {
    position: 'absolute',
    left: 13,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 16,
    height: 16,
    objectFit: 'contain',
    opacity: 0.45,
    pointerEvents: 'none',
  },
  label: {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 6,
    display: 'block',
    fontFamily: 'DM Sans, sans-serif',
  },
}

/* ── Lock icon SVG ── */
function LockIcon() {
  return (
    <svg style={S.icon} viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="7" width="11" height="8" rx="1.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3"/>
      <path d="M5 7V5C5 3.3 6.3 2 8 2C9.7 2 11 3.3 11 5V7"
        stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </svg>
  )
}

/* ── Mail icon SVG ── */
function MailIcon() {
  return (
    <svg style={S.icon} viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3"/>
      <path d="M1.5 5L8 9.5L14.5 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

/* ── NUVRA logo top center ── */
function TopLogo() {
  return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
      paddingTop:24, paddingBottom:20, flexShrink:0, gap:5 }}>
      <img src="/logo_nv_orange.png" alt="NV"
        style={{ height:36, objectFit:'contain' }}/>
      <img src="/onboarding/nuvra_wordmark.png" alt="NUVRA"
        style={{ height:16, objectFit:'contain' }}/>
    </div>
  )
}

/* ════════════════════════════════════════════
   Login — same design as Create an Account,
   email + password only
════════════════════════════════════════════ */
export default function LoginScreen({ onDone, onCreateAccount }) {
  const [email,  setEmail]  = useState('')
  const [pw,     setPw]     = useState('')
  const [focusF, setFocusF] = useState(null)

  const valid = email.includes('@') && pw.length >= 6

  const fStyle = (name) => ({
    ...S.input,
    ...(focusF === name ? { borderColor:'#EC641D', background:'rgba(236,100,29,0.07)' } : {}),
  })

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column',
      background:'#101010', overflow:'hidden' }}>

      <TopLogo />

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none',
        padding:'0 22px' }}>

        {/* Title */}
        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:20, fontWeight:700,
          color:'#fff', marginBottom:20 }}>
          Login
        </div>

        {/* Email */}
        <label style={S.label}>Email Address</label>
        <div style={S.wrap}>
          <MailIcon />
          <input
            style={fStyle('email')}
            type="email"
            placeholder="e.g danieljames@gmail.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocusF('email')}
            onBlur={() => setFocusF(null)}
          />
        </div>

        {/* Password */}
        <label style={S.label}>Password</label>
        <div style={S.wrap}>
          <LockIcon />
          <input
            style={fStyle('pw')}
            type="password"
            placeholder="8-16 Character"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onFocus={() => setFocusF('pw')}
            onBlur={() => setFocusF(null)}
          />
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding:'16px 22px 32px', flexShrink:0 }}>
        <button
          onClick={onDone}
          disabled={!valid}
          style={{
            width:'100%', height:54, borderRadius:30,
            background: valid
              ? 'linear-gradient(135deg,#F0834A,#EC641D)'
              : '#5E280C',
            border:'none', color: valid ? '#fff' : 'rgba(0,0,0,0.55)',
            fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:700,
            cursor: valid ? 'pointer' : 'default', marginBottom:12,
            transition:'all 0.2s',
            boxShadow: valid ? '0 8px 24px rgba(236,100,29,0.35)' : 'none',
          }}
        >
          Login
        </button>

        <button
          onClick={onCreateAccount}
          style={{
            width:'100%', height:54, borderRadius:30,
            background:'#000',
            border:'1px solid rgba(255,255,255,0.12)',
            color:'#fff',
            fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:600,
            cursor:'pointer', marginBottom:14,
            transition:'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='#1F1F1F'}
          onMouseLeave={e => e.currentTarget.style.background='#000'}>
          Create an account
        </button>

        <div style={{ textAlign:'center', fontSize:11,
          color:'rgba(255,255,255,0.3)',
          fontFamily:'DM Sans,sans-serif' }}>
          Do not sell or share my personal info
        </div>
      </div>
    </div>
  )
}
