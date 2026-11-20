// ═══════════════════════════════════════════════════════════════════
//   NUVRA WALLET — LOCAL VAULT (the real wallet core, step 1)
//
//   The seed phrase is generated on device and NEVER leaves it.
//   It is stored only as an AES-256-GCM ciphertext in
//   chrome.storage.local, encrypted under keys derived with
//   Argon2id from the user's password and from the PIN (two
//   independent wrappings of the same seed, so either credential
//   can unlock). Signing keys are derived in memory at unlock and
//   held only for the session; the session auto-locks.
//
//   A lost seed phrase with no backup means lost funds. There is
//   no server, no recovery and no copy anywhere else — by design.
// ═══════════════════════════════════════════════════════════════════

import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { HDKey } from '@scure/bip32'
import { p2tr } from '@scure/btc-signer'
import { base58 } from '@scure/base'
import { NETWORK, TEST_NETWORK } from '@scure/btc-signer'
import { base64 } from '@scure/base'
import { argon2id } from 'hash-wasm'
import { privateKeyToAccount } from 'viem/accounts'

const VAULT_KEY = 'nuvra:vault:v1'
const AUTO_LOCK_MS = 5 * 60 * 1000 // session auto-lock after 5 minutes

// Argon2id parameters for credential keys (stored in the blob, so
// they can be raised later without breaking existing vaults).
const KDF = { memoryKiB: 65536, iterations: 3, parallelism: 1, hashLength: 32 }

// ── Storage adapter: chrome.storage.local in the extension,
//    localStorage in a plain browser, memory in tests. ────────────
const memStore = new Map()
const storage = {
  async get(key) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const out = await chrome.storage.local.get(key)
      return out?.[key] ?? null
    }
    try {
      const v = window.localStorage.getItem(key)
      return v ? JSON.parse(v) : null
    } catch { return memStore.get(key) ?? null }
  },
  async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [key]: value })
      return
    }
    try { window.localStorage.setItem(key, JSON.stringify(value)) }
    catch { memStore.set(key, value) }
  },
  async remove(key) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.remove(key)
      return
    }
    try { window.localStorage.removeItem(key) } catch { memStore.delete(key) }
  },
}

// ── Small helpers ────────────────────────────────────────────────
const enc = (bytes) => base64.encode(bytes)
const dec = (str) => base64.decode(str)
const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n))

function fail(code, message) {
  const e = new Error(message)
  e.code = code
  return e
}

async function deriveCredentialKey(secret, salt, kdf) {
  return argon2id({
    password: secret,
    salt,
    parallelism: kdf.parallelism,
    iterations: kdf.iterations,
    memorySize: kdf.memoryKiB,
    hashLength: kdf.hashLength,
    outputType: 'binary',
  })
}

async function aesEncrypt(keyBytes, plaintext) {
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const iv = randomBytes(12)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return { iv: enc(iv), ct: enc(new Uint8Array(ct)) }
}

async function aesDecrypt(keyBytes, blob) {
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt'])
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: dec(blob.iv) }, key, dec(blob.ct))
  return new Uint8Array(pt)
}

// ── Address derivation (BIP-86 taproot + BIP-44 EVM) ─────────────
export function deriveAddresses(seedBytes) {
  const root = HDKey.fromMasterSeed(seedBytes)

  const evmChild = root.derive("m/44'/60'/0'/0/0")
  const evmHex = '0x' + [...evmChild.privateKey].map((b) => b.toString(16).padStart(2, '0')).join('')
  const evmAddress = privateKeyToAccount(evmHex).address

  const btcChild = root.derive("m/86'/0'/0'/0/0")
  const btcAddress = p2tr(btcChild.publicKey.slice(1), undefined, NETWORK).address

  const btcTestChild = root.derive("m/86'/1'/0'/0/0")
  const btcTestAddress = p2tr(btcTestChild.publicKey.slice(1), undefined, TEST_NETWORK).address

  return {
    bitcoin: btcAddress,
    bob: evmAddress,
    'bob-sepolia': evmAddress,
    btcTestnet: btcTestAddress,
    // Arch has no published derivation in this build; the registry
    // Arch testnet: an Arch account IS a secp256k1 x-only pubkey
    // (the Arch SDK builds keypairs exactly this way), shown to
    // users base58-encoded. It is the same key as the Bitcoin
    // testnet child above, so one key controls both.
    'arch-testnet': base58.encode(btcTestChild.publicKey.slice(1)),
    arch: null,
  }
}

// ── Session (memory only — gone when the popup closes) ───────────
let session = null
let lockTimer = null
const lockListeners = new Set()

export function onVaultLock(fn) {
  lockListeners.add(fn)
  return () => lockListeners.delete(fn)
}

function notifySessionChanged() {
  try { window.dispatchEvent(new Event('nuvra:session-changed')) } catch { /* node/tests */ }
}

function armAutoLock() {
  clearTimeout(lockTimer)
  lockTimer = setTimeout(() => lockVault(), AUTO_LOCK_MS)
  // In Node (tests) the timer must not hold the process open.
  if (lockTimer && typeof lockTimer.unref === 'function') lockTimer.unref()
}

function startSession(seedBytes, mnemonic) {
  const addresses = deriveAddresses(seedBytes)
  session = { seedBytes, mnemonic, addresses, unlockedAt: Date.now() }
  armAutoLock()
  notifySessionChanged()
  return session
}

export function getSession() { return session }
export function isUnlocked() { return session !== null }

