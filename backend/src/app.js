// Nuvra backend API: accounts, email verification, passkeys,
// sessions, and split seed share coordination.
//
// Non-custodial contract, enforced by what this server can see:
// it stores an account share the client encrypted (opaque here),
// one Shamir share (useless alone, below the two of three
// threshold), and public addresses. It never receives the device
// share, a seed, or a private key, so it can never rebuild a
// wallet or sign anything.
import express from 'express'
import { randomUUID } from 'node:crypto'
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { hashPassword, verifyPassword, newCode, hashCode, newToken, hashToken } from './security.js'

const ACCESS_MS = 15 * 60 * 1000
const REFRESH_MS = 30 * 24 * 60 * 60 * 1000
const CODE_MS = 10 * 60 * 1000
const PASSKEY_FRESH_MS = 5 * 60 * 1000
const EMAIL_FRESH_MS = 10 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function createApp({ store, mailer, config = {} }) {
  const cfg = {
    rpID: config.rpID || 'localhost',
    rpName: config.rpName || 'Nuvra Wallet',
    origins: config.origins || ['http://localhost:8787'],
  }
  const app = express()
  app.use(express.json({ limit: '256kb' }))
  app.use((req, res, next) => { // dev CORS: extension and local web clients
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })

  const fail = (res, status, code, message) => res.status(status).json({ error: { code, message } })
  const now = () => Date.now()

  function createSession(userId, marks = {}) {
    const accessToken = newToken()
    const refreshToken = newToken()
    const session = {
      id: randomUUID(), userId,
      accessHash: hashToken(accessToken), refreshHash: hashToken(refreshToken),
      createdAt: now(), accessExpiresAt: now() + ACCESS_MS, refreshExpiresAt: now() + REFRESH_MS,
      passkeyVerifiedAt: marks.passkey ? now() : null,
      emailVerifiedAt: marks.email ? now() : null,
    }
    store.insert('sessions', session)
    return { accessToken, refreshToken, expiresIn: ACCESS_MS / 1000 }
  }

  function requireAuth(req, res, next) {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return fail(res, 401, 'NO_SESSION', 'An authenticated session is required.')
    const session = store.find('sessions', (s) => s.accessHash === hashToken(token))
    if (!session || session.accessExpiresAt < now()) return fail(res, 401, 'SESSION_EXPIRED', 'The session has expired. Log in again.')
    req.session = session
    req.user = store.find('users', (u) => u.id === session.userId)
    if (!req.user) return fail(res, 401, 'NO_USER', 'The account no longer exists.')
    next()
  }

  async function issueCode(user, purpose) {
    store.remove('codes', (c) => c.userId === user.id && c.purpose === purpose)
    const code = newCode()
    store.insert('codes', {
      id: randomUUID(), userId: user.id, purpose,
      codeHash: hashCode(user.id, code), expiresAt: now() + CODE_MS, attempts: 0,
    })
    await mailer.sendVerification(user.email, code)
  }

  function checkCode(user, purpose, code) {
    const row = store.find('codes', (c) => c.userId === user.id && c.purpose === purpose)
    if (!row || row.expiresAt < now()) return 'That code has expired. Request a new one.'
    if (row.attempts >= 5) return 'Too many attempts with that code. Request a new one.'
    if (row.codeHash !== hashCode(user.id, String(code))) {
      store.update('codes', (c) => c.id === row.id, { attempts: row.attempts + 1 })
      return 'That code is not correct.'
    }
    store.remove('codes', (c) => c.id === row.id)
    return null
  }

  app.get('/health', (req, res) => res.json({ ok: true, service: 'nuvra-backend' }))

  // ── Accounts ──────────────────────────────────────────────────
  app.post('/api/v1/auth/register', async (req, res) => {
    const { email, password } = req.body || {}
    if (!EMAIL_RE.test(String(email || ''))) return fail(res, 400, 'BAD_EMAIL', 'Enter a valid email address.')
    if (typeof password !== 'string' || password.length < 8) return fail(res, 400, 'WEAK_PASSWORD', 'The password must be at least 8 characters.')
    const clean = String(email).trim().toLowerCase()
    if (store.find('users', (u) => u.email === clean)) return fail(res, 409, 'EMAIL_TAKEN', 'An account with this email already exists.')
    const pw = await hashPassword(password)
    const user = { id: randomUUID(), email: clean, passwordHash: pw, emailVerified: false, createdAt: now(), currentChallenge: null }
    store.insert('users', user)
    await issueCode(user, 'verify-email')
    store.audit('USER_REGISTERED', { userId: user.id })
    res.status(201).json({ userId: user.id, emailVerified: false })
  })

  app.post('/api/v1/auth/verify-email', async (req, res) => {
    const { email, code } = req.body || {}
    const user = store.find('users', (u) => u.email === String(email || '').trim().toLowerCase())
    if (!user) return fail(res, 404, 'NO_USER', 'No account exists for this email.')
    const problem = checkCode(user, 'verify-email', code)
    if (problem) return fail(res, 400, 'BAD_CODE', problem)
    store.update('users', (u) => u.id === user.id, { emailVerified: true })
    store.audit('EMAIL_VERIFIED', { userId: user.id })
    const tokens = createSession(user.id, { email: true })
    res.json({ userId: user.id, emailVerified: true, ...tokens })
  })

  app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body || {}
    const user = store.find('users', (u) => u.email === String(email || '').trim().toLowerCase())
    if (!user || !(await verifyPassword(password || '', user.passwordHash))) {
      return fail(res, 401, 'BAD_CREDENTIALS', 'That email and password do not match.')
    }
    if (!user.emailVerified) return fail(res, 403, 'EMAIL_UNVERIFIED', 'Verify the email address before logging in.')
    store.audit('USER_AUTHENTICATED', { userId: user.id })
    res.json({ userId: user.id, ...createSession(user.id) })
  })

  app.post('/api/v1/auth/refresh', (req, res) => {
    const { refreshToken } = req.body || {}
    const session = refreshToken && store.find('sessions', (s) => s.refreshHash === hashToken(refreshToken))
    if (!session || session.refreshExpiresAt < now()) return fail(res, 401, 'SESSION_EXPIRED', 'The session has expired. Log in again.')
    store.remove('sessions', (s) => s.id === session.id)
    res.json(createSession(session.userId))
  })

  app.post('/api/v1/auth/logout', requireAuth, (req, res) => {
    store.remove('sessions', (s) => s.id === req.session.id)
    res.json({ ok: true })
  })

  // Fresh email proof inside a session (used by the share gate).
  app.post('/api/v1/auth/email-code', requireAuth, async (req, res) => {
    await issueCode(req.user, 'gate')
    res.json({ sent: true })
  })

  app.post('/api/v1/auth/email-code/verify', requireAuth, (req, res) => {
    const problem = checkCode(req.user, 'gate', (req.body || {}).code)
    if (problem) return fail(res, 400, 'BAD_CODE', problem)
    store.update('sessions', (s) => s.id === req.session.id, { emailVerifiedAt: now() })
    res.json({ verified: true })
  })

  // ── Passkeys ──────────────────────────────────────────────────
  app.post('/api/v1/auth/passkey/register/options', requireAuth, async (req, res) => {
    const existing = store.filter('passkeys', (p) => p.userId === req.user.id)
    const options = await generateRegistrationOptions({
      rpName: cfg.rpName, rpID: cfg.rpID,
      userID: new TextEncoder().encode(req.user.id),
      userName: req.user.email,
      attestationType: 'none',
      excludeCredentials: existing.map((p) => ({ id: p.credentialId })),
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    })
    store.update('users', (u) => u.id === req.user.id, { currentChallenge: options.challenge })
    res.json(options)
  })

  app.post('/api/v1/auth/passkey/register/verify', requireAuth, async (req, res) => {
    let verification
    try {
      verification = await verifyRegistrationResponse({
        response: req.body.response,
        expectedChallenge: req.user.currentChallenge,
        expectedOrigin: cfg.origins, expectedRPID: cfg.rpID,
      })
    } catch (e) {
      return fail(res, 400, 'PASSKEY_INVALID', `The passkey could not be verified. ${e.message}`)
    }
    if (!verification.verified) return fail(res, 400, 'PASSKEY_INVALID', 'The passkey could not be verified.')
    const cred = verification.registrationInfo.credential
    store.insert('passkeys', {
      id: randomUUID(), userId: req.user.id, credentialId: cred.id,
      publicKey: Buffer.from(cred.publicKey).toString('base64'),
      counter: cred.counter, createdAt: now(),
    })
    store.update('users', (u) => u.id === req.user.id, { currentChallenge: null })
    store.update('sessions', (s) => s.id === req.session.id, { passkeyVerifiedAt: now() })
    store.audit('PASSKEY_REGISTERED', { userId: req.user.id })
    res.json({ verified: true })
  })

  const loginChallenges = new Map()
  app.post('/api/v1/auth/passkey/login/options', async (req, res) => {
    const user = store.find('users', (u) => u.email === String((req.body || {}).email || '').trim().toLowerCase())
    if (!user) return fail(res, 404, 'NO_USER', 'No account exists for this email.')
    const creds = store.filter('passkeys', (p) => p.userId === user.id)
    if (!creds.length) return fail(res, 400, 'NO_PASSKEY', 'This account has no passkey. Log in with the password.')
    const options = await generateAuthenticationOptions({
      rpID: cfg.rpID,
      allowCredentials: creds.map((p) => ({ id: p.credentialId })),
      userVerification: 'preferred',
    })
    const challengeId = randomUUID()
    loginChallenges.set(challengeId, { userId: user.id, challenge: options.challenge, expiresAt: now() + 5 * 60 * 1000 })
    res.json({ challengeId, options })
  })

  async function verifyAssertion(user, response, challenge) {
    const cred = store.find('passkeys', (p) => p.userId === user.id && p.credentialId === response.id)
    if (!cred) throw new Error('This passkey is not registered on this account.')
    const verification = await verifyAuthenticationResponse({
      response, expectedChallenge: challenge, expectedOrigin: cfg.origins, expectedRPID: cfg.rpID,
      credential: {
        id: cred.credentialId,
        publicKey: new Uint8Array(Buffer.from(cred.publicKey, 'base64')),
        counter: cred.counter,
      },
    })
    if (!verification.verified) throw new Error('The passkey could not be verified.')
    store.update('passkeys', (p) => p.id === cred.id, { counter: verification.authenticationInfo.newCounter })
    return true
  }

  app.post('/api/v1/auth/passkey/login/verify', async (req, res) => {
    const { challengeId, response } = req.body || {}
    const pending = loginChallenges.get(challengeId)
    if (!pending || pending.expiresAt < now()) return fail(res, 400, 'CHALLENGE_EXPIRED', 'That passkey request has expired. Try again.')
    loginChallenges.delete(challengeId)
    const user = store.find('users', (u) => u.id === pending.userId)
    try {
      await verifyAssertion(user, response, pending.challenge)
    } catch (e) {
      return fail(res, 400, 'PASSKEY_INVALID', e.message)
    }
    store.audit('USER_AUTHENTICATED', { userId: user.id, via: 'passkey' })
    res.json({ userId: user.id, ...createSession(user.id, { passkey: true }) })
  })

  // Step up passkey proof inside an existing session (share gate).
  app.post('/api/v1/auth/passkey/verify/options', requireAuth, async (req, res) => {
    const creds = store.filter('passkeys', (p) => p.userId === req.user.id)
    if (!creds.length) return fail(res, 400, 'NO_PASSKEY', 'This account has no passkey.')
    const options = await generateAuthenticationOptions({
      rpID: cfg.rpID,
      allowCredentials: creds.map((p) => ({ id: p.credentialId })),
      userVerification: 'preferred',
    })
    store.update('sessions', (s) => s.id === req.session.id, { pendingChallenge: options.challenge })
    res.json(options)
  })

  app.post('/api/v1/auth/passkey/verify', requireAuth, async (req, res) => {
    try {
      await verifyAssertion(req.user, req.body.response, req.session.pendingChallenge)
    } catch (e) {
      return fail(res, 400, 'PASSKEY_INVALID', e.message)
    }
    store.update('sessions', (s) => s.id === req.session.id, { passkeyVerifiedAt: now(), pendingChallenge: null })
    res.json({ verified: true })
  })

  // ── Wallets and shares ────────────────────────────────────────
  app.post('/api/v1/wallets', requireAuth, (req, res) => {
    const { accountShare, nuvraShare, addresses } = req.body || {}
    if (typeof accountShare !== 'string' || !accountShare) return fail(res, 400, 'BAD_SHARE', 'The encrypted account share is required.')
    if (typeof nuvraShare !== 'string' || !nuvraShare) return fail(res, 400, 'BAD_SHARE', 'The Nuvra share is required.')
    if (!addresses || typeof addresses !== 'object') return fail(res, 400, 'BAD_ADDRESSES', 'The wallet addresses are required.')
    if (store.find('wallets', (w) => w.userId === req.user.id)) return fail(res, 409, 'WALLET_EXISTS', 'This account already has a wallet.')
    const wallet = {
      id: randomUUID(), userId: req.user.id, accountShare, nuvraShare,
      addresses, shareVersion: 1, createdAt: now(),
    }
    store.insert('wallets', wallet)
    store.audit('WALLET_CREATED', { userId: req.user.id, walletId: wallet.id })
    res.status(201).json({ walletId: wallet.id, addresses: wallet.addresses, shareVersion: 1 })
  })

  app.get('/api/v1/wallets/mine', requireAuth, (req, res) => {
    const wallet = store.find('wallets', (w) => w.userId === req.user.id)
    if (!wallet) return fail(res, 404, 'NO_WALLET', 'This account has no wallet yet.')
    res.json({ walletId: wallet.id, addresses: wallet.addresses, shareVersion: wallet.shareVersion, createdAt: wallet.createdAt })
  })

  app.post('/api/v1/wallets/shares/account', requireAuth, (req, res) => {
    const wallet = store.find('wallets', (w) => w.userId === req.user.id)
    if (!wallet) return fail(res, 404, 'NO_WALLET', 'This account has no wallet yet.')
    store.audit('SHARE_A_RELEASED', { userId: req.user.id, walletId: wallet.id })
    res.json({ accountShare: wallet.accountShare, shareVersion: wallet.shareVersion })
  })

  app.post('/api/v1/wallets/shares/nuvra/release', requireAuth, (req, res) => {
    const wallet = store.find('wallets', (w) => w.userId === req.user.id)
    if (!wallet) return fail(res, 404, 'NO_WALLET', 'This account has no wallet yet.')
    const missing = []
    if (!req.session.passkeyVerifiedAt || req.session.passkeyVerifiedAt < now() - PASSKEY_FRESH_MS) missing.push('passkey')
    if (!req.session.emailVerifiedAt || req.session.emailVerifiedAt < now() - EMAIL_FRESH_MS) missing.push('email')
    if (missing.length) {
      store.audit('SHARE_B_RELEASE_DENIED', { userId: req.user.id, walletId: wallet.id, missing })
      return fail(res, 403, 'GATE_INCOMPLETE', `The Nuvra share needs a fresh ${missing.join(' and ')} verification before it can be released.`)
    }
    store.audit('SHARE_B_RELEASED', { userId: req.user.id, walletId: wallet.id })
    res.json({ nuvraShare: wallet.nuvraShare, shareVersion: wallet.shareVersion })
  })

  app.put('/api/v1/wallets/shares', requireAuth, (req, res) => {
    const { accountShare, nuvraShare } = req.body || {}
    const wallet = store.find('wallets', (w) => w.userId === req.user.id)
    if (!wallet) return fail(res, 404, 'NO_WALLET', 'This account has no wallet yet.')
    if (!req.session.passkeyVerifiedAt || req.session.passkeyVerifiedAt < now() - PASSKEY_FRESH_MS) {
      return fail(res, 403, 'GATE_INCOMPLETE', 'Rotating shares needs a fresh passkey verification.')
    }
    if (typeof accountShare !== 'string' || !accountShare || typeof nuvraShare !== 'string' || !nuvraShare) {
      return fail(res, 400, 'BAD_SHARE', 'Both replacement shares are required.')
    }
    const version = wallet.shareVersion + 1
    store.update('wallets', (w) => w.id === wallet.id, { accountShare, nuvraShare, shareVersion: version })
    store.audit('SHARES_ROTATED', { userId: req.user.id, walletId: wallet.id, shareVersion: version })
    res.json({ shareVersion: version })
  })

  app.use((req, res) => fail(res, 404, 'NOT_FOUND', 'No such endpoint.'))
  return app
}
