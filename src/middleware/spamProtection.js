/**
 * Spam Protection Middleware
 *
 * Multi-layer spam protection for public lead submissions:
 * 1. Honeypot field detection
 * 2. Timing-based bot detection
 * 3. IP-based rate limiting
 * 4. Duplicate submission prevention
 * 5. Content-based spam scoring
 */

const { Lead } = require('../models');

/**
 * Extract real client IP from request
 * Handles proxies, load balancers, and Cloudflare
 */
const getClientIP = (req) => {
  return (
    req.headers['cf-connecting-ip'] ||            // Cloudflare
    req.headers['x-real-ip'] ||                    // Nginx proxy
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

/**
 * Sanitize user input — strip HTML tags and dangerous characters
 */
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/g, '')          // Strip HTML tags
    .replace(/[<>]/g, '')             // Remove angle brackets
    .replace(/javascript:/gi, '')     // Remove JS protocol
    .replace(/on\w+=/gi, '')          // Remove event handlers
    .trim();
};

/**
 * Sanitize all string fields in request body
 */
const sanitizeLeadBody = (req, res, next) => {
  const fieldsToSanitize = ['name', 'email', 'phone', 'company', 'message', 'sourcePage'];

  for (const field of fieldsToSanitize) {
    if (req.body[field]) {
      req.body[field] = sanitizeInput(req.body[field]);
    }
  }

  next();
};

/**
 * Honeypot check — if hidden field is filled, it's a bot
 * Frontend should include a hidden field named '_hp' that humans won't fill
 */
const honeypotCheck = (req, res, next) => {
  // If the honeypot field has a value, silently accept but flag as bot
  if (req.body._hp || req.body.website_url_hp || req.body.fax_number) {
    // Return success to not tip off the bot, but don't save
    return res.status(200).json({
      success: true,
      message: 'Thank you for your submission',
    });
  }

  // Clean honeypot fields from body
  delete req.body._hp;
  delete req.body.website_url_hp;
  delete req.body.fax_number;

  next();
};

/**
 * Timing check — reject if form submitted too quickly (< 2 seconds)
 * Frontend should include a '_formLoadedAt' timestamp
 */
const timingCheck = (req, res, next) => {
  if (req.body._formLoadedAt) {
    const loadedAt = parseInt(req.body._formLoadedAt, 10);
    const now = Date.now();
    const elapsed = now - loadedAt;

    // If submitted in under 2 seconds, likely a bot
    if (elapsed < 2000) {
      return res.status(200).json({
        success: true,
        message: 'Thank you for your submission',
      });
    }

    // Clean timing field
    delete req.body._formLoadedAt;
  }

  next();
};

/**
 * IP-based submission rate check
 * Max 5 submissions per hour from the same IP
 */
const ipRateCheck = async (req, res, next) => {
  try {
    const ip = getClientIP(req);
    const count = await Lead.countByIP(ip, 60); // 60-minute window

    if (count >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many submissions. Please try again later.',
      });
    }

    // Attach IP to request for later use
    req.clientIP = ip;
    next();
  } catch (error) {
    // Don't block submission on rate-check failure
    req.clientIP = getClientIP(req);
    next();
  }
};

/**
 * Duplicate submission check
 * Prevents same email + website within 10 minutes
 */
const duplicateCheck = async (req, res, next) => {
  try {
    const { email, website } = req.body;

    if (email && website) {
      const isDuplicate = await Lead.isDuplicate(email, website, 10);
      if (isDuplicate) {
        // Return success (don't reveal dedup to potential attackers)
        return res.status(200).json({
          success: true,
          message: 'Thank you for your submission',
        });
      }
    }

    next();
  } catch (error) {
    // Don't block on dedup failure
    next();
  }
};

/**
 * Spam scoring — runs content analysis and attaches score to request
 */
const spamScoring = (req, res, next) => {
  const { score, reasons } = Lead.calculateSpamScore(req.body);

  req.spamScore = score;
  req.spamReasons = reasons;

  // Auto-block if spam score >= 70
  if (score >= 70) {
    req.body._autoSpam = true;
  }

  next();
};

/**
 * Combined spam protection pipeline
 * Use this as a single middleware chain for lead submission routes
 */
const spamProtection = [
  sanitizeLeadBody,
  honeypotCheck,
  timingCheck,
  ipRateCheck,
  duplicateCheck,
  spamScoring,
];

module.exports = {
  getClientIP,
  sanitizeInput,
  sanitizeLeadBody,
  honeypotCheck,
  timingCheck,
  ipRateCheck,
  duplicateCheck,
  spamScoring,
  spamProtection,
};
