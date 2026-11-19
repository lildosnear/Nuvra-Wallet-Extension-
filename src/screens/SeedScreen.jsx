import React from 'react'
import { getSessionMnemonic } from '../wallet/vault.js'

// ═══════════════════════════════════════════════════════════════════
//   SEED BACKUP — shown once, right after the vault is created.
//   The phrase exists only in the live session at this moment;
//   it is never stored in plain text anywhere.
// ═══════════════════════════════════════════════════════════════════
export default function SeedScreen({ onDone }) {
  const mnemonic = getSessionMnemonic()
  const words = mnemonic ? mnemonic.split(' ') : []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#101010', overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px 0', flexShrink: 0 }}>
        <img src="/logo_nv_orange.png" alt="NV" style={{ width: 49, height: 22, objectFit: 'contain' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '18px 22px 0' }}>
        <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
          Your recovery phrase
        </div>
        <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, lineHeight: 1.55, color: '#959595', marginBottom: 18 }}>
          Write these 12 words down in order and keep them somewhere safe. They are the only way back into this wallet. Anyone who has them can take your funds, and if you lose them, your funds are gone for good.
        </div>

        {words.length === 12 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {words.map((w, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#1A1A1A', borderRadius: 12, padding: '11px 14px',
              }}>
                <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: '#959595', width: 16 }}>{i + 1}</span>
                <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14.5, fontWeight: 600, color: '#fff' }}>{w}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, lineHeight: 1.55, color: '#959595' }}>
            Your phrase can only be shown right after the wallet is created or imported. Keep the copy you wrote down safe.
          </div>
        )}
      </div>

      <div style={{ padding: '16px 22px 32px', flexShrink: 0 }}>
        <button
          onClick={onDone}
          style={{
            width: '100%', height: 54, borderRadius: 30, border: 'none',
            background: 'linear-gradient(135deg,#F0834A,#EC641D)',
            color: '#fff', fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(236,100,29,0.35)',
          }}
        >
          I have written it down
        </button>
      </div>
    </div>
  )
}
