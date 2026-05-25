const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../../../config');

// ===================================
// OAuth state signing / verification
// ===================================
// The OAuth `state` param protects against CSRF + replay.
//
// We pack state as a short-lived JWT signed with OAUTH_STATE_SECRET:
//   payload: { userId, tenantId, provider, nonce, iat, exp }
//
// The nonce gives every state value a unique value even when the same user
// kicks off connect twice within one second — defeats any cached-state replay.
//
// Verification rejects expired tokens via the JWT exp claim (TTL controlled
// by config.scheduler.oauthStateTtlSeconds).
//
// SECRET RESOLUTION:
//   - In prod: OAUTH_STATE_SECRET is required; config warns at boot if absent.
//   - In dev: falls back to a dev-only string so local OAuth dance works.

function getSecret() {
  const secret = config.scheduler && config.scheduler.oauthStateSecret;
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET is required for OAuth state signing');
  }
  return secret;
}

function signOAuthState({ userId, tenantId, provider }) {
  if (!userId || !tenantId || !provider) {
    throw new Error('signOAuthState: userId, tenantId, provider required');
  }
  const payload = {
    userId: String(userId),
    tenantId: String(tenantId),
    provider,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const ttl = (config.scheduler && config.scheduler.oauthStateTtlSeconds) || 600;
  return jwt.sign(payload, getSecret(), { expiresIn: ttl });
}

function verifyOAuthState(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('OAuth state missing');
  }
  let decoded;
  try {
    decoded = jwt.verify(token, getSecret());
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('OAuth state expired — please retry the connect flow');
    }
    throw new Error('OAuth state invalid — possible CSRF attempt');
  }
  if (!decoded.userId || !decoded.tenantId || !decoded.provider) {
    throw new Error('OAuth state payload incomplete');
  }
  return decoded;
}

module.exports = {
  signOAuthState,
  verifyOAuthState,
};
