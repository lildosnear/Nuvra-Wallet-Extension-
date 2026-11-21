// End to end API tests: accounts, email verification, sessions,
// real WebAuthn passkeys (software authenticator), wallet
// creation, and the two proof gate on the Nuvra share release.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../src/app.js'
import { createStore } from '../src/store.js'
import { createDevMailer } from '../src/mailer.js'
import { createAuthenticator } from './webauthn-helper.js'

const ORIGIN = 'http://localhost:8787'
let server, base, store, mailer
const EMAIL = 'desmond@example.com'
const PASSWORD = 'correct horse battery'

before(async () => {
  store = createStore()
  mailer = createDevMailer()
  const app = createApp({ store, mailer, config: { rpID: 'localhost', origins: [ORIGIN] } })
  await new Promise((resolve) => { server = app.listen(0, resolve) })
  base = `http://localhost:${server.address().port}`
})
after(() => server.close())

async function call(path, { method = 'POST', token, body } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}
const lastCode = () => mailer.outbox[mailer.outbox.length - 1].code

let accessToken

test('registration validates input and rejects duplicates', async () => {
  assert.equal((await call('/api/v1/auth/register', { body: { email: 'nope', password: PASSWORD } })).status, 400)
  assert.equal((await call('/api/v1/auth/register', { body: { email: EMAIL, password: 'short' } })).status, 400)
  const ok = await call('/api/v1/auth/register', { body: { email: EMAIL, password: PASSWORD } })
  assert.equal(ok.status, 201)
  assert.equal(ok.data.emailVerified, false)
  assert.equal((await call('/api/v1/auth/register', { body: { email: EMAIL, password: PASSWORD } })).status, 409)
})

test('login is blocked before email verification, and by a wrong password', async () => {
  const early = await call('/api/v1/auth/login', { body: { email: EMAIL, password: PASSWORD } })
  assert.equal(early.status, 403)
  assert.equal(early.data.error.code, 'EMAIL_UNVERIFIED')
  const badCode = await call('/api/v1/auth/verify-email', { body: { email: EMAIL, code: '000000' } })
  assert.equal(badCode.status, 400)
  const verified = await call('/api/v1/auth/verify-email', { body: { email: EMAIL, code: lastCode() } })
  assert.equal(verified.status, 200)
  assert.ok(verified.data.accessToken)
  const wrong = await call('/api/v1/auth/login', { body: { email: EMAIL, password: 'not the password' } })
  assert.equal(wrong.status, 401)
  const login = await call('/api/v1/auth/login', { body: { email: EMAIL, password: PASSWORD } })
  assert.equal(login.status, 200)
  accessToken = login.data.accessToken
})

test('wallet creation stores shares and metadata; mine hides the shares', async () => {
  const noAuth = await call('/api/v1/wallets', { body: { accountShare: 'x', nuvraShare: 'y', addresses: {} } })
  assert.equal(noAuth.status, 401)
  const created = await call('/api/v1/wallets', {
    token: accessToken,
    body: { accountShare: 'ENCRYPTED_A_BLOB', nuvraShare: 'SHARE_B_BASE64', addresses: { 'bob-sepolia': '0xabc', 'bitcoin-testnet': 'tb1pabc' } },
  })
  assert.equal(created.status, 201)
  assert.equal(created.data.shareVersion, 1)
  const dup = await call('/api/v1/wallets', { token: accessToken, body: { accountShare: 'x', nuvraShare: 'y', addresses: {} } })
  assert.equal(dup.status, 409)
  const mine = await call('/api/v1/wallets/mine', { method: 'GET', token: accessToken })
  assert.equal(mine.status, 200)
  assert.equal(mine.data.addresses['bob-sepolia'], '0xabc')
  assert.equal(mine.data.nuvraShare, undefined)
  assert.equal(mine.data.accountShare, undefined)
})

test('the account share releases on a session; the Nuvra share refuses without both proofs', async () => {
  const a = await call('/api/v1/wallets/shares/account', { token: accessToken })
  assert.equal(a.status, 200)
  assert.equal(a.data.accountShare, 'ENCRYPTED_A_BLOB')
  const b = await call('/api/v1/wallets/shares/nuvra/release', { token: accessToken })
  assert.equal(b.status, 403)
  assert.equal(b.data.error.code, 'GATE_INCOMPLETE')
})

