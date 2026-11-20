import React, { useState, useRef, useEffect } from 'react'
import SlideButton from '../components/SlideButton'
import PinModal from '../components/PinModal'
import { useWallet } from '../wallet/WalletContext'
import { ASSETS } from '../data/constants'
import { getChain } from '../chains/registry'
import { validateAddress, detectAddressFamily, familyLabel } from '../chains/adapter'
import { getSendRoute, validateSendAddress, estimateSend, sendToken } from '../wallet/send'
import { verifyPin } from '../wallet/vault'

// Indicative prices, the same static table the dashboard uses.
const FIAT_USD = { BTC: 67647.62, ETH: 3225, ARCH: 1.48 }
const fiatOf = (symbol, amount) => {
  const p = FIAT_USD[symbol]
  const n = parseFloat(amount)
  if (!p || !n) return null
  return '$' + (n * p).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const TOKEN_IMG = {
  BTC:  '/home/token_btc.png',
  WBTC: '/home/token_btc.png',
  tBTC: '/home/token_btc.png',
  ETH:  '/home/token_eth.png',
  USDC: '/home/token_usdc.png',
  ARCH: '/home/token_arch.png',
}

// Sendable tokens for a chain, derived from the chain-tagged assets.
function tokensForChain(chainId) {
  return ASSETS
    .filter(a => chainId === 'all' ? a.chain !== 'arch' : a.chain === chainId)
    .map(a => ({ symbol: a.symbol, name: a.chainLabel, chain: a.chain, img: TOKEN_IMG[a.symbol] || null, balance: a.balance }))
}

function TokIcon({ t, size=32 }) {
  if (t?.img) return <img src={t.img} alt={t.symbol} style={{ width:size, height:size, borderRadius:'50%', objectFit:'contain' }}/>
  return <div style={{ width:size, height:size, borderRadius:'50%', background:'rgba(236,100,29,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:size*0.4, color:'#EC641D', fontWeight:700 }}>{t?.symbol?.[0] || '?'}</span></div>
}

function ConfirmModal({ token, amount, addr, fiatText, feeText, networkLabel, unsupported, onClose, onConfirm }) {
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.82)', zIndex:80, display:'flex', alignItems:'flex-end', backdropFilter:'blur(8px)' }} onClick={onClose}>
      <div style={{ width:'100%', background:'#101010', borderRadius:'24px 24px 0 0', border:'1px solid rgba(255,255,255,0.1)', borderBottom:'none', padding:'0 0 40px', animation:'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 16px' }}>
          <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:18, fontWeight:700, color:'#fff' }}>Send Token</div>
          <div onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="#000" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        </div>

        {/* Token icon */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
          <TokIcon t={token} size={56}/>
        </div>
        <div style={{ textAlign:'center', fontFamily:'DM Sans,sans-serif', fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>{token.symbol}</div>
        <div style={{ textAlign:'center', fontSize:13, color:'#959595', fontFamily:'DM Sans,sans-serif', marginBottom:14 }}>{amount} {token.symbol}{fiatText ? ` ~ ${fiatText}` : ''}</div>

        {/* Address */}
        <div style={{ margin:'0 20px 18px', background:'#1A1A1A', border:'1px solid rgba(255,255,255,0.06)', borderRadius:24, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/><rect x="10" y="10" width="2" height="2" fill="rgba(255,255,255,0.4)"/><path d="M13 9V13H9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <span style={{ flex:1, fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{addr || '—'}</span>
        </div>

        {/* Details */}
        <div style={{ margin:'0 20px', background:'#1A1A1A', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, marginBottom:22 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize:14, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>Send {token.symbol}</span>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <TokIcon t={token} size={18}/>
              <span style={{ fontSize:14, fontWeight:600, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>= {amount}</span>
            </div>
          </div>
          {networkLabel && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:14, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>Network:</span>
              <span style={{ fontSize:14, fontWeight:600, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{networkLabel}</span>
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:14, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>Est. Fee:</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#959595" strokeWidth="1.1"/><path d="M7 6.2V9.5M7 4.2V4.6" stroke="#959595" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{feeText || '—'}</span>
          </div>
        </div>

        {unsupported ? (
          <div style={{ margin:'0 20px', fontSize:13, color:'#ff8a5c', fontFamily:'DM Sans,sans-serif', lineHeight:1.6, textAlign:'center' }}>
            Sending {token.symbol} is not available in this testnet build yet. BTC on Bitcoin Testnet and ETH on BOB Sepolia are live.
          </div>
        ) : (
          <div style={{ display:'flex', justifyContent:'center', paddingBottom:4 }}>
            <SlideButton label="Slide to send" onConfirm={onConfirm}/>
          </div>
        )}
      </div>
    </div>
  )
}

// Processing ring
function Processing() {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#101010', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'relative', width:130, height:130 }}>
        <svg width="130" height="130" style={{ position:'absolute', top:0, left:0 }}>
          <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
        </svg>
        <svg width="130" height="130" style={{ position:'absolute', top:0, left:0, transform:'rotate(-90deg)', transformOrigin:'65px 65px', animation:'rotate 1.4s linear infinite' }}>
          <defs><linearGradient id="arcG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#EC641D"/><stop offset="100%" stopColor="#ffb347"/></linearGradient></defs>
          <circle cx="65" cy="65" r="52" fill="none" stroke="url(#arcG)" strokeWidth="7" strokeLinecap="round" strokeDasharray="326" strokeDashoffset="80"/>
        </svg>
      </div>
    </div>
  )
}

// Success screen
function SendSuccess({ token, amount, addr, fiatText, explorerUrl, onDone }) {
  const displayAddr = addr
    ? addr.length > 26 ? addr.slice(0, 14) + '...' + addr.slice(-8) : addr
    : 'recipient'

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#101010', position:'relative', overflow:'hidden' }}>

      {/* Logo top-left */}
      <div style={{ position:'absolute', top:20, left:20, zIndex:2 }}>
        <img src="/logo_nv_orange.png" alt="NV" style={{ width:49, height:22, objectFit:'contain' }}/>
      </div>

      {/* Orange floor glow */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:240,
        background:'radial-gradient(ellipse at 50% 100%, rgba(236,100,29,0.32), transparent 68%)',
        pointerEvents:'none', zIndex:0 }}/>

      {/* Content — centered */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'60px 28px 20px', position:'relative', zIndex:1 }}>

        {/* Title */}
        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:20, fontWeight:700,
          color:'#fff', marginBottom:28, textAlign:'center', letterSpacing:0.2 }}>
          Successful Send Token
        </div>

        {/* Token icon */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
          <TokIcon t={token} size={56}/>
        </div>

        {/* Token symbol */}
        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:18, fontWeight:700,
          color:'#fff', marginBottom:6 }}>
          {token.symbol}
        </div>

        {/* Amount line */}
        <div style={{ fontSize:13, color:'#959595',
          fontFamily:'DM Sans,sans-serif', marginBottom:4 }}>
          {amount} {token.symbol}{fiatText ? ` ~ ${fiatText}` : ''}
        </div>

        {/* "to" label */}
        <div style={{ fontSize:12, color:'#959595',
          fontFamily:'DM Sans,sans-serif', marginBottom:10, letterSpacing:0.5 }}>
          to
        </div>

        {/* Recipient address pill */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:44,
          background:'#1A1A1A', border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:24, padding:'9px 14px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="1.5" width="4" height="4" rx="0.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.1"/>
            <rect x="8.5" y="1.5" width="4" height="4" rx="0.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.1"/>
            <rect x="1.5" y="8.5" width="4" height="4" rx="0.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.1"/>
            <rect x="9.5" y="9.5" width="1.5" height="1.5" fill="rgba(255,255,255,0.35)"/>
            <path d="M11.5 8.5V11.5H8.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.45)',
            fontFamily:'monospace', letterSpacing:0.3 }}>{displayAddr}</span>
        </div>

        {/* Done button */}
        <button onClick={onDone} style={{
          width:'100%', maxWidth:320, height:54, borderRadius:30,
          background:'linear-gradient(135deg,#F0834A,#EC641D)',
          border:'none', color:'#fff',
          fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:700,
          cursor:'pointer', marginBottom:28,
          boxShadow:'0 8px 24px rgba(236,100,29,0.35)',
          position:'relative', zIndex:1,
        }}>Done</button>

        {/* View Transaction + Share */}
        <div style={{ display:'flex', gap:44 }}>
          {[
            { label:'View Transaction', icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
                <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
                <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
                <rect x="12.5" y="12.5" width="2.5" height="2.5" fill="rgba(255,255,255,0.6)"/>
                <path d="M17 11.5V17H12" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            )},
            { label:'Share', icon: (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="15" cy="4" r="2.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
                <circle cx="15" cy="16" r="2.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
                <circle cx="5" cy="10" r="2.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
                <path d="M7.2 9L12.8 5.5M7.2 11L12.8 14.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            )},
          ].map(({ label, icon }) => (
            <div key={label} onClick={() => { if (label === 'View Transaction' && explorerUrl) window.open(explorerUrl, '_blank') }} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, cursor:'pointer' }}>
              <div style={{ width:48, height:48, borderRadius:'50%',
                background:'#000', border:'1px solid rgba(255,255,255,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {icon}
              </div>
              <span style={{ fontSize:11, color:'#959595',
                fontFamily:'DM Sans,sans-serif', textAlign:'center', lineHeight:1.3 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SendScreen({ onBack, onSuccessView }) {
  const { selectedChainId, liveBalances, refreshBalances } = useWallet()
  const TOKENS = tokensForChain(selectedChainId)
  const [tokenSymbol, setTokenSymbol] = useState(null)
  const token = TOKENS.find(t => t.symbol === tokenSymbol) || TOKENS[0]
  const setToken = (t) => setTokenSymbol(t.symbol)
  const [amount,  setAmount]  = useState('')
  const [addr,    setAddr]    = useState('')
  const [showTok, setShowTok] = useState(false)
  const [phase,   setPhase]   = useState('form') // form | confirm | pin | processing | success
  const [showPin, setShowPin] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [feeInfo, setFeeInfo] = useState(null)
  const [result, setResult] = useState(null)

  // Success screen shows no bottom nav (Figma).
  useEffect(() => { onSuccessView && onSuccessView(phase === 'success') }, [phase])

  // Validate the recipient against the network this build actually
  // sends on. BTC sends run on Bitcoin Testnet in this phase, so a
  // mainnet bc1 address is rejected with that explanation.
  const route = token ? getSendRoute(token) : null
  const sendChain = token ? getChain(token.chain) : null
  const addrTrimmed = addr.trim()
  const addrValid = !!token && (route
    ? validateSendAddress(route, addrTrimmed)
    : validateAddress(token.chain, addrTrimmed))
  const addrFamily = addrTrimmed && !addrValid ? detectAddressFamily(addrTrimmed) : null
  const addrError = !addrTrimmed || addrValid ? null
    : route?.kind === 'btc-testnet'
      ? addrTrimmed.startsWith('bc1')
        ? 'This looks like a Bitcoin mainnet address. This build sends on Bitcoin Testnet only, so paste a tb1 address.'
        : 'Enter a valid Bitcoin Testnet address (tb1…).'
      : addrFamily && sendChain && addrFamily !== sendChain.addressFormat && !(addrFamily === 'evm' && sendChain.type === 'evm')
        ? `This looks like a ${familyLabel(addrFamily)} address. You are sending on ${sendChain.name} — paste a ${sendChain.addressFormatLabel} address, or switch chains.`
        : `Enter a valid ${sendChain ? sendChain.name : ''} address (${sendChain ? sendChain.addressFormatLabel : ''}).`

  const valid = addrValid && parseFloat(amount) > 0

  // The real send: build, sign and broadcast while the processing
  // ring shows. Success carries the real transaction id; any failure
  // returns to the form with the reason in plain language.
  useEffect(() => {
    if (phase !== 'processing') return
    let live = true
    sendToken({ token, to: addrTrimmed, amountText: amount })
      .then((r) => { if (!live) return; setResult(r); setPhase('success'); refreshBalances() })
      .catch((e) => { if (!live) return; setSendError(e.message); setPhase('form') })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const pressSend = async () => {
    setSendError(null)
    if (!route) { setFeeInfo(null); setPhase('confirm'); return }
    setEstimating(true)
    try {
      const info = await estimateSend({ token, to: addrTrimmed, amountText: amount })
      setFeeInfo(info)
      setPhase('confirm')
    } catch (e) {
      setSendError(e.message)
    } finally {
      setEstimating(false)
    }
  }

  const displayBalance = route?.kind === 'btc-testnet' && liveBalances
    ? `${liveBalances.btc ?? '—'} BTC`
    : route?.kind === 'evm-sepolia' && liveBalances
      ? `${liveBalances.eth ?? '—'} ETH`
      : token.balance

  if (phase === 'processing') return <Processing/>
  if (phase === 'success') return <SendSuccess token={token} amount={amount} addr={addr} fiatText={fiatOf(token.symbol, amount)} explorerUrl={result?.explorerUrl} onDone={() => { setPhase('form'); setAmount(''); setAddr(''); setResult(null) }}/>

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#101010', position:'relative' }}>

      {/* TOP NAV */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px 0', flexShrink:0 }}>
        <img src="/logo_nv_orange.png" alt="NV" style={{ width:49, height:22, objectFit:'contain' }}/>
        <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:700, color:'#fff' }}>Send Tokens</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity:0.6 }}>
            <path d="M17 5C17 2.8 13.9 1 10 1C6.1 1 3 2.8 3 5C3 9 1 11 1 11H19C19 11 17 9 17 5Z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" fill="none"/>
            <path d="M11.7 15C11.4 15.6 10.8 16 10 16C9.2 16 8.6 15.6 8.3 15" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <img src="/home/avatar.png" alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(236,100,29,0.4)' }}/>
        </div>
      </div>

      {/* Back pill — row below nav */}
      <div style={{ padding:'10px 16px 0', flexShrink:0 }}>
        <div onClick={onBack} style={{
          width:64, height:32, display:'flex', alignItems:'center', justifyContent:'center',
          background:'#1F1F1F', borderRadius:20,
          cursor:'pointer', fontSize:13, color:'#959595',
          fontFamily:'DM Sans,sans-serif', transition:'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='#2A2A2A'}
          onMouseLeave={e => e.currentTarget.style.background='#1F1F1F'}
        >
          Back
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none', padding:'20px 20px 0' }}>

        {/* ADDRESS input */}
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'#1F1F1F', borderRadius:16, padding:'0 16px', height:56, boxSizing:'border-box', marginBottom:18 }}>
          <input value={addr} onChange={e => setAddr(e.target.value)} placeholder="Paste address or scan QR"
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontFamily:'DM Sans,sans-serif', fontSize:14 }}/>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity:0.5, cursor:'pointer', flexShrink:0 }}>
            <rect x="2" y="2" width="6" height="6" rx="1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
            <rect x="12" y="2" width="6" height="6" rx="1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
            <rect x="2" y="12" width="6" height="6" rx="1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4"/>
            <rect x="13" y="13" width="2" height="2" fill="rgba(255,255,255,0.6)"/>
            <path d="M16.5 12V16.5H12" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>

        {addrError && (
          <div style={{ fontSize:12, color:'#ff8a5c', fontFamily:'DM Sans,sans-serif', lineHeight:1.5, marginTop:-8, marginBottom:14 }}>
            {addrError}
          </div>
        )}

        {/* AMOUNT + TOKEN */}
        <div style={{ background:'#1F1F1F', borderRadius:16, padding:'16px', minHeight:110, boxSizing:'border-box', marginBottom:24, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:12, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>Enter Amount</span>
            <span style={{ fontSize:12, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>Balance: {displayBalance}</span>
          </div>
          <div style={{ flex:1 }}>
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g,''))} placeholder="0.00"
              style={{ width:'100%', background:'transparent', border:'none', outline:'none', fontFamily:'DM Sans,sans-serif', fontSize:32, fontWeight:700, color:'#fff' }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div onClick={() => setShowTok(true)} style={{ display:'flex', alignItems:'center', gap:7, background:'#000', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:'7px 11px 7px 7px', cursor:'pointer', flexShrink:0 }}>
              <TokIcon t={token} size={24}/>
              <span style={{ fontSize:14, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{token.symbol}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* SEND BUTTON */}
      <div style={{ padding:'0 20px 20px', flexShrink:0 }}>
        {sendError && (
          <div style={{ fontSize:12, color:'#ff8a5c', fontFamily:'DM Sans,sans-serif', lineHeight:1.5, marginBottom:12 }}>
            {sendError}
          </div>
        )}
        <button onClick={pressSend} disabled={!valid || estimating}
          style={{ width:'100%', height:54, borderRadius:30, background: valid ? 'linear-gradient(135deg,#F0834A,#EC641D)' : '#5E280C', border:'none', color: valid ? '#fff' : 'rgba(0,0,0,0.55)', fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:700, cursor: valid ? 'pointer' : 'default', transition:'all 0.2s', boxShadow: valid ? '0 8px 24px rgba(236,100,29,0.35)' : 'none' }}>
          Send
        </button>
      </div>

      {/* Token selector modal */}
      {showTok && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.82)', zIndex:80, display:'flex', alignItems:'flex-end', backdropFilter:'blur(8px)' }} onClick={() => setShowTok(false)}>
          <div style={{ width:'100%', background:'#101010', borderRadius:'24px 24px 0 0', border:'1px solid rgba(255,255,255,0.1)', borderBottom:'none', padding:'0 0 44px', animation:'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 14px' }}>
              <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:18, fontWeight:700, color:'#fff' }}>Select Token</div>
              <div onClick={() => setShowTok(false)} style={{ width:36, height:36, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2L12 12M12 2L2 12" stroke="#000" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
            </div>
            {TOKENS.map((t, i) => (
              <div key={i} onClick={() => { setToken(t); setShowTok(false) }}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 20px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <TokIcon t={t} size={40}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{t.symbol}</div>
                  <div style={{ fontSize:11, color:'#959595', fontFamily:'DM Sans,sans-serif' }}>{t.name}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', fontFamily:'DM Sans,sans-serif' }}>{t.balance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {phase === 'confirm' && (
        <ConfirmModal token={token} amount={amount} addr={addr}
          fiatText={fiatOf(token.symbol, amount)}
          feeText={feeInfo?.feeText}
          networkLabel={route?.networkLabel}
          unsupported={!route}
          onClose={() => setPhase('form')}
          onConfirm={() => { setShowPin(true) }}/>
      )}

      {/* PIN modal — shown over confirm modal after slide */}
      {showPin && (
        <PinModal
          title="Confirm Transaction"
          verify={verifyPin}
          onSuccess={() => { setShowPin(false); setPhase('processing') }}
          onCancel={() => { setShowPin(false) }}
        />
      )}
    </div>
  )
}
