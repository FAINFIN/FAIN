/**
 * AES-256-GCM encryption for Fain chat messages stored in Postgres.
 *
 * Key:  32-byte hex string from FAIN_ENCRYPTION_KEY env var.
 * IV:   12-byte random nonce per message (GCM best-practice).
 * Tag:  16-byte GCM auth tag appended to ciphertext before base64 encoding.
 *
 * Wire format stored in DB:
 *   content_enc = base64( ciphertext || tag )   (tag is last 16 bytes)
 *   iv          = base64( 12-byte nonce )
 *
 * This file must only be imported in server-side code (API routes, server actions).
 * It relies on Node.js `node:crypto` which is never bundled for the browser.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const TAG_LENGTH = 16 // GCM auth tag bytes

function getKey(): Buffer {
  const hex = process.env.FAIN_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error(
      '[encrypt] FAIN_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  return Buffer.from(hex, 'hex')
}

/** Encrypt a UTF-8 plaintext string. Returns base64-encoded ciphertext+tag and nonce. */
export function encrypt(plaintext: string): { enc: string; iv: string } {
  const key = getKey()
  const iv  = randomBytes(12) // 96-bit nonce — GCM standard

  const cipher    = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag       = cipher.getAuthTag() // 16 bytes

  return {
    enc: Buffer.concat([encrypted, tag]).toString('base64'),
    iv:  iv.toString('base64'),
  }
}

/** Decrypt a ciphertext+tag (base64) with the given nonce (base64). Returns UTF-8 plaintext. */
export function decrypt(enc: string, iv: string): string {
  const key    = getKey()
  const buf    = Buffer.from(enc, 'base64')
  const ivBuf  = Buffer.from(iv, 'base64')

  // Split ciphertext and auth tag
  const tag        = buf.subarray(buf.length - TAG_LENGTH)
  const ciphertext = buf.subarray(0, buf.length - TAG_LENGTH)

  const decipher = createDecipheriv('aes-256-gcm', key, ivBuf)
  decipher.setAuthTag(tag)

  return decipher.update(ciphertext).toString('utf8') + decipher.final('utf8')
}
