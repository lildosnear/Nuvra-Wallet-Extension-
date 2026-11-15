import React, { useState } from 'react'
import { useWallet } from '../wallet/WalletContext'
import { CHAINS } from '../chains/registry'

// Icon component — renders uploaded icon images, stripped of dark bg
function SettingIcon({ src, size = 18 }) {
  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  )
}

// Chevron right
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4L10 8L6 12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Menu structure — matches design order exactly
// Group 1: Manage Account, Preferences
// Group 2: Active Networks, Connected Apps, Recovery Phrase
// Group 3: About Nuvra, Log out
const MENU_GROUPS = [
  [
    { id: 'account',     label: 'Manage Account',  icon: '/settings_manage_account.png', danger: false },
    { id: 'preferences', label: 'Preferences',      icon: '/settings_preferences.png',    danger: false },
  ],
  [
    { id: 'networks',    label: 'Active Networks',  icon: '/settings_networks.png',       danger: false },
    { id: 'apps',        label: 'Connected Apps',   icon: '/settings_apps.png',           danger: false },
    { id: 'recovery',    label: 'Recovery Phrase',  icon: '/settings_recovery.png',       danger: false },
  ],
  [
    { id: 'about',       label: 'About Nuvra',      icon: '/settings_about.png',          danger: false },
    { id: 'logout',      label: 'Log out',          icon: '/settings_logout.png',         danger: true  },
  ],
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
          {/* Handle bar */}
          <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '12px auto 0' }}/>

          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 0',
          }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff' }}>
              Settings
            </div>
            {/* X close */}
            <div onClick={onClose} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2L12 12M12 2L2 12" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 20px 18px' }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(236,100,29,0.35)',
              }}>
                <img src="/home/avatar.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              </div>
              {/* Edit badge */}
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 26, height: 26, borderRadius: '50%',
                background: '#EC641D',
                border: '2px solid #101010',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M8 1.5L10.5 4L4 10.5H1.5V8L8 1.5Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: '#fff' }}>
              Hi, Danii 👋
            </div>
          </div>

          {/* Menu groups */}
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MENU_GROUPS.map((group, gi) => (
              <div key={gi} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                overflow: 'hidden',
              }}>
                {group.map((item, ii) => (
                  <div
                    key={item.id}
                    onClick={() => handleItem(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px',
                      borderBottom: ii < group.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      cursor: 'pointer',
                      background: hovered === item.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={() => setHovered(item.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* Icon circle */}
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: item.danger ? 'rgba(232,64,0,0.1)' : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${item.danger ? 'rgba(232,64,0,0.2)' : 'rgba(255,255,255,0.09)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <SettingIcon src={item.icon} size={19}/>
                    </div>

                    {/* Label */}
                    <div style={{
                      flex: 1,
                      fontSize: 14, fontWeight: 500,
                      color: item.danger ? '#e84000' : '#fff',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      {item.label}
                    </div>

                    <ChevronRight/>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Active Networks — driven by the chain registry */}
          {showNetworks && (
            <div style={{ padding: '12px 16px 0' }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
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
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif' }}>
                          {c.testnet ? 'Testnet' : 'Mainnet'} · {c.addressFormatLabel}
                        </div>
                      </div>
                      {soon
                        ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, color: '#EC641D', background: 'rgba(236,100,29,0.12)', border: '1px solid rgba(236,100,29,0.3)', borderRadius: 6, padding: '2px 6px', fontFamily: 'DM Sans, sans-serif' }}>SOON</span>
                        : active
                          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#1fd090', fontFamily: 'DM Sans, sans-serif' }}>Active</span>
                          : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'DM Sans, sans-serif' }}>Select</span>}
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
