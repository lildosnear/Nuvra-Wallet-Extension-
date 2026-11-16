import React, { useState } from 'react'

// Icon component — renders the row's icon in the Figma's style:
// white stroke glyphs centred in the disc. Manage Account, Preferences
// and Recovery Phrase use the supplied icon files; Connected Apps
// (stacked layers) and Log out (exit door) are drawn as stroke glyphs
// in the same style, from the Figma frame; the About row carries the
// white NV mark, wide and flat as in the design. A missing file falls
// back to a letter disc rather than a broken image.
function SettingIcon({ item }) {
  const [failed, setFailed] = useState(false)
  if (item.glyph === 'layers') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L22 8L12 13L2 8L12 3Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M2 12.5L12 17.5L22 12.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  if (item.glyph === 'logout') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" stroke="#FF5C5C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 17l5-5-5-5" stroke="#FF5C5C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12H9" stroke="#FF5C5C" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  }
  const size = item.wide ? 27 : 20
  if (failed) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.55, fontWeight: 700, color: '#959595', fontFamily: 'DM Sans,sans-serif' }}>
        {item.label.charAt(0) || '?'}
      </div>
    )
  }
  return (
    <img
      src={item.icon}
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

// Menu — ONE grouped card:
// Manage Account; Preferences; Connected Apps;
// Recovery Phrase; About Nuvra; Log out
// (Active Networks was here; network switching is removed for now,
// Desmond 2026-11-16, so the row and its panel are gone.)
const MENU_ITEMS = [
  { id: 'account',     label: 'Manage Account',  icon: '/settings_manage_account.png', danger: false },
  { id: 'preferences', label: 'Preferences',     icon: '/settings_preferences.png',    danger: false },
  { id: 'apps',        label: 'Connected Apps',  glyph: 'layers',                        danger: false },
  { id: 'recovery',    label: 'Recovery Phrase', icon: '/settings_recovery.png',       danger: false },
  { id: 'about',       label: 'About Nuvra',     icon: '/settings_about.png', wide: true, danger: false },
  { id: 'logout',      label: 'Log out',         glyph: 'logout',                        danger: true  },
]

// The Figma menu is TWO cards: account + preferences, then the rest.
const MENU_GROUPS = [MENU_ITEMS.slice(0, 2), MENU_ITEMS.slice(2)]

export default function SettingsScreen({ onClose }) {
  const [hovered, setHovered] = useState(null)

  const handleItem = (id) => {
    if (id === 'logout') {
      onClose()
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

          {/* Menu — TWO cards, as in the Figma, with a gap between them */}
          <div style={{ padding: '0 16px' }}>
            {MENU_GROUPS.map((group, gi) => (
              <div key={gi} style={{
                background: '#1A1A1A',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                overflow: 'hidden',
                marginTop: gi === 0 ? 0 : 14,
              }}>
                {group.map((item, ii) => (
                  <div
                    key={item.id}
                    onClick={() => handleItem(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '6px 16px', minHeight: 56, boxSizing: 'border-box',
                      borderBottom: ii < group.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      cursor: 'pointer',
                      background: hovered === item.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={() => setHovered(item.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* Icon disc — black; solid dark maroon for Log out */}
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: item.danger ? '#3D130E' : '#000',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <SettingIcon item={item}/>
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
            ))}
          </div>


        </div>
      </div>
    </>
  )
}
