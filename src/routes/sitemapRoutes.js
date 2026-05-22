const express = require('express');
const router = express.Router();
const { protect } = require('../middleware');
const { asyncHandler } = require('../utils');
const { sitemapService } = require('../services');

// ===================================
// Public Routes (served to search engines)
// ===================================

/**
 * @desc    Sitemap index listing all website sitemaps
 * @route   GET /sitemap/index.xml
 * @access  Public
 * NOTE: Must be defined BEFORE /:slug.xml to avoid being caught by the wildcard
 */
router.get(
  '/index.xml',
  asyncHandler(async (req, res) => {
    const host = req.get('host') || 'api.mavro.com';
    const xml = await sitemapService.generateSitemapIndex(host);

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  })
);

/**
 * @desc    Dynamic sitemap XML for a website (by slug)
 * @route   GET /sitemap/:slug.xml
 * @access  Public
 */
router.get(
  '/:slug.xml',
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    const xml = await sitemapService.generateSitemapBySlug(slug);

    if (!xml) {
      return res.status(404).send('<?xml version="1.0"?><error>Sitemap not found</error>');
    }

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('X-Robots-Tag', 'noindex');
    res.send(xml);
  })
);

// ===================================
// Admin Routes (stats and management)
// ===================================

/**
 * @desc    Get sitemap URL stats for a website
 * @route   GET /sitemap/stats/:websiteId
 * @access  Private
 */
router.get(
  '/stats/:websiteId',
  protect,
  asyncHandler(async (req, res) => {
    const stats = await sitemapService.getSitemapStats(req.params.websiteId);
    res.status(200).json({ success: true, data: stats });
  })
);

/**
 * @desc    Force ping search engines for a website
 * @route   POST /sitemap/ping/:websiteSlug
 * @access  Private
 */
router.post(
  '/ping/:websiteSlug',
  protect,
  asyncHandler(async (req, res) => {
    const { pingService } = require('../services');
    const { Website } = require('../models');

    const website = await Website.findOne({ slug: req.params.websiteSlug });
    if (!website) {
      return res.status(404).json({ success: false, message: 'Website not found' });
    }

    const sitemapUrl = `https://${website.domain}/sitemap.xml`;
    const results = await pingService.pingAllEngines(sitemapUrl);

    res.status(200).json({
      success: true,
      message: 'Search engines pinged',
      data: { sitemapUrl, results },
    });
  })
);

module.exports = router;
