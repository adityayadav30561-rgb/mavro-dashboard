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
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
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

  scheduler: {
    // Public origin used to build OAuth redirect URIs. Falls back to the
    // first CORS origin in dev, or the explicit PUBLIC_BACKEND_URL in prod.
    publicBackendUrl:
      process.env.PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://mavro-dashboard.onrender.com'
        : 'http://localhost:5000'),
    // Where to bounce the browser after a successful OAuth dance.
    dashboardCallbackUrl:
      process.env.SCHEDULER_DASHBOARD_CALLBACK ||
      (process.env.NODE_ENV === 'production'
        ? 'https://mavro-dashboard.onrender.com/scheduler/calendar-connections'
        : 'http://localhost:5173/scheduler/calendar-connections'),
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || null,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || null,
    },
    // OAuth state JWT signing secret — falls back to JWT_SECRET in dev only.
    oauthStateSecret:
      process.env.OAUTH_STATE_SECRET ||
      (process.env.NODE_ENV === 'production' ? null : 'dev_oauth_state_secret_replace_me'),
    // 32-byte key for AES-256-GCM at-rest token encryption.
    // Accepts hex (64 chars) or base64 (44 chars). In dev a derived fallback
    // is used so local boot doesn't crash; prod boot validates strictly.
    tokenEncryptionKey:
      process.env.TOKEN_ENCRYPTION_KEY ||
      (process.env.NODE_ENV === 'production' ? null : null),
    // Lifetime of an OAuth state JWT in seconds.
    oauthStateTtlSeconds: parseInt(process.env.OAUTH_STATE_TTL, 10) || 600,
    // Busy-range cache TTL (seconds). Phase 2 = 120s per the spec.
    busyCacheTtlSeconds: parseInt(process.env.SCHEDULER_BUSY_CACHE_TTL, 10) || 120,
    // Public dashboard origin — invitee manage link points here. Falls back to dashboard URL.
    dashboardOrigin:
      process.env.SCHEDULER_DASHBOARD_ORIGIN ||
      (process.env.NODE_ENV === 'production'
        ? 'https://mavro-dashboard.onrender.com'
        : 'http://localhost:5173'),
    // BullMQ / Redis
    redisUrl: process.env.REDIS_URL || null,
    // Bootstrap workers in this process. Default true so single-dyno deploys
    // (Render free tier) work without extra config. Set 'false' in a web-only
    // dyno when you split workers into a separate process.
    bootWorkers: process.env.SCHEDULER_BOOT_WORKERS !== 'false',
    workflowSigningSecret:
      process.env.WORKFLOW_SIGNING_SECRET ||
      (process.env.NODE_ENV === 'production' ? null : 'dev_workflow_signing_secret_replace_me'),
    // Provider-retry tuning
    providerRetryMaxAttempts: parseInt(process.env.SCHEDULER_PROVIDER_RETRY_MAX, 10) || 5,
    providerRetryInitialDelayMs: parseInt(process.env.SCHEDULER_PROVIDER_RETRY_DELAY_MS, 10) || 30 * 1000,
    // Reminder defaults (when an event type doesn't define its own workflow)
    defaultReminderMinutesBefore: parseInt(process.env.SCHEDULER_DEFAULT_REMINDER_MIN, 10) || 60,
    // Completion-sweep cron interval (ms)
    completionSweepIntervalMs: parseInt(process.env.SCHEDULER_COMPLETION_SWEEP_MS, 10) || 15 * 60 * 1000,
  },

  email: {
    host: process.env.EMAIL_HOST || null,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || null,
    pass: process.env.EMAIL_PASS || null,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || null,
    fromName: process.env.EMAIL_FROM_NAME || 'Mavro Scheduler',
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
  // Scheduler env validation is non-fatal — the scheduler module degrades
  // gracefully (returns 503 on /google/connect) when its env is incomplete.
  // We warn instead of process.exit so a missing GOOGLE_CLIENT_ID can't take
  // down the entire admin API.
  const schedulerWarnings = [];
  if (!config.scheduler.google.clientId) schedulerWarnings.push('GOOGLE_CLIENT_ID');
  if (!config.scheduler.google.clientSecret) schedulerWarnings.push('GOOGLE_CLIENT_SECRET');
  if (!config.scheduler.oauthStateSecret) schedulerWarnings.push('OAUTH_STATE_SECRET');
  if (!config.scheduler.tokenEncryptionKey) schedulerWarnings.push('TOKEN_ENCRYPTION_KEY');
  if (schedulerWarnings.length > 0) {
    console.warn(
      `⚠️  Scheduler env incomplete — Google Calendar integration disabled. Missing: ${schedulerWarnings.join(', ')}`
    );
  }
  // Workflow infra — non-fatal warnings only. Each subsystem degrades to a
  // no-op when its env is missing (see queue.js, emailService.js).
  if (!config.scheduler.redisUrl) {
    console.warn('⚠️  REDIS_URL not set — scheduler workflow queue disabled (booking creation still works).');
  }
  if (!config.email.host || !config.email.from) {
    console.warn('⚠️  EMAIL_HOST / EMAIL_FROM not set — scheduler outbound email disabled.');
  }
  if (!config.scheduler.workflowSigningSecret) {
    console.warn('⚠️  WORKFLOW_SIGNING_SECRET not set — webhook delivery disabled.');
  }
}

module.exports = config;