test('email proof alone is not enough for the Nuvra share', async () => {
  await call('/api/v1/auth/email-code', { token: accessToken })
  const verified = await call('/api/v1/auth/email-code/verify', { token: accessToken, body: { code: lastCode() } })
  assert.equal(verified.status, 200)
  const b = await call('/api/v1/wallets/shares/nuvra/release', { token: accessToken })
  assert.equal(b.status, 403) // passkey proof still missing
})

const authenticator = createAuthenticator('localhost')

test('passkey registration and step up complete the gate', async () => {
  const options = await call('/api/v1/auth/passkey/register/options', { token: accessToken })
  assert.equal(options.status, 200)
  const response = authenticator.registrationResponse(options.data, ORIGIN)
  const verified = await call('/api/v1/auth/passkey/register/verify', { token: accessToken, body: { response } })
  assert.equal(verified.status, 200, JSON.stringify(verified.data))
  // Email proof was verified in the previous test on this session,
  // and registering the passkey just marked the passkey proof.
  const b = await call('/api/v1/wallets/shares/nuvra/release', { token: accessToken })
  assert.equal(b.status, 200)
  assert.equal(b.data.nuvraShare, 'SHARE_B_BASE64')
})

test('passkey login creates a session carrying the passkey proof', async () => {
  const options = await call('/api/v1/auth/passkey/login/options', { body: { email: EMAIL } })
  assert.equal(options.status, 200)
  const response = authenticator.authenticationResponse(options.data.options, ORIGIN)
  const login = await call('/api/v1/auth/passkey/login/verify', { body: { challengeId: options.data.challengeId, response } })
  assert.equal(login.status, 200, JSON.stringify(login.data))
  assert.ok(login.data.accessToken)
  // This session has the passkey proof but no fresh email proof.
  const b = await call('/api/v1/wallets/shares/nuvra/release', { token: login.data.accessToken })
  assert.equal(b.status, 403)
})

test('rotation needs a fresh passkey proof and replaces both shares', async () => {
  const stale = await call('/api/v1/wallets/shares', { method: 'PUT', token: accessToken, body: { accountShare: 'A2', nuvraShare: 'B2' } })
  assert.equal(stale.status, 200) // accessToken session earned a fresh passkey mark at registration
  const a = await call('/api/v1/wallets/shares/account', { token: accessToken })
  assert.equal(a.data.accountShare, 'A2')
  assert.equal(a.data.shareVersion, 2)
  const fresh = await call('/api/v1/auth/login', { body: { email: EMAIL, password: PASSWORD } })
  const denied = await call('/api/v1/wallets/shares', { method: 'PUT', token: fresh.data.accessToken, body: { accountShare: 'A3', nuvraShare: 'B3' } })
  assert.equal(denied.status, 403)
})

test('refresh rotates tokens and logout kills the session', async () => {
  const login = await call('/api/v1/auth/login', { body: { email: EMAIL, password: PASSWORD } })
  const refreshed = await call('/api/v1/auth/refresh', { body: { refreshToken: login.data.refreshToken } })
  assert.equal(refreshed.status, 200)
  assert.ok(refreshed.data.accessToken)
  const out = await call('/api/v1/auth/logout', { token: refreshed.data.accessToken })
  assert.equal(out.status, 200)
  const afterLogout = await call('/api/v1/wallets/mine', { method: 'GET', token: refreshed.data.accessToken })
  assert.equal(afterLogout.status, 401)
})

test('the audit log recorded the lifecycle, including the denial', () => {
  const events = store.data.audit.map((a) => a.event)
  for (const expected of ['USER_REGISTERED', 'EMAIL_VERIFIED', 'PASSKEY_REGISTERED', 'WALLET_CREATED', 'SHARE_A_RELEASED', 'SHARE_B_RELEASE_DENIED', 'SHARE_B_RELEASED', 'SHARES_ROTATED']) {
    assert.ok(events.includes(expected), `missing audit event ${expected}`)
  }
})
