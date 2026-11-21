// ═══════════════════════════════════════════════════════════════════
//   Split seed vault (the decided model, 2026-11-20).
//
//   The seed entropy is split with Shamir into three shares, two
//   of three to rebuild:
//     A, the account share: encrypted under the password key. The
//        encrypted blob lives on the Nuvra backend; a copy is
//        cached on the device, wrapped by the password and the PIN.
//     B, the Nuvra share: stored on the backend, released only
//        after passkey verification and email verification.
//     C, the device share: stored only on this device.
//   The seed exists only in memory while unlocked, exactly as in
//   the device vault, so signing (send.js) works unchanged.
//   Nothing here can rebuild a wallet from one share, and the
//   backend never holds two usable shares.
// ═══════════════════════════════════════════════════════════════════
import { generateMnemonic, mnemonicToSeedSync, entropyToMnemonic, mnemonicToEntropy } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { randomBytes } from '@noble/hashes/utils.js'
import { splitSecret, combineShares } from './shamir.js'
import {
  storage, deriveCredentialKey, aesEncrypt, aesDecrypt, enc, dec,
  deriveAddresses, startSessionWith, KDF,
} from './vault.js'

const V2_KEY = 'nuvra:vault:v2'
export const DEFAULT_API_URL = 'http://localhost:8787'

// ── Backend client ────────────────────────────────────────────────
export function createApi(baseUrl = DEFAULT_API_URL) {
  async function call(path, { method = 'GET', token, body } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(data?.error?.message || `The Nuvra server could not be reached (${res.status}).`)
      err.code = data?.error?.code
      err.status = res.status
      throw err
    }
    return data
  }
  return {
    register: (email, password) => call('/api/v1/auth/register', { method: 'POST', body: { email, password } }),
    verifyEmail: (email, code) => call('/api/v1/auth/verify-email', { method: 'POST', body: { email, code } }),
    login: (email, password) => call('/api/v1/auth/login', { method: 'POST', body: { email, password } }),
    getWallet: (token) => call('/api/v1/wallets/mine', { token }),
    createWallet: (token, payload) => call('/api/v1/wallets', { method: 'POST', token, body: payload }),
    fetchAccountShare: (token) => call('/api/v1/wallets/shares/account', { method: 'POST', token }),
    releaseNuvraShare: (token) => call('/api/v1/wallets/shares/nuvra/release', { method: 'POST', token }),
    rotateShares: (token, payload) => call('/api/v1/wallets/shares', { method: 'PUT', token, body: payload }),
    requestGateCode: (token) => call('/api/v1/auth/email-code', { method: 'POST', token }),
    verifyGateCode: (token, code) => call('/api/v1/auth/email-code/verify', { method: 'POST', token, body: { code } }),
  }
}

// ── Local record ──────────────────────────────────────────────────
async function readRecord() { return (await storage.get(V2_KEY)) || null }
async function writeRecord(record) { await storage.set(V2_KEY, record) }
export async function hasSplitWallet() { return (await readRecord()) !== null }
export async function wipeSplitWalletLocal() { await storage.remove(V2_KEY) }

async function wrapShare(share, secret, kdf) {
  const salt = randomBytes(16)
  const key = await deriveCredentialKey(secret, salt, kdf)
  const blob = await aesEncrypt(key, share)
  // The KDF parameters travel with the blob, so a blob stays
  // openable even after the app's default parameters change.
  return { salt: enc(salt), ...blob, kdf }
}

async function unwrapShare(wrapped, secret, kdfFallback) {
  const key = await deriveCredentialKey(secret, dec(wrapped.salt), wrapped.kdf || kdfFallback)
  return aesDecrypt(key, wrapped)
}

function serverBlob(wrapped) {
  return JSON.stringify({ salt: wrapped.salt, iv: wrapped.iv, ct: wrapped.ct, kdf: wrapped.kdf })
}

