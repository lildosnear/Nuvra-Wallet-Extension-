// Split seed vault against the REAL backend, booted in process:
// automatic wallet creation at account setup, device unlock,
// the gated recovery on a simulated new device, share rotation,
// and the Settings seed phrase reveal.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../backend/src/app.js'
import { createStore } from '../backend/src/store.js'
import { createDevMailer } from '../backend/src/mailer.js'
import { createAuthenticator } from '../backend/test/webauthn-helper.js'
import {
  createApi, createSplitWallet, hasSplitWallet, wipeSplitWalletLocal,
  unlockSplitWithPin, unlockSplitWithPassword, recoverSplitWallet, revealMnemonic,
} from '../src/wallet/vault2.js'
import { getSession, lockVault } from '../src/wallet/vault.js'
import { combineShares } from '../src/wallet/shamir.js'
import { dec } from '../src/wallet/vault.js'

const FAST = { memoryKiB: 1024, iterations: 1, parallelism: 1, hashLength: 32 }
const ORIGIN = 'http://localhost:8787'
const EMAIL = 'adaeze@example.com'
const PASSWORD = 'a strong password'
const PIN = '2468'

let server, api, store, mailer, tokens, createdAddresses, createdMnemonic
const authenticator = createAuthenticator('localhost')
const lastCode = () => mailer.outbox[mailer.outbox.length - 1].code

before(async () => {
  store = createStore()
  mailer = createDevMailer()
  const app = createApp({ store, mailer, config: { rpID: 'localhost', origins: [ORIGIN] } })
  await new Promise((resolve) => { server = app.listen(0, resolve) })
  api = createApi(`http://localhost:${server.address().port}`)
})
after(() => server.close())

async function raw(path, { token, body } = {}) {
  const res = await fetch(`http://localhost:${server.address().port}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}

test('account registration and email verification issue a session', async () => {
  const reg = await api.register(EMAIL, PASSWORD)
  assert.equal(reg.emailVerified, false)
  tokens = await api.verifyEmail(EMAIL, lastCode())
  assert.ok(tokens.accessToken)
})

test('creating the account creates the wallet automatically', async () => {
  const { addresses, shareVersion } = await createSplitWallet({
    email: EMAIL, password: PASSWORD, pin: PIN, api, tokens, kdf: FAST,
  })
  createdAddresses = addresses
  createdMnemonic = getSession().mnemonic
  assert.equal(shareVersion, 1)
  assert.ok(addresses['bob-sepolia'].startsWith('0x'))
  assert.ok(addresses['bitcoin'].startsWith('bc1p'))
  assert.equal(await hasSplitWallet(), true)
  // The backend holds exactly one wallet, and never saw a seed.
  const mine = await api.getWallet(tokens.accessToken)
  assert.equal(mine.addresses['bob-sepolia'], addresses['bob-sepolia'])
  const serverWallet = store.data.wallets[0]
  assert.ok(serverWallet.accountShare.length > 40)
  assert.ok(!JSON.stringify(serverWallet).includes(createdMnemonic.split(' ')[0]))
})

test('device unlock works with the PIN and the password, and rejects wrong ones', async () => {
  lockVault()
  assert.equal(await unlockSplitWithPin('9999'), null)
  const byPin = await unlockSplitWithPin(PIN)
  assert.equal(byPin.addresses['bob-sepolia'], createdAddresses['bob-sepolia'])
  lockVault()
  const byPassword = await unlockSplitWithPassword(PASSWORD)
  assert.equal(byPassword.addresses['bitcoin'], createdAddresses['bitcoin'])
  lockVault()
})

test('the Settings reveal shows the original phrase after password proof', async () => {
  const phrase = await revealMnemonic({ password: PASSWORD })
  assert.equal(phrase, createdMnemonic)
  await assert.rejects(() => revealMnemonic({ password: 'wrong password' }), /not correct/)
})

test('recovery is refused until the gate proofs are fresh', async () => {
  // Register a passkey first (needed for the gate and rotation).
  const options = await raw('/api/v1/auth/passkey/register/options', { token: tokens.accessToken })
  const regResponse = authenticator.registrationResponse(options.data, ORIGIN)
  const regVerify = await raw('/api/v1/auth/passkey/register/verify', { token: tokens.accessToken, body: { response: regResponse } })
  assert.equal(regVerify.status, 200)

  // Simulate the lost device: local record gone, fresh login.
  await wipeSplitWalletLocal()
  assert.equal(await hasSplitWallet(), false)
  const login = await api.login(EMAIL, PASSWORD)
  // No fresh passkey, no fresh email proof on this session: the
  // Nuvra share must refuse, so recovery must fail at that step.
  await assert.rejects(
    () => recoverSplitWallet({ email: EMAIL, password: PASSWORD, pin: PIN, api, tokens: login, kdf: FAST }),
    /fresh passkey and email/,
  )
  tokens = login
})

test('with passkey and email proofs, recovery rebuilds the wallet and rotates the shares', async () => {
  // Fresh passkey step up on this session.
  const stepOptions = await raw('/api/v1/auth/passkey/verify/options', { token: tokens.accessToken })
  const assertion = authenticator.authenticationResponse(stepOptions.data, ORIGIN)
  const stepVerify = await raw('/api/v1/auth/passkey/verify', { token: tokens.accessToken, body: { response: assertion } })
  assert.equal(stepVerify.status, 200)
  // Fresh email proof.
  await api.requestGateCode(tokens.accessToken)
  await api.verifyGateCode(tokens.accessToken, lastCode())

  const before = { ...store.data.wallets[0] } // snapshot: the store mutates rows in place
  const { addresses, shareVersion } = await recoverSplitWallet({
    email: EMAIL, password: PASSWORD, pin: '1357', api, tokens, kdf: FAST,
  })
  assert.deepEqual(addresses, createdAddresses) // same wallet, same addresses
  assert.equal(shareVersion, 2)
  const afterRotation = store.data.wallets[0]
  assert.notEqual(afterRotation.nuvraShare, before.nuvraShare) // shares rotated
  assert.notEqual(afterRotation.accountShare, before.accountShare)
  // The new device unlocks with the NEW pin.
  lockVault()
  const unlocked = await unlockSplitWithPin('1357')
  assert.equal(unlocked.addresses['bob-sepolia'], createdAddresses['bob-sepolia'])
  lockVault()
})

test('one share from the server can never rebuild the entropy', async () => {
  const { accountShare } = await api.fetchAccountShare(tokens.accessToken)
  const { nuvraShare } = await api.releaseNuvraShare(tokens.accessToken)
  // B alone: combine refuses fewer than two shares.
  assert.throws(() => combineShares([dec(nuvraShare)]), /at least 2/)
  // The account share on the server is ciphertext, not a share.
  const parsed = JSON.parse(accountShare)
  assert.ok(parsed.ct && parsed.salt && parsed.iv)
})
