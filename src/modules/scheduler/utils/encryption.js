const crypto = require('crypto');
const config = require('../../../config');

// ===================================
// AES-256-GCM token encryption at rest
// ===================================
// Format on disk (single string):
//   v1:<iv_b64>:<tag_b64>:<ciphertext_b64>
//
//   v1            — version prefix. New versions (v2, v3...) can change
//                   algorithm, key derivation, or AAD without breaking
//                   existing ciphertext. The decrypt path multiplexes on
//                   the prefix.
//   iv_b64        — 12-byte random IV, base64. Required per encryption call.
//   tag_b64       — 16-byte GCM auth tag, base64. Authenticates ciphertext.
//   ciphertext_b64 — base64 ciphertext (UTF-8 plaintext).
//
// KEY RESOLUTION:
//   TOKEN_ENCRYPTION_KEY env value is expected to be a 32-byte key encoded
//   as hex (64 chars) or base64 (44 chars). resolveKey() detects format.
//   Dev fallback: derive a deterministic 32-byte key from JWT_SECRET via
//   HKDF — boot doesn't crash without the env var but the key is NOT secure
//   for prod. config/index.js warns if TOKEN_ENCRYPTION_KEY is missing in
//   production.
//
// KEY ROTATION (future):
//   Add a `v2` branch in encrypt() that uses a new key id. Store the key id
//   alongside the prefix: `v2:<keyId>:<iv>:<tag>:<ciphertext>`. decrypt()
//   reads the key id and looks up the right key from a versioned map.

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

let cachedKey = null;

function resolveKey() {
  if (cachedKey) return cachedKey;
  const raw = config.scheduler && config.scheduler.tokenEncryptionKey;
  if (typeof raw === 'string' && raw.length) {
    let buf;
    if (/^[a-fA-F0-9]{64}$/.test(raw)) {
      buf = Buffer.from(raw, 'hex');
    } else {
      // Try base64; reject if it doesn't yield 32 bytes.
      try {
        buf = Buffer.from(raw, 'base64');
      } catch {
        throw new Error('TOKEN_ENCRYPTION_KEY: unparseable (expect hex-64 or base64-44)');
      }
    }
    if (buf.length !== KEY_BYTES) {
      throw new Error(
        `TOKEN_ENCRYPTION_KEY: expected 32 bytes (got ${buf.length}). Generate via: ` +
          `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
      );
    }
    cachedKey = buf;
    return cachedKey;
  }
  // Dev-only fallback — derive from JWT secret via HKDF. NOT suitable for prod.
  if (config.env === 'production') {
    throw new Error('TOKEN_ENCRYPTION_KEY is required in production');
  }
  const seed = config.jwt.secret || 'dev_seed';
  cachedKey = crypto.hkdfSync('sha256', Buffer.from(seed), Buffer.alloc(0), Buffer.from('mavro-scheduler-token'), KEY_BYTES);
  cachedKey = Buffer.from(cachedKey);
  return cachedKey;
}

function isEncrypted(value) {
  return typeof value === 'string' && /^v\d+:/.test(value);
}

function encrypt(plaintext) {
  if (plaintext == null || plaintext === '') return plaintext;
  if (isEncrypted(plaintext)) return plaintext;
  const key = resolveKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    'v1',
    iv.toString('base64'),
    tag.toString('base64'),
    ct.toString('base64'),
  ].join(':');
}

function decrypt(ciphertext) {
  if (ciphertext == null || ciphertext === '') return ciphertext;
  if (!isEncrypted(ciphertext)) return ciphertext; // legacy plaintext passthrough
  const parts = String(ciphertext).split(':');
  if (parts[0] === 'v1') {
    if (parts.length !== 4) throw new Error('encrypted token: malformed v1 envelope');
    const [, ivB64, tagB64, ctB64] = parts;
    const key = resolveKey();
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      throw new Error('encrypted token: invalid iv/tag length');
    }
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
    return pt.toString('utf8');
  }
  throw new Error(`encrypted token: unknown version ${parts[0]}`);
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
};
