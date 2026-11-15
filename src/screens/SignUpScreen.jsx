import React, { useState } from 'react'

/* ── shared input row styles ── */
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

/* ── Gift icon SVG ── */
function GiftIcon() {
  return (
    <svg style={S.icon} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="6" width="14" height="9" rx="1.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3"/>
      <path d="M8 6V15" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3"/>
      <path d="M1 9.5H15" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3"/>
      <path d="M5.5 6C5.5 6 5.5 3.5 8 3.5C10.5 3.5 10.5 6 10.5 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M8 3.5C8 3.5 7 1.5 5.5 2C4 2.5 5.5 6 8 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 3.5C8 3.5 9 1.5 10.5 2C12 2.5 10.5 6 8 6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round"/>
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
   SCREEN 1 & 2 — Create an Account
════════════════════════════════════════════ */
function StepCreateAccount({ onNext, onAlreadyHave }) {
  const [email,   setEmail]   = useState('')
  const [pw,      setPw]      = useState('')
  const [cf,      setCf]      = useState('')
  const [focusF,  setFocusF]  = useState(null)

  const valid = email.includes('@') && pw.length >= 6 && cf === pw && cf.length >= 6
  const mismatch = cf.length > 0 && cf !== pw

  const fStyle = (name) => ({
    ...S.input,
    ...(focusF === name ? { borderColor:'#EC641D', background:'rgba(236,100,29,0.07)' } : {}),
    ...(name === 'cf' && mismatch ? { borderColor:'rgba(232,64,0,0.7)' } : {}),
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
          Create an account
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

        {/* Confirm Password */}
        <label style={S.label}>Confirm Password</label>
        <div style={S.wrap}>
          <LockIcon />
          <input
            style={fStyle('cf')}
            type="password"
            placeholder="8-16 Character"
            value={cf}
            onChange={e => setCf(e.target.value)}
            onFocus={() => setFocusF('cf')}
            onBlur={() => setFocusF(null)}
          />
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding:'16px 22px 32px', flexShrink:0 }}>
        <button
          onClick={onNext}
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
          Create Account
        </button>

        <button
          onClick={onAlreadyHave}
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
          I already have a wallet
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

/* ════════════════════════════════════════════
   SCREEN 3 — Referral Code
════════════════════════════════════════════ */
function StepReferral({ onNext, onSkip }) {
  const [code,   setCode]   = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column',
      background:'#101010', overflow:'hidden' }}>

      <TopLogo />

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none',
        padding:'0 22px', display:'flex', flexDirection:'column' }}>

        {/* Title */}
        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:20, fontWeight:700,
          color:'#fff', marginBottom:20 }}>
          Referral Code
        </div>

        {/* Field */}
        <label style={S.label}>Referral Code</label>
        <div style={S.wrap}>
          <GiftIcon />
          <input
            style={{
              ...S.input,
              textTransform:'uppercase', letterSpacing:2,
              ...(focused ? { borderColor:'#EC641D', background:'rgba(236,100,29,0.07)' } : {}),
            }}
            type="text"
            placeholder="Enter Referral code"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>

        {/* Referral box illustration — centered, fills remaining space */}
        <div style={{ flex:1, display:'flex', alignItems:'center',
          justifyContent:'center', padding:'20px 0' }}>
          <img
            src="/signup/referral_box.png"
            alt="Referral"
            style={{
              width: 200,
              height: 180,
              objectFit: 'contain',
              filter: 'drop-shadow(0 16px 32px rgba(236,100,29,0.25))',
              animation: 'ob_float 3.5s ease-in-out infinite',
            }}
          />
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding:'16px 22px 32px', flexShrink:0 }}>
        <button
          onClick={onNext}
          style={{
            width:'100%', height:54, borderRadius:30,
            background:'linear-gradient(135deg,#F0834A,#EC641D)',
            border:'none', color:'#fff',
            fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:700,
            cursor:'pointer', marginBottom:12,
            boxShadow:'0 8px 24px rgba(236,100,29,0.35)',
            transition:'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
        >
          Enter Referral Code
        </button>

        <button
          onClick={onSkip}
          style={{
            width:'100%', height:48, borderRadius:30,
            background:'#1F1F1F',
            border:'1px solid rgba(255,255,255,0.08)',
            color:'#fff',
            fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:600,
            cursor:'pointer',
            transition:'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='#2A2A2A'}
          onMouseLeave={e => e.currentTarget.style.background='#1F1F1F'}>
          Skip
        </button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   ROOT SignUpScreen
════════════════════════════════════════════ */
export default function SignUpScreen({ onDone, onBack }) {
  const [step, setStep] = useState(0) // 0 = create account, 1 = referral

  return (
    <>
      <style>{`
        @keyframes ob_float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
      `}</style>

      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>

        {/* Step 0 — Create Account */}
        <div className={`screen ${step === 0 ? 'active' : 'left'}`}
          style={{ background:'#101010' }}>
          <StepCreateAccount
            onNext={() => setStep(1)}
            onAlreadyHave={onBack}
          />
        </div>

        {/* Step 1 — Referral Code */}
        <div className={`screen ${step === 1 ? 'active' : 'right'}`}
          style={{ background:'#101010' }}>
          <StepReferral
            onNext={onDone}
            onSkip={onDone}
          />
        </div>

      </div>
    </>
  )
}
