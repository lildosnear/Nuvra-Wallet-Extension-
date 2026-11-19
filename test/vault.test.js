import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createVault, importVault, unlockWithPin, unlockWithPassword,
  verifyLogin, vaultExists, lockVault, isUnlocked, resetVault,
} from '../src/wallet/vault.js'

// Fast KDF for tests only — production vaults store their own
// parameters in the blob and unlock with those.
const FAST = { memoryKiB: 1024, iterations: 1, parallelism: 1, hashLength: 32 }
const CREDS = { email: 'desmond@example.com', password: 'correct horse 9', pin: '1234', kdf: FAST }

test('create: 12-word phrase, real address formats, session open', async () => {
  await resetVault()
  assert.equal(await vaultExists(), false)
  const { mnemonic, addresses } = await createVault(CREDS)
  assert.equal(mnemonic.trim().split(/\s+/).length, 12)
  assert.match(addresses.bitcoin, /^bc1p[0-9a-z]{38,}$/)
  assert.match(addresses.bob, /^0x[0-9a-fA-F]{40}$/)
  assert.equal(addresses['bob-sepolia'], addresses.bob)
  assert.match(addresses.btcTestnet, /^tb1p[0-9a-z]{38,}$/)
  assert.equal(await vaultExists(), true)
  assert.equal(isUnlocked(), true)
})

test('pin unlock: wrong PIN rejected, right PIN returns same addresses', async () => {
  const { addresses } = await createVault(CREDS)
  lockVault()
  assert.equal(isUnlocked(), false)
  await assert.rejects(() => unlockWithPin('9999'), (e) => e.code === 'BAD_PIN')
  const back = await unlockWithPin(CREDS.pin)
  assert.deepEqual(back.addresses, addresses)
})

test('password unlock: wrong password rejected, right one matches', async () => {
  const { addresses } = await createVault(CREDS)
  lockVault()
  await assert.rejects(() => unlockWithPassword('wrong password'), (e) => e.code === 'BAD_PASSWORD')
  const back = await unlockWithPassword(CREDS.password)
  assert.deepEqual(back.addresses, addresses)
})

test('verifyLogin checks email then password, without unlocking', async () => {
  await createVault(CREDS)
  lockVault()
  await assert.rejects(() => verifyLogin('other@example.com', CREDS.password), (e) => e.code === 'EMAIL_MISMATCH')
  await assert.rejects(() => verifyLogin(CREDS.email, 'nope nope nope'), (e) => e.code === 'BAD_PASSWORD')
  assert.equal(await verifyLogin(CREDS.email, CREDS.password), true)
  assert.equal(isUnlocked(), false)
})

test('import: known phrase derives the known Ethereum address', async () => {
  await resetVault()
  const known = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  const { addresses } = await importVault({ ...CREDS, mnemonic: known })
  assert.equal(addresses.bob, '0x9858EfFD232B4033E47d90003D41EC34EcaEda94')
  assert.match(addresses.bitcoin, /^bc1p[0-9a-z]{38,}$/)
  // Deterministic: a second import of the same phrase, same wallet.
  const again = await importVault({ ...CREDS, mnemonic: known })
  assert.deepEqual(again.addresses, addresses)
})

test('import: invalid phrase rejected', async () => {
  await assert.rejects(
    () => importVault({ ...CREDS, mnemonic: 'not a real seed phrase at all not even close words here' }),
    (e) => e.code === 'BAD_MNEMONIC',
  )
})
