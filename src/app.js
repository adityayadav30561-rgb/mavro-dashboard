const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config');
const { errorHandler } = require('./middleware');
const {
  authRoutes,
  websiteRoutes,
  blogRoutes,
  leadRoutes,
  sitemapRoutes,
  seoRoutes,
  analyticsRoutes,
  campaignRoutes,
  aiRoutes,
  mbrRoutes,
} = require('./routes');
const { routes: schedulerRoutes } = require('./modules/scheduler');

const app = express();

// Trust proxy (required for correct IP behind Nginx/Cloudflare/load balancers)
app.set('trust proxy', 1);

// ===================================
// Performance: Gzip/Brotli Compression
// ===================================
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

// ===================================
// Security Middleware
// ===================================
app.use(helmet({
  contentSecurityPolicy: config.env === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS — supports multiple product domains
//
// Static baseline of product origins that must always be allowed, merged with
// the env-driven CORS_ORIGIN list. Baseline keeps the Spanbix Next.js site
// (spanbix-web on Vercel + the spanbix.com custom domain) reachable even if
// Render's CORS_ORIGIN env var has not yet been updated. The regex matches the
// spanbix-web project's production + preview deploys (e.g. spanbix-web.vercel.app
// and spanbix-web-<hash>-<scope>.vercel.app) without opening up all of *.vercel.app.
const CORS_BASELINE_ORIGINS = [
  'https://spanbix.com',
  'https://www.spanbix.com',
  'https://spanbix-web.vercel.app',
];
const SPANBIX_WEB_VERCEL_RE = /^https:\/\/spanbix-web[a-z0-9-]*\.vercel\.app$/;

const isAllowedOrigin = (origin) =>
  config.cors.origins.includes(origin) ||
  CORS_BASELINE_ORIGINS.includes(origin) ||
  SPANBIX_WEB_VERCEL_RE.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin "${origin}" not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Cache preflight for 24 hours
  })
);

// ===================================
// Rate Limiting
// ===================================
const isProd = config.env === 'production';

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting entirely in non-production environments
    if (!isProd) return true;
    // Skip rate limiting for health checks and the analytics ingestion endpoint
    // (analytics has its own dedicated stricter limiter to avoid flooding the
    // global bucket and locking out legitimate API calls like lead submission).
    if (req.path === '/api/health') return true;
    if (req.path === '/api/analytics/track') return true;
    return false;
  },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd,
});
app.use('/api/auth/login', authLimiter);

// AI endpoints — dedicated stricter limiter to protect provider quota.
// Cheap by default (20/min/IP). Tune via env if a UX feature needs more.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 20,
  message: { success: false, message: 'AI rate limit reached, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd,
});
app.use('/api/ai', aiLimiter);

// ===================================
// Body Parsing
// ===================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===================================
// Logging
// ===================================
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  // Production: combined format (Apache-style) with response time
  app.use(morgan('combined'));
}

// ===================================
// Health Check (no auth, no rate limit)
// ===================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mavro Admin API is running',
    environment: config.env,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    },
  });
});

// ===================================
// API Routes
// ===================================
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mbr', mbrRoutes);

// Scheduler module — JWT-protected admin surface + unauthenticated public booking surface
app.use('/api/scheduler', schedulerRoutes.schedulerRoutes);
app.use('/api/public', schedulerRoutes.schedulerPublicRoutes);

// Sitemap (public, clean URLs — no /api prefix)
app.use('/sitemap', sitemapRoutes);

// Robots.txt (dedicated handler — separate from sitemap router to avoid route conflicts)
const { sitemapService } = require('./services');
const { asyncHandler } = require('./utils');
app.get(
  '/robots/:slug.txt',
  asyncHandler(async (req, res) => {
    const txt = await sitemapService.generateRobotsTxt(req.params.slug);
    if (!txt) {
      return res.status(404).send('# Website not found');
    }
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(txt);
  })
);

// ===================================
// Serve Frontend in Production (optional — backend-only deploys skip this)
// ===================================
// In the original co-hosted Mavro topology, Express serves the React build
// at /. In a backend-only deploy (e.g. Render hosting the API, Vercel hosting
// Spanbix), `client/dist/` doesn't exist on disk — trying to sendFile() it
// returns ENOENT on every non-API request.
//
// We resolve this at boot:
//   1. If SERVE_CLIENT=false is set → skip static serving entirely.
//   2. Otherwise auto-detect — only mount static + SPA fallback when
//      client/dist/index.html actually exists on disk.
// Either branch leaves /api, /sitemap, /robots, /api/health untouched.
if (config.env === 'production' && process.env.SERVE_CLIENT !== 'false') {
  const fs = require('fs');
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  const indexHtml = path.join(clientDist, 'index.html');

  if (fs.existsSync(indexHtml)) {
    app.use(express.static(clientDist, {
      maxAge: '30d',
      immutable: true,
    }));
    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/sitemap') || req.path.startsWith('/robots')) {
        return next();
      }
      res.sendFile(indexHtml);
    });
    console.log(`📦 Serving React build from ${clientDist}`);
  } else {
    console.log('ℹ️  client/dist/index.html not found — backend-only mode (frontend hosted elsewhere)');
  }
}

// ===================================
// 404 Handler
// ===================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ===================================
// Error Handler
// ===================================
app.use(errorHandler);

module.exports = app;
