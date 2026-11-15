import React, { useState } from 'react'
import BottomNav from './components/BottomNav'
import { WalletProvider } from './wallet/WalletContext'

// Screens
import OnboardingScreen from './screens/OnboardingScreen'
import SignUpScreen     from './screens/SignUpScreen'
import PinScreen        from './screens/PinScreen'
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
  const [navTab, setNavTab] = useState('home')
  // Track previous page for back navigation on sub-flows
  const [prevPage, setPrevPage] = useState(null)
  // Full-screen success views (Send/Swap/Bridge) hide the bottom nav,
  // per the Figma design. Screens report via onSuccessView.
  const [navHidden, setNavHidden] = useState(false)

  const navigate = (dest) => {
    setPrevPage(page)
    setPage(dest)
    setNavHidden(false)
    if (MAIN_PAGES.includes(dest)) setNavTab(dest)
  }

  const goBack = () => {
    if (prevPage) { setPage(prevPage); setPrevPage(null) }
    else navigate('home')
  }

  const showBottomNav = (MAIN_PAGES.includes(page) || page === 'send') && !navHidden

  return (
    <WalletProvider>
    <div className="app-shell">

      {/* ── Page area ── */}
      <div className="page-container">

        {/* Onboarding */}
        {page === 'onboarding' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <OnboardingScreen onDone={() => navigate('signup')}/>
          </div>
        )}

        {/* Sign Up */}
        {page === 'signup' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <SignUpScreen
              onDone={() => navigate('pin')}
              onBack={() => navigate('onboarding')}
            />
          </div>
        )}

        {/* PIN */}
        {page === 'pin' && (
          <div className="screen active" style={{ background: '#101010' }}>
            <PinScreen onDone={() => navigate('home')}/>
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
