// ═══════════════════════════════════════════════════════════════════
//   Shamir secret sharing, two of three, over GF(256).
//
//   Splits the wallet's seed entropy into three shares. Any two
//   shares rebuild the entropy exactly; one share alone gives no
//   information about it, because each byte is hidden behind a
//   random first degree polynomial whose constant term is the
//   secret byte. Field arithmetic uses the AES field polynomial
//   (x^8 + x^4 + x^3 + x + 1) with generator 3, computed through
//   log and exp tables.
//
//   Share format: a Uint8Array of secret length + 1. The first
//   byte is the share id (1, 2 or 3, the x coordinate); the rest
//   are the polynomial evaluations for each secret byte.
// ═══════════════════════════════════════════════════════════════════

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    // Multiply by the generator 3: x*2 (xtime) XOR x.
    let x2 = x << 1
    if (x2 & 0x100) x2 ^= 0x11b
    x = (x2 ^ x) & 0xff
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}

function mul(a, b) {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a] + LOG[b]]
}

function div(a, b) {
  if (a === 0) return 0
  if (b === 0) throw new Error('Shamir: division by zero')
  return EXP[LOG[a] - LOG[b] + 255]
}

function evalPoly(coeffs, x) {
  let y = 0
  for (let i = coeffs.length - 1; i >= 0; i--) y = mul(y, x) ^ coeffs[i]
  return y
}

function randomBytes(n) {
  const out = new Uint8Array(n)
  crypto.getRandomValues(out)
  return out
}

// splitSecret(secret, { threshold = 2, shareCount = 3, rng })
// rng is injectable for tests; production uses WebCrypto.
export function splitSecret(secret, { threshold = 2, shareCount = 3, rng = randomBytes } = {}) {
  if (!(secret instanceof Uint8Array) || secret.length === 0) throw new Error('Shamir: the secret must be non-empty bytes')
  if (threshold < 2 || threshold > shareCount) throw new Error('Shamir: bad threshold')
  const shares = Array.from({ length: shareCount }, (_, i) => {
    const share = new Uint8Array(secret.length + 1)
    share[0] = i + 1
    return share
  })
  for (let byteIdx = 0; byteIdx < secret.length; byteIdx++) {
    const coeffs = new Uint8Array(threshold)
    coeffs[0] = secret[byteIdx]
    coeffs.set(rng(threshold - 1), 1)
    for (let s = 0; s < shareCount; s++) {
      shares[s][byteIdx + 1] = evalPoly(coeffs, s + 1)
    }
  }
  return shares
}

// combineShares(shares, threshold = 2): Lagrange interpolation at
// x = 0. Extra shares beyond the threshold are fine; duplicate or
// malformed shares throw.
export function combineShares(shares, threshold = 2) {
  if (!Array.isArray(shares) || shares.length < threshold) {
    throw new Error(`Shamir: at least ${threshold} shares are required`)
  }
  const len = shares[0].length
  if (len < 2) throw new Error('Shamir: malformed share')
  const ids = new Set()
  for (const share of shares) {
    if (!(share instanceof Uint8Array) || share.length !== len) throw new Error('Shamir: malformed share')
    if (share[0] === 0 || ids.has(share[0])) throw new Error('Shamir: duplicate or invalid share id')
    ids.add(share[0])
  }
  const used = shares.slice(0, threshold)
  const secret = new Uint8Array(len - 1)
  for (let byteIdx = 1; byteIdx < len; byteIdx++) {
    let y0 = 0
    for (let i = 0; i < used.length; i++) {
      const xi = used[i][0]
      let num = 1
      let den = 1
      for (let j = 0; j < used.length; j++) {
        if (j === i) continue
        const xj = used[j][0]
        num = mul(num, xj) // (0 - xj) is xj in GF(2^n)
        den = mul(den, xi ^ xj) // (xi - xj) is xi XOR xj
      }
      y0 ^= mul(used[i][byteIdx], div(num, den))
    }
    secret[byteIdx - 1] = y0
  }
  return secret
}
