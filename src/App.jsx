import React, { useState, useEffect, useRef } from 'react'
import BottomNav from './components/BottomNav'
import { WalletProvider } from './wallet/WalletContext'
import { vaultExists, isUnlocked, createVault, importVault, verifyLogin, unlockWithPin } from './wallet/vault.js'

// Screens
import OnboardingScreen from './screens/OnboardingScreen'
import SignUpScreen     from './screens/SignUpScreen'
import LoginScreen      from './screens/LoginScreen'
import PinScreen        from './screens/PinScreen'
import SeedScreen       from './screens/SeedScreen'
import ImportScreen     from './screens/ImportScreen'
import HomeScreen       from './screens/HomeScreen'
import SendScreen       from './screens/SendScreen'
import SwapScreen       from './screens/SwapScreen'
import BridgeScreen     from './screens/BridgeScreen'
import DiscoverScreen   from './screens/DiscoverScreen'
import ActivityScreen   from './screens/ActivityScreen'

// Pages that show bottom nav
const MAIN_PAGES = ['home', 'swap', 'bridge', 'discover', 'activity']

export default function App() {
  const [page,   setPage]   = useState('onboarding')
  const [booted, setBooted] = useState(false)
  const [pinMode, setPinMode] = useState('create') // create | unlock
  const pendingCreds = useRef(null)
  const pageRef = useRef('onboarding')
  const [navTab, setNavTab] = useState('home')
  // Track previous page for back navigation on sub-flows
  const [prevPage, setPrevPage] = useState(null)
  // Full-screen success views (Send/Swap/Bridge) hide the bottom nav,
  // per the Figma design. Screens report via onSuccessView.
  const [navHidden, setNavHidden] = useState(false)

  // Boot: a device with a vault goes straight to PIN unlock;
  // a fresh device starts at onboarding.
  useEffect(() => {
    let live = true
    vaultExists().then((exists) => {
      if (!live) return
      if (exists) { setPinMode('unlock'); setPage('pin'); pageRef.current = 'pin' }
      setBooted(true)
    })
    // When the vault locks (Log out or auto-lock) while the user is
    // inside the wallet, return to the PIN unlock screen.
    const onSession = () => {
      if (!isUnlocked() && MAIN_PAGES.includes(pageRef.current)) {
        setPinMode('unlock')
        setPage('pin')
        pageRef.current = 'pin'
      }
    }
    window.addEventListener('nuvra:session-changed', onSession)
    return () => { live = false; window.removeEventListener('nuvra:session-changed', onSession) }
  }, [])

  const navigate = (dest) => {
    setPrevPage(page)
    pageRef.current = dest
    setPage(dest)
    setNavHidden(false)
    if (MAIN_PAGES.includes(dest)) setNavTab(dest)
  }

  const goBack = () => {
    if (prevPage) { setPage(prevPage); setPrevPage(null) }
    else navigate('home')
  }

  const showBottomNav = (MAIN_PAGES.includes(page) || page === 'send') && !navHidden

  if (!booted) {
    return (
      <WalletProvider>
        <div className="app-shell" style={{ background: '#101010' }} />
      </WalletProvider>
    )
  }

  return (
    <WalletProvider>
    <div className="app-shell">

      {/* ── Page area ── */}
      <div className="page-container">

        {/* Onboarding */}
        {page === 'onboarding' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <OnboardingScreen
              onDone={() => navigate('signup')}
              onHaveWallet={() => navigate('login')}
            />
          </div>
        )}

        {/* Sign Up */}
        {page === 'signup' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <SignUpScreen
              onCredentials={(creds) => { pendingCreds.current = creds }}
              onDone={() => { setPinMode('create'); navigate('pin') }}
              onBack={() => navigate('onboarding')}
              onLogin={() => navigate('login')}
            />
          </div>
        )}

        {/* Login */}
        {page === 'login' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <LoginScreen
              onLogin={async (email, pw) => {
                try { await verifyLogin(email, pw); return { ok: true } }
                catch (e) { return { ok: false, error: e.message } }
              }}
              onDone={() => { setPinMode('unlock'); navigate('pin') }}
              onCreateAccount={() => navigate('signup')}
              onImport={() => navigate('import')}
            />
          </div>
        )}

        {/* PIN */}
        {page === 'pin' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <PinScreen
              mode={pinMode}
              onComplete={async (pin) => {
                const c = pendingCreds.current
                if (c) await createVault({ email: c.email, password: c.pw, pin })
              }}
              onUnlock={async (pin) => {
                try { await unlockWithPin(pin); return true } catch { return false }
              }}
              onDone={() => navigate(pinMode === 'create' ? 'seed' : 'home')}
            />
          </div>
        )}

        {/* Seed backup (once, right after creation) */}
        {page === 'seed' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <SeedScreen onDone={() => navigate('home')}/>
          </div>
        )}

        {/* Import an existing wallet from its seed phrase */}
        {page === 'import' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <ImportScreen
              onImport={async (creds) => {
                try { await importVault(creds); navigate('home'); return { ok: true } }
                catch (e) { return { ok: false, error: e.message } }
              }}
              onBack={() => navigate('login')}
            />
          </div>
        )}

        {/* Home */}
        {page === 'home' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <HomeScreen onNav={navigate}/>
          </div>
        )}

        {/* Send */}
        {page === 'send' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <SendScreen onBack={() => navigate('home')} onSuccessView={setNavHidden}/>
          </div>
        )}

        {/* Swap */}
        {page === 'swap' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <SwapScreen onBack={() => navigate('home')} onSuccessView={setNavHidden}/>
          </div>
        )}

        {/* Bridge */}
        {page === 'bridge' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <BridgeScreen onSuccessView={setNavHidden}/>
          </div>
        )}

        {/* Discover */}
        {page === 'discover' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <DiscoverScreen/>
          </div>
        )}

        {/* Activity */}
        {page === 'activity' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <ActivityScreen/>
          </div>
        )}

      </div>

      {/* ── Bottom Navigation — shown on all main pages ── */}
      {showBottomNav && (
        <BottomNav
          active={navTab}
          onNav={(id) => {
            setNavTab(id)
            navigate(id)
          }}
        />
      )}

    </div>
    </WalletProvider>
  )
}