function sessionFromEntropy(entropy) {
  const mnemonic = entropyToMnemonic(entropy, wordlist)
  return startSessionWith(mnemonicToSeedSync(mnemonic), mnemonic)
}

// ── Create: account exists on the backend, the wallet appears ─────
// tokens: the session tokens from verifyEmail or login.
export async function createSplitWallet({ email, password, pin, api, tokens, kdf = KDF }) {
  const mnemonic = generateMnemonic(wordlist, 128)
  const entropy = mnemonicToEntropy(mnemonic, wordlist)
  const [shareA, shareB, shareC] = splitSecret(entropy)
  const byPassword = await wrapShare(shareA, password, kdf)
  const byPin = await wrapShare(shareA, pin, kdf)
  const addresses = deriveAddresses(mnemonicToSeedSync(mnemonic))
  const created = await api.createWallet(tokens.accessToken, {
    accountShare: serverBlob(byPassword),
    nuvraShare: enc(shareB),
    addresses,
  })
  await writeRecord({
    version: 2, email, kdf,
    byPassword, byPin,
    deviceShare: enc(shareC),
    shareVersion: created.shareVersion,
  })
  const session = startSessionWith(mnemonicToSeedSync(mnemonic), mnemonic)
  return { addresses: session.addresses, shareVersion: created.shareVersion }
}

// ── Unlock on this device: PIN or password + the device share ─────
async function unlockWith(wrapped, secret, kdfOverride) {
  const record = await readRecord()
  if (!record) return null
  try {
    const shareA = await unwrapShare(wrapped(record), secret, kdfOverride || record.kdf)
    const entropy = combineShares([shareA, dec(record.deviceShare)])
    return sessionFromEntropy(entropy)
  } catch {
    return null
  }
}

export function unlockSplitWithPin(pin) {
  return unlockWith((r) => r.byPin, pin)
}

export function unlockSplitWithPassword(password) {
  return unlockWith((r) => r.byPassword, password)
}

// ── Recovery on a new device ───────────────────────────────────────
// The session behind tokens must already carry both gate proofs:
// a fresh passkey verification and a fresh email verification.
// Fetches A (opened by the password) and B (released by the gate),
// rebuilds the wallet, then rotates every share so the shares on
// the lost device die.
export async function recoverSplitWallet({ email, password, pin, api, tokens, kdf = KDF }) {
  const { accountShare } = await api.fetchAccountShare(tokens.accessToken)
  const wrappedA = JSON.parse(accountShare)
  let shareA
  try {
    shareA = await unwrapShare(wrappedA, password, kdf)
  } catch {
    throw new Error('That password does not open this wallet.')
  }
  const { nuvraShare } = await api.releaseNuvraShare(tokens.accessToken)
  const entropy = combineShares([shareA, dec(nuvraShare)])

  const [newA, newB, newC] = splitSecret(entropy)
  const byPassword = await wrapShare(newA, password, kdf)
  const byPin = await wrapShare(newA, pin, kdf)
  const rotated = await api.rotateShares(tokens.accessToken, {
    accountShare: serverBlob(byPassword),
    nuvraShare: enc(newB),
  })
  await writeRecord({
    version: 2, email, kdf, byPassword, byPin,
    deviceShare: enc(newC), shareVersion: rotated.shareVersion,
  })
  const session = sessionFromEntropy(entropy)
  return { addresses: session.addresses, shareVersion: rotated.shareVersion }
}

// ── Settings: view the seed phrase ────────────────────────────────
// Requires the password at that moment, per the plan. Rebuilds the
// phrase from the account share and the device share.
export async function revealMnemonic({ password }) {
  const record = await readRecord()
  if (!record) throw new Error('No wallet exists on this device.')
  let shareA
  try {
    shareA = await unwrapShare(record.byPassword, password, record.kdf)
  } catch {
    throw new Error('That password is not correct.')
  }
  const entropy = combineShares([shareA, dec(record.deviceShare)])
  return entropyToMnemonic(entropy, wordlist)
}
