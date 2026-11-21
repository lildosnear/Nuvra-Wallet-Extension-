// Shamir two of three: property tests, plus a cross check against
// an independent GF(256) implementation written differently on
// purpose (peasant multiplication, no log/exp tables), plus the
// wallet integration: split entropy must rebuild the same seed
// and the same addresses as the plain vault.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitSecret, combineShares } from '../src/wallet/shamir.js'
import { mnemonicToSeedSync, entropyToMnemonic } from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import { deriveAddresses } from '../src/wallet/vault.js'

// Independent GF(256) arithmetic (Russian peasant, polynomial 0x11b)
function gmul(a, b) {
  let p = 0
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a
    const hi = a & 0x80
    a = (a << 1) & 0xff
    if (hi) a ^= 0x1b
    b >>= 1
  }
  return p
}
function ginv(a) { // brute force inverse
  for (let i = 1; i < 256; i++) if (gmul(a, i) === 1) return i
  throw new Error('no inverse')
}
// Independent combine: same Lagrange idea, different field code.
function combineIndependent(shares) {
  const len = shares[0].length
  const out = new Uint8Array(len - 1)
  for (let idx = 1; idx < len; idx++) {
    let acc = 0
    for (let i = 0; i < shares.length; i++) {
      let num = 1, den = 1
      for (let j = 0; j < shares.length; j++) {
        if (j === i) continue
        num = gmul(num, shares[j][0])
        den = gmul(den, shares[i][0] ^ shares[j][0])
      }
      acc ^= gmul(shares[i][idx], gmul(num, ginv(den)))
    }
    out[idx - 1] = acc
  }
  return out
}

const secret = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])

test('every pair of shares rebuilds the secret', () => {
  const [a, b, c] = splitSecret(secret)
  for (const pair of [[a, b], [a, c], [b, c]]) {
    assert.deepEqual(combineShares(pair), secret)
  }
  assert.deepEqual(combineShares([a, b, c]), secret) // extra share is fine
})

test('the independent field implementation agrees on random secrets', () => {
  for (let trial = 0; trial < 25; trial++) {
    const s = new Uint8Array(32)
    crypto.getRandomValues(s)
    const shares = splitSecret(s)
    const pair = [shares[trial % 3], shares[(trial + 1) % 3]]
    assert.deepEqual(combineIndependent(pair), s)
    assert.deepEqual(combineShares(pair), s)
  }
})

test('one share alone does not rebuild the secret', () => {
  const shares = splitSecret(secret)
  assert.throws(() => combineShares([shares[0]]), /at least 2/)
  // A single share fed twice is rejected as a duplicate.
  assert.throws(() => combineShares([shares[0], shares[0]]), /duplicate/)
})

test('a tampered share rebuilds the wrong secret, silently different', () => {
  const [a, b] = splitSecret(secret)
  const bad = new Uint8Array(b)
  bad[5] ^= 0xff
  const rebuilt = combineShares([a, bad])
  assert.notDeepEqual(rebuilt, secret)
})

test('a fixed rng gives a hand checkable first byte', () => {
  // rng returns all zeros, so every polynomial is constant and each
  // share byte equals the secret byte: the degenerate case must
  // still round trip.
  const shares = splitSecret(secret, { rng: (n) => new Uint8Array(n) })
  assert.equal(shares[0][1], secret[0])
  assert.deepEqual(combineShares([shares[1], shares[2]]), secret)
})

test('split entropy rebuilds the same mnemonic, seed and addresses', () => {
  const entropy = new Uint8Array(16)
  crypto.getRandomValues(entropy)
  const mnemonic = entropyToMnemonic(entropy, wordlist)
  const directSeed = mnemonicToSeedSync(mnemonic)
  const shares = splitSecret(entropy)
  const rebuiltEntropy = combineShares([shares[2], shares[0]])
  assert.deepEqual(rebuiltEntropy, entropy)
  const rebuiltMnemonic = entropyToMnemonic(rebuiltEntropy, wordlist)
  assert.equal(rebuiltMnemonic, mnemonic)
  assert.deepEqual(mnemonicToSeedSync(rebuiltMnemonic), directSeed)
  assert.deepEqual(deriveAddresses(mnemonicToSeedSync(rebuiltMnemonic)), deriveAddresses(directSeed))
})
