import React, { useState } from 'react'
import { useWallet } from '../wallet/WalletContext'
import { CHAINS } from '../chains/registry'

// Icon component — renders uploaded icon images. If an icon file has
// not been supplied yet, it falls back to a letter disc instead of
// showing a broken image.
function SettingIcon({ src, label = '', size = 20 }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55, fontWeight: 700, color: '#959595', fontFamily: 'DM Sans,sans-serif' }}>
        {label.charAt(0) || '?'}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}

// Chevron right
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="#959595" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Menu — ONE grouped card, in the Figma order:
// Manage Account; Preferences; Active Networks; Connected Apps;
// Recovery Phrase; About Nuvra; Log out
const MENU_ITEMS = [
  { id: 'account',     label: 'Manage Account',  icon: '/settings_manage_account.png', danger: false },
  { id: 'preferences', label: 'Preferences',     icon: '/settings_preferences.png',    danger: false },
  { id: 'networks',    label: 'Active Networks', icon: '/settings_networks.png',       danger: false },
  { id: 'apps',        label: 'Connected Apps',  icon: '/settings_apps.png',           danger: false },
  { id: 'recovery',    label: 'Recovery Phrase', icon: '/settings_recovery.png',       danger: false },
  { id: 'about',       label: 'About Nuvra',     icon: '/settings_about.png',          danger: false },
  { id: 'logout',      label: 'Log out',         icon: '/settings_logout.png',         danger: true  },
]

export default function SettingsScreen({ onClose }) {
  const [hovered, setHovered] = useState(null)
  const [showNetworks, setShowNetworks] = useState(false)
  const { selectedChainId, setSelectedChain } = useWallet()

  const handleItem = (id) => {
    if (id === 'logout') {
      onClose()
    }
    if (id === 'networks') {
      setShowNetworks(v => !v)
    }
    // Add navigation for other items as needed
  }

  return (
    <>
      <style>{`
        @keyframes settingsSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.78)',
          backdropFilter: 'blur(8px)',
          zIndex: 80,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* Sheet */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            background: '#101010',
            borderRadius: '24px 24px 0 0',
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
            paddingBottom: 36,
            animation: 'settingsSlideUp 0.35s cubic-bezier(0.4,0,0.2,1)',
            maxHeight: '94%',
            overflowY: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 20px 0',
          }}>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>
              Settings
            </div>
            {/* White circle X close */}
            <div onClick={onClose} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#E8E8E8'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2L12 12M12 2L2 12" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 20px 20px' }}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <div style={{
                width: 110, height: 110, borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(236,100,29,0.35)',
              }}>
                <img src="/home/avatar.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              </div>
              {/* Edit badge — small dark circle with pencil */}
              <div style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 28, height: 28, borderRadius: '50%',
                background: '#1F1F1F',
                border: '2px solid #101010',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8 1.5L10.5 4L4 10.5H1.5V8L8 1.5Z" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
              Hi, Danii 👋
            </div>
          </div>

          {/* ONE grouped menu card */}
          <div style={{ padding: '0 16px' }}>
            <div style={{
              background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20,
              overflow: 'hidden',
            }}>
              {MENU_ITEMS.map((item, ii) => (
                <div
                  key={item.id}
                  onClick={() => handleItem(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '6px 16px', minHeight: 56, boxSizing: 'border-box',
                    borderBottom: ii < MENU_ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    cursor: 'pointer',
                    background: hovered === item.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Icon circle — black; dark red for Log out */}
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: item.danger ? 'rgba(200,40,0,0.18)' : '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <SettingIcon src={item.icon} label={item.label} size={20}/>
                  </div>

                  {/* Label — white, including Log out */}
                  <div style={{
                    flex: 1,
                    fontSize: 15, fontWeight: 500,
                    color: '#fff',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>
                    {item.label}
                  </div>

                  <ChevronRight/>
                </div>
              ))}
            </div>
          </div>

          {/* Active Networks — driven by the chain registry */}
          {showNetworks && (
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{
                background: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                overflow: 'hidden',
              }}>
                {CHAINS.map((c, i) => {
                  const soon = c.status === 'coming-soon'
                  const active = selectedChainId === c.id
                  return (
                    <div key={c.id}
                      onClick={() => { if (!soon) setSelectedChain(c.id) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '13px 16px',
                        borderBottom: i < CHAINS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        cursor: soon ? 'default' : 'pointer',
                        opacity: soon ? 0.55 : 1,
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#959595', fontFamily: 'DM Sans, sans-serif' }}>
                          {c.testnet ? 'Testnet' : 'Mainnet'} · {c.addressFormatLabel}
                        </div>
                      </div>
                      {soon
                        ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: '#EC641D', background: 'rgba(236,100,29,0.12)', border: '1px solid rgba(236,100,29,0.3)', borderRadius: 6, padding: '2px 6px', fontFamily: 'DM Sans, sans-serif' }}>SOON</span>
                        : active
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#1fd090', fontFamily: 'DM Sans, sans-serif' }}>Active</span>
                          : <span style={{ fontSize: 11, color: '#959595', fontFamily: 'DM Sans, sans-serif' }}>Select</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
