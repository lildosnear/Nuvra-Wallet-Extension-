import React, { useState, useEffect } from 'react'

/* ─── keyframe styles injected once ──────────────────────────────────────── */
const STYLES = `
  @keyframes ob_float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-13px); }
  }
  @keyframes ob_float_sm {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    50%      { transform: translateY(-8px) rotate(6deg); }
  }
  @keyframes ob_fade_slide {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

/* Built from the Figma file's own node data (frame 430x932, scaled x0.872
   to the 375px popup). Colours, type and sizes are the design's values:
   bg #0B0F14, headline Gascogne Serial 15px #959595, wordmark Geist
   ExtraLight 36px, Get Started #EF5200, secondary border #EC641D.      */

/* ─── Slide 1: NUVRA coin (design has no satellite coins, soft dots only) ── */
function Slide1Illus() {
  return (
    <div style={{ position:'relative', width:339, height:300,
      animation:'ob_float 3.8s ease-in-out infinite' }}>
      <img src="/onboarding/nuvra_coin.png" alt="NUVRA"
        style={{ position:'absolute', left:0, top:-20, width:339, display:'block' }}/>
      {/* soft blurred dots, as in the design */}
      <div style={{ position:'absolute', width:26, height:26, borderRadius:'50%',
        background:'rgba(255,170,90,0.35)', filter:'blur(12px)', top:6, left:52 }}/>
      <div style={{ position:'absolute', width:19, height:19, borderRadius:'50%',
        background:'rgba(255,170,90,0.3)', filter:'blur(10px)', top:120, left:6 }}/>
      <div style={{ position:'absolute', width:10, height:10, borderRadius:'50%',
        background:'rgba(255,170,90,0.35)', filter:'blur(5px)', top:52, right:44 }}/>
      <div style={{ position:'absolute', width:26, height:26, borderRadius:'50%',
        background:'rgba(255,170,90,0.28)', filter:'blur(12px)', bottom:8, right:16 }}/>
    </div>
  )
}

/* ─── Slide 2: gift box with the design's bursting coins layer above it ──── */
function Slide2Illus() {
  return (
    <div style={{ position:'relative', width:273, height:231, marginTop:100,
      animation:'ob_float 4s ease-in-out infinite' }}>
      <img src="/onboarding/figma_coins.png" alt=""
        style={{ position:'absolute', left:29, top:-80, width:214, display:'block', zIndex:2 }}/>
      <img src="/onboarding/box.png" alt="Box"
        style={{ position:'absolute', left:0, top:0, width:273, display:'block', zIndex:3 }}/>
    </div>
  )
}

/* ─── Slide 3: padlock with shadow rings and coin chips ──────────────────── */
function Slide3Illus() {
  return (
    <div style={{ position:'relative', width:363, height:224,
      animation:'ob_float 3.6s ease-in-out infinite' }}>
      {/* shadow rings under the lock */}
      <div style={{ position:'absolute', left:44, top:43, width:275, height:135,
        borderRadius:'50%', border:'10px solid rgba(0,0,0,0.22)',
        transform:'rotate(-14deg)', zIndex:1 }}/>
      <div style={{ position:'absolute', left:76, top:64, width:212, height:94,
        borderRadius:'50%', border:'8px solid rgba(0,0,0,0.18)',
        transform:'rotate(-14deg)', zIndex:1 }}/>
      <img src="/onboarding/lock.png" alt="Lock"
        style={{ position:'absolute', left:0, top:0, width:363, display:'block', zIndex:3 }}/>
      {/* coin chips at the design's positions (BTC bottom left, Arch below centre) */}
      <img src="/onboarding/figma_chip_btc.png" alt="BTC"
        style={{ position:'absolute', left:46, top:140, width:30, height:30, zIndex:4,
          animation:'ob_float_sm 4s 0.2s ease-in-out infinite' }}/>
      <img src="/onboarding/figma_chip_arch.png" alt="Arch"
        style={{ position:'absolute', left:95, top:155, width:35, height:35, zIndex:4,
          animation:'ob_float_sm 5.2s 0.8s ease-in-out infinite' }}/>
    </div>
  )
}

const SLIDES = [
  { IllusComp: Slide1Illus, textPadX: 48,
    headline: 'Welcome to Nuvra',
    sub: 'Access Layer for the Next Billion Bitcoin Users.' },
  { IllusComp: Slide2Illus, textPadX: 60,
    headline: 'The Bitcoin-aligned',
    sub: 'gateway to the Bitcoin ecosystem, on every BTC chain.' },
  { IllusComp: Slide3Illus, textPadX: 60,
    headline: 'The Bitcoin-aligned',
    sub: 'gateway to the Bitcoin ecosystem, on every BTC chain.' },
]

export default function OnboardingScreen({ onDone, onHaveWallet }) {
  const [slide,    setSlide]    = useState(0)
  const [animKey,  setAnimKey]  = useState(0)

  /* auto-advance every 3 s */
  useEffect(() => {
    const t = setInterval(() => {
      setSlide(s => { const n=(s+1)%SLIDES.length; setAnimKey(k=>k+1); return n })
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const goTo = idx => { setSlide(idx); setAnimKey(k=>k+1) }

  const { IllusComp, headline, sub, textPadX } = SLIDES[slide]

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ flex:1, display:'flex', flexDirection:'column',
        background:'#0B0F14', position:'relative', overflow:'hidden' }}>

        {/* ── background: particles + the design's two blurred glows ── */}
        <img src="/onboarding/particles.png" alt=""
          style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)',
            width:388, opacity:0.5, pointerEvents:'none', zIndex:0 }}/>
        <div style={{ position:'absolute', left:41, top:145, width:204, height:198,
          borderRadius:'50%', background:'#EC641D', opacity:0.3, filter:'blur(55px)',
          transform:'rotate(47deg)', pointerEvents:'none', zIndex:0 }}/>
        <div style={{ position:'absolute', left:248, top:428, width:186, height:212,
          borderRadius:'50%', background:'#000000', opacity:0.4, filter:'blur(45px)',
          pointerEvents:'none', zIndex:0 }}/>

        {/* ── TOP ROW: dots (left) + Next (right) ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'26px 21px 0', flexShrink:0, position:'relative', zIndex:5 }}>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {SLIDES.map((_,i) => (
              <div key={i} onClick={() => goTo(i)}
                style={{ cursor:'pointer', height:6, borderRadius:3,
                  background: i===slide ? '#FF9D69' : '#FFFFFF',
                  width: i===slide ? 25 : 10,
                  transition:'all 0.35s ease' }}/>
            ))}
          </div>

          <button onClick={() => { const n=(slide+1)%SLIDES.length; goTo(n); if(slide===SLIDES.length-1) onDone() }}
            style={{ width:83, height:31, background:'#010101',
              border:'1px solid #FFA750', borderRadius:28,
              color:'#959595', fontFamily:"'Geist',sans-serif",
              fontSize:11, fontWeight:400, cursor:'pointer' }}>
            Next
          </button>
        </div>

        {/* ── Logo lockup: NV mark over the NUVRA wordmark (Geist ExtraLight) ── */}
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
          marginTop:26, flexShrink:0, position:'relative', zIndex:2, gap:7 }}>
          <img src="/logo_nv_orange.png" alt="NV"
            style={{ width:69, height:30, objectFit:'contain', display:'block' }}/>
          <div style={{ fontFamily:"'Geist',sans-serif", fontWeight:200, fontSize:31,
            lineHeight:'28px', letterSpacing:3, color:'#FFFFFF', textAlign:'center' }}>
            <span style={{ color:'#EC641D' }}>N</span>U<span style={{ color:'#EC641D' }}>V</span>RA
          </div>
        </div>

        {/* ── Illustration — fills remaining space ── */}
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          position:'relative', zIndex:1, minHeight:0 }}>
          <div key={`illus-${animKey}`}
            style={{ animation:'ob_fade_slide 0.45s ease both' }}>
            <IllusComp />
          </div>
        </div>

        {/* ── Headline (the design's serif, 15px, #959595) ── */}
        <div key={`text-${animKey}`}
          style={{ padding:`0 ${textPadX}px`, marginBottom:17, flexShrink:0, zIndex:2, position:'relative',
            animation:'ob_fade_slide 0.45s 0.07s ease both', textAlign:'center' }}>
          <div style={{ fontFamily:"'Gascogne Serial',Georgia,'Times New Roman',serif",
            fontSize:13, fontWeight:400, color:'#959595', lineHeight:'17px' }}>
            <div>{headline}</div>
            <div>{sub}</div>
          </div>
        </div>

        {/* ── CTA buttons ── */}
        <div style={{ padding:'0 21px', flexShrink:0, position:'relative', zIndex:2 }}>
          <button onClick={onDone}
            style={{ position:'relative', overflow:'hidden', width:'100%', height:44,
              background:'#EF5200', border:'1px solid rgba(255,255,255,0.9)', borderRadius:28,
              color:'#fff', fontFamily:"'Geist',sans-serif",
              fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:13,
              boxShadow:'inset 0 1px 18px rgba(255,237,219,0.55), inset 0 1px 4px #FFEDDB, 0 9px 6px rgba(255,88,0,0.22)' }}>
            <span style={{ position:'absolute', inset:0, borderRadius:'inherit', pointerEvents:'none',
              background:'radial-gradient(120% 100% at 50% 0%, rgba(255,196,140,0.55) 0%, rgba(255,196,140,0) 55%)',
              mixBlendMode:'plus-lighter' }}/>
            <span style={{ position:'relative' }}>Get Started</span>
          </button>

          <button onClick={onHaveWallet || onDone}
            style={{ width:'100%', height:44, background:'#010101',
              border:'1px solid #EC641D', borderRadius:28,
              color:'#fff', fontFamily:"'Geist',sans-serif",
              fontSize:13, fontWeight:400, cursor:'pointer', textAlign:'center' }}>
            I already have wallet
          </button>
        </div>

        {/* ── Terms (Inter Light, #A9A9A9) ── */}
        <div style={{ fontFamily:"'Inter',sans-serif", fontWeight:300, fontSize:9,
          color:'#A9A9A9', textAlign:'center',
          padding:'12px 39px 14px', lineHeight:'17px', flexShrink:0, position:'relative', zIndex:2 }}>
          By continuing, you agree to Nuvra's Terms of Service and Privacy Policy.
        </div>

      </div>
    </>
  )
}
