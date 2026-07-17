/**
 * Centralized environment config
 * All env vars consumed through this module
 *
 * In production, the CORS_ORIGIN supports comma-separated values
 * to allow multiple product website domains.
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/mavro_admin',
    options: {
      autoIndex: process.env.NODE_ENV !== 'production', // Disable in prod for performance
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_not_for_production',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',
  },

  cors: {
    // Support comma-separated origins for multi-website
    origins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },

  admin: {
    name: process.env.ADMIN_NAME || 'Super Admin',
    email: process.env.ADMIN_EMAIL || 'admin@mavro.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 15 * 60 * 1000,
    // Global /api/* cap per IP per window. 100 was too low for the admin:
    // the Analytics page polls realtime every 15s (~60 hits/15min from a single
    // open tab) and the SEO/Analytics pages fire 15-25 calls per load, so a
    // legitimate admin session exhausted the bucket and 429'd itself off the
    // whole API. Raised to 600. Override with RATE_LIMIT_MAX if needed.
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 600,
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 20,
  },

  cache: {
    sitemapTTL: parseInt(process.env.SITEMAP_CACHE_TTL, 10) || 3600, // seconds
  },

  ai: {
    // Provider routing — backend-only. Never expose API keys to the client.
    defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'gemini',
    defaultModel: process.env.AI_DEFAULT_MODEL || 'gemini-2.5-flash',
    requestTimeoutMs: parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10) || 30000,
    maxRetries: parseInt(process.env.AI_MAX_RETRIES, 10) || 2,
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS, 10) || 2048,
    providers: {
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || null,
        defaultModel: process.env.AI_GEMINI_MODEL || process.env.AI_DEFAULT_MODEL || 'gemini-2.5-flash-lite',
      },
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY || null,
        baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        referer: process.env.OPENROUTER_REFERER || 'https://mavro.com',
        appTitle: process.env.OPENROUTER_APP_TITLE || 'Mavro Console',
        // Default model used only when caller specifies no feature / model.
        defaultModel: process.env.AI_OPENROUTER_MODEL || 'openai/gpt-oss-120b:free',
      },
      // Reserved provider slots — wire when needed:
      // openai:    { apiKey: process.env.OPENAI_API_KEY,    defaultModel: ... },
      // anthropic: { apiKey: process.env.ANTHROPIC_API_KEY, defaultModel: ... },
      // groq:      { apiKey: process.env.GROQ_API_KEY,      defaultModel: ... },
    },
    // Provider fallback chain — tried in order if primary fails. Cost-aware
    // routing can be layered on top of this list at the orchestrator level.
    fallbackChain: (process.env.AI_FALLBACK_CHAIN || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
  },

  email: {
    host: process.env.EMAIL_HOST || null,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || null,
    pass: process.env.EMAIL_PASS || null,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || null,
    fromName: process.env.EMAIL_FROM_NAME || 'Mavro',
  },
};

// Runtime validation for production
if (config.env === 'production') {
  const required = ['MONGO_URI', 'JWT_SECRET', 'CORS_ORIGIN'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing required env vars for production: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (config.jwt.secret === 'fallback_secret_not_for_production') {
    console.error('❌ JWT_SECRET must be changed for production');
    process.exit(1);
  }
}

module.exports = config;
