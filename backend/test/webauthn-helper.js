// A minimal software WebAuthn authenticator for tests: a real
// P-256 keypair producing real attestation and assertion objects
// that @simplewebauthn/server verifies cryptographically. Only the
// CBOR encoding is hand rolled, and only the fixed shapes WebAuthn
// needs here.
import { generateKeyPairSync, createHash, sign } from 'node:crypto'

const sha256 = (data) => createHash('sha256').update(data).digest()
const b64url = (buf) => Buffer.from(buf).toString('base64url')

// Tiny CBOR encoder: ints, byte strings, text, arrays, maps.
function cborHead(major, n) {
  const m = major << 5
  if (n < 24) return Buffer.from([m | n])
  if (n < 256) return Buffer.from([m | 24, n])
  if (n < 65536) return Buffer.from([m | 25, n >> 8, n & 0xff])
  const b = Buffer.alloc(5); b[0] = m | 26; b.writeUInt32BE(n, 1); return b
}
export function cborEncode(value) {
  if (typeof value === 'number') {
    if (value >= 0) return cborHead(0, value)
    return cborHead(1, -1 - value)
  }
  if (typeof value === 'string') {
    const utf8 = Buffer.from(value, 'utf8')
    return Buffer.concat([cborHead(3, utf8.length), utf8])
  }
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return Buffer.concat([cborHead(2, value.length), Buffer.from(value)])
  }
  if (Array.isArray(value)) {
    return Buffer.concat([cborHead(4, value.length), ...value.map(cborEncode)])
  }
  if (value instanceof Map) {
    const entries = [...value.entries()]
    return Buffer.concat([cborHead(5, entries.length), ...entries.flatMap(([k, v]) => [cborEncode(k), cborEncode(v)])])
  }
  throw new Error(`cbor: cannot encode ${typeof value}`)
}

export function createAuthenticator(rpID = 'localhost') {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const jwk = publicKey.export({ format: 'jwk' })
  const credentialId = Buffer.from(b64url(sha256(Buffer.from(jwk.x, 'base64url'))).slice(0, 32), 'utf8')
  let counter = 0
  const rpIdHash = sha256(Buffer.from(rpID, 'utf8'))

  const coseKey = cborEncode(new Map([
    [1, 2], [3, -7], [-1, 1],
    [-2, Buffer.from(jwk.x, 'base64url')],
    [-3, Buffer.from(jwk.y, 'base64url')],
  ]))

  function clientData(type, challenge, origin) {
    return Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }), 'utf8')
  }

  return {
    credentialId: b64url(credentialId),
    registrationResponse(options, origin) {
      const cdj = clientData('webauthn.create', options.challenge, origin)
      const credLen = Buffer.alloc(2); credLen.writeUInt16BE(credentialId.length)
      const authData = Buffer.concat([
        rpIdHash, Buffer.from([0x45]), Buffer.alloc(4), Buffer.alloc(16), credLen, credentialId, coseKey,
      ])
      const attestationObject = cborEncode(new Map([
        ['fmt', 'none'], ['attStmt', new Map()], ['authData', authData],
      ]))
      return {
        id: b64url(credentialId), rawId: b64url(credentialId), type: 'public-key',
        response: { clientDataJSON: b64url(cdj), attestationObject: b64url(attestationObject) },
      }
    },
    authenticationResponse(options, origin) {
      counter += 1
      const cdj = clientData('webauthn.get', options.challenge, origin)
      const counterBuf = Buffer.alloc(4); counterBuf.writeUInt32BE(counter)
      const authData = Buffer.concat([rpIdHash, Buffer.from([0x05]), counterBuf])
      const signature = sign('sha256', Buffer.concat([authData, sha256(cdj)]), { key: privateKey, dsaEncoding: 'der' })
      return {
        id: b64url(credentialId), rawId: b64url(credentialId), type: 'public-key',
        response: {
          clientDataJSON: b64url(cdj), authenticatorData: b64url(authData),
          signature: b64url(signature), userHandle: null,
        },
      }
    },
  }
}