export function lockVault() {
  const had = session !== null
  if (session) {
    session.seedBytes.fill(0)
    session = null
  }
  if (had) notifySessionChanged()
  clearTimeout(lockTimer)
  lockListeners.forEach((fn) => { try { fn() } catch { /* listener error */ } })
}

// Touch = activity: push the auto-lock deadline out.
export function touchSession() {
  if (!session) return
  armAutoLock()
}

// ── Vault lifecycle ──────────────────────────────────────────────
export async function vaultExists() {
  return (await storage.get(VAULT_KEY)) !== null
}

async function buildBlob({ email, password, pin, mnemonic, kdf }) {
  const seedBytes = mnemonicToSeedSync(mnemonic)
  const saltPassword = randomBytes(16)
  const saltPin = randomBytes(16)
  const saltVerifier = randomBytes(16)
  const pwKey = await deriveCredentialKey(password, saltPassword, kdf)
  const pinKey = await deriveCredentialKey(pin, saltPin, kdf)
  const verifier = await deriveCredentialKey(password, saltVerifier, kdf)
  const blob = {
    version: 1,
    email,
    createdAt: Date.now(),
    kdf,
    saltPassword: enc(saltPassword),
    saltPin: enc(saltPin),
    saltVerifier: enc(saltVerifier),
    pwVerifier: enc(verifier),
    seedByPassword: await aesEncrypt(pwKey, seedBytes),
    seedByPin: await aesEncrypt(pinKey, seedBytes),
  }
  return { blob, seedBytes }
}

export async function createVault({ email, password, pin, kdf = KDF }) {
  const mnemonic = generateMnemonic(wordlist, 128) // 12 words
  const { blob, seedBytes } = await buildBlob({ email, password, pin, mnemonic, kdf })
  await storage.set(VAULT_KEY, blob)
  const s = startSession(seedBytes, mnemonic)
  return { mnemonic, addresses: s.addresses }
}

export async function importVault({ email, password, pin, mnemonic, kdf = KDF }) {
  const clean = String(mnemonic || '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!validateMnemonic(clean, wordlist)) {
    throw fail('BAD_MNEMONIC', 'That seed phrase is not a valid BIP-39 phrase.')
  }
  const { blob, seedBytes } = await buildBlob({ email, password, pin, mnemonic: clean, kdf })
  await storage.set(VAULT_KEY, blob)
  const s = startSession(seedBytes, clean)
  return { mnemonic: clean, addresses: s.addresses }
}

// Login screen check: email must match the vault, and the password
// must match the stored verifier. Does not unlock the seed — the
// PIN step after login does that (the design's flow).
export async function verifyLogin(email, password) {
  const blob = await storage.get(VAULT_KEY)
  if (!blob) throw fail('NO_VAULT', 'No wallet exists on this device yet.')
  if (String(email || '').trim().toLowerCase() !== String(blob.email || '').toLowerCase()) {
    throw fail('EMAIL_MISMATCH', 'That email does not match this wallet.')
  }
  const check = await deriveCredentialKey(password, dec(blob.saltVerifier), blob.kdf)
  const stored = dec(blob.pwVerifier)
  let diff = check.length ^ stored.length
  for (let i = 0; i < Math.min(check.length, stored.length); i++) diff |= check[i] ^ stored[i]
  if (diff !== 0) throw fail('BAD_PASSWORD', 'That password is not correct.')
  return true
}

// PIN check for transaction confirmation: tries the PIN wrapping
// without touching the live session. True only if the PIN decrypts
// the seed.
export async function verifyPin(pin) {
  const blob = await storage.get(VAULT_KEY)
  if (!blob) return false
  try {
    const pinKey = await deriveCredentialKey(pin, dec(blob.saltPin), blob.kdf)
    await aesDecrypt(pinKey, blob.seedByPin)
    return true
  } catch {
    return false
  }
}

export async function unlockWithPin(pin) {
  const blob = await storage.get(VAULT_KEY)
  if (!blob) throw fail('NO_VAULT', 'No wallet exists on this device yet.')
  const pinKey = await deriveCredentialKey(pin, dec(blob.saltPin), blob.kdf)
  let seedBytes
  try {
    seedBytes = await aesDecrypt(pinKey, blob.seedByPin)
  } catch {
    throw fail('BAD_PIN', 'That PIN is not correct.')
  }
  // The mnemonic itself is not stored; it is recoverable from the
  // seed only via the wordlist — keep the seed as the session truth
  // and re-derive the phrase for the backup screen when needed.
  const s = startSession(seedBytes, null)
  return { addresses: s.addresses }
}

export async function unlockWithPassword(password) {
  const blob = await storage.get(VAULT_KEY)
  if (!blob) throw fail('NO_VAULT', 'No wallet exists on this device yet.')
  const pwKey = await deriveCredentialKey(password, dec(blob.saltPassword), blob.kdf)
  let seedBytes
  try {
    seedBytes = await aesDecrypt(pwKey, blob.seedByPassword)
  } catch {
    throw fail('BAD_PASSWORD', 'That password is not correct.')
  }
  const s = startSession(seedBytes, null)
  return { addresses: s.addresses }
}

// Recover the phrase from a live session's seed (backup screen).
// BIP-39 seed bytes are one-way from the phrase, so the phrase is
// only available in the session that created/imported the vault.
export function getSessionMnemonic() {
  return session?.mnemonic ?? null
}

export async function resetVault() {
  lockVault()
  await storage.remove(VAULT_KEY)
}
