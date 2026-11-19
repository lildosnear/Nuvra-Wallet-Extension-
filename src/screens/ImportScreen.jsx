import React, { useState } from 'react'

// ═══════════════════════════════════════════════════════════════════
//   IMPORT — restore a wallet from its BIP-39 seed phrase.
//   The phrase is validated and encrypted on device by the vault;
//   it is never sent anywhere.
// ═══════════════════════════════════════════════════════════════════
export default function ImportScreen({ onImport, onBack }) {
  const [phrase, setPhrase] = useState('')
  const [email,  setEmail]  = useState('')
  const [pw,     setPw]     = useState('')
  const [pin,    setPin]    = useState('')
  const [error,  setError]  = useState('')
  const [busy,   setBusy]   = useState(false)

  const wordCount = phrase.trim() ? phrase.trim().split(/\s+/).length : 0
  const valid = (wordCount === 12 || wordCount === 24) && email.includes('@') && pw.length >= 6 && pin.length === 4

  const attempt = async () => {
    if (!valid || busy) return
    setBusy(true); setError('')
    const res = await onImport({ email, password: pw, pin, mnemonic: phrase })
    setBusy(false)
    if (!res || !res.ok) setError((res && res.error) || 'That seed phrase could not be imported.')
  }

  const input = {
    width: '100%', boxSizing: 'border-box', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14, padding: '13px 15px', color: '#fff', fontSize: 14,
    fontFamily: 'DM Sans,sans-serif', outline: 'none', marginBottom: 14,
  }
  const label = {
    display: 'block', fontFamily: 'DM Sans,sans-serif', fontSize: 13, fontWeight: 600,
    color: '#fff', marginBottom: 8,
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#101010', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 20px 0', flexShrink: 0,
      }}>
        <img src="/logo_nv_orange.png" alt="NV" style={{ width: 49, height: 22, objectFit: 'contain' }} />
        <div onClick={onBack} style={{
          width: 64, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#1F1F1F', borderRadius: 20, fontSize: 13, color: '#959595',
          fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', userSelect: 'none',
        }}>Back</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '18px 22px 0' }}>
        <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
          Import your wallet
        </div>
        <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, lineHeight: 1.55, color: '#959595', marginBottom: 18 }}>
          Enter your 12 or 24 word recovery phrase. It stays on this device and is stored encrypted.
        </div>

        <label style={label}>Recovery phrase</label>
        <textarea
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="word1 word2 word3 ..."
          rows={3}
          style={{ ...input, resize: 'none', lineHeight: 1.5 }}
        />

        <label style={label}>Email Address</label>
        <input style={input} type="email" placeholder="e.g danieljames@gmail.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <label style={label}>Password</label>
        <input style={input} type="password" placeholder="8-16 Character"
          value={pw} onChange={(e) => setPw(e.target.value)} />

        <label style={label}>PIN (4 digits)</label>
        <input style={input} type="password" inputMode="numeric" placeholder="••••" maxLength={4}
          value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />

        {error && (
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#FF8A5C', fontFamily: 'DM Sans,sans-serif', marginBottom: 6 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 22px 32px', flexShrink: 0 }}>
        <button
          onClick={attempt}
          disabled={!valid || busy}
          style={{
            width: '100%', height: 54, borderRadius: 30, border: 'none',
            background: valid ? 'linear-gradient(135deg,#F0834A,#EC641D)' : '#5E280C',
            color: valid ? '#fff' : 'rgba(0,0,0,0.55)',
            fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 700,
            cursor: valid ? 'pointer' : 'default',
            boxShadow: valid ? '0 8px 24px rgba(236,100,29,0.35)' : 'none',
          }}
        >
          Import wallet
        </button>
      </div>
    </div>
  )
}
