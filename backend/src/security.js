// Password hashing, one time codes and session tokens.
// Server side password hashing uses Argon2id (hash-wasm), the same
// KDF family the client vault uses, but with its own salt and
// purpose: this hash authenticates logins only. It is never used
// to derive any key that touches a wallet share.
import { argon2id } from 'hash-wasm'
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'

const b64 = (bytes) => Buffer.from(bytes).toString('base64')
const sha256 = (text) => createHash('sha256').update(text).digest('hex')

export async function hashPassword(password) {
  const salt = new Uint8Array(randomBytes(16))
  const hash = await argon2id({
    password: String(password), salt, parallelism: 1,
    iterations: 3, memorySize: 65536, hashLength: 32, outputType: 'binary',
  })
  return { salt: b64(salt), hash: b64(hash) }
}

export async function verifyPassword(password, stored) {
  const salt = new Uint8Array(Buffer.from(stored.salt, 'base64'))
  const hash = await argon2id({
    password: String(password), salt, parallelism: 1,
    iterations: 3, memorySize: 65536, hashLength: 32, outputType: 'binary',
  })
  const expected = Buffer.from(stored.hash, 'base64')
  const actual = Buffer.from(hash)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function newCode() {
  return String(randomBytes(4).readUInt32BE(0) % 1000000).padStart(6, '0')
}

export const hashCode = (userId, code) => sha256(`${userId}:${code}`)

export function newToken() {
  return randomBytes(32).toString('base64url')
}

export const hashToken = (token) => sha256(String(token))
