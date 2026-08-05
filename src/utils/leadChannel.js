/**
 * Derive the acquisition channel of a lead.
 *
 * The public forms already ship first-touch ad identifiers in customFields
 * (see spanbix-web/src/lib/attribution.js): `gclid` / `gbraid` / `wbraid` for
 * Google Ads, `fbclid` for Meta, plus any `utm_*`. This turns that raw data
 * into one readable label so the admin can tell at a glance where a lead came
 * from, and filter on it.
 *
 * Derivation runs SERVER-side at submit time so the value is authoritative and
 * consistent — a client could send anything, and the label drives reporting.
 *
 * Order matters: a click id is the strongest signal (it only exists on a real
 * ad click), UTMs come next, and referrer is the weakest fallback. Anything we
 * cannot attribute honestly becomes 'direct' rather than being guessed into a
 * paid bucket, which would inflate ad performance.
 */

const CHANNELS = [
  'google_ads',
  'facebook_ads',
  'instagram_ads',
  'campaign',
  'google_organic',
  'social',
  'referral',
  'direct',
];

/** Human label for the admin UI. Keep in sync with CHANNELS. */
const CHANNEL_LABELS = {
  google_ads: 'Google Ads',
  facebook_ads: 'Facebook Ads',
  instagram_ads: 'Instagram Ads',
  campaign: 'Campaign',
  google_organic: 'Google Search',
  social: 'Social',
  referral: 'Referral',
  direct: 'Direct',
};

const lower = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

/** Host of a URL string, or '' when it is not parseable. */
function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * @param {object} lead Shape: { customFields, utmSource, utmMedium, referrer }
 * @returns {string} one of CHANNELS
 */
function deriveLeadChannel(lead = {}) {
  const cf = lead.customFields || {};
  const utmSource = lower(lead.utmSource || cf.utm_source);
  const utmMedium = lower(lead.utmMedium || cf.utm_medium);
  const referrerHost = hostOf(lead.referrer || cf.referrer || '');

  // 1. Click ids — only present on a genuine ad click.
  if (cf.gclid || cf.gbraid || cf.wbraid) return 'google_ads';
  if (cf.fbclid) {
    // Meta serves Facebook and Instagram from the same click id; the UTM is
    // the only thing that separates them when the campaign sets one.
    return utmSource.includes('instagram') || utmSource === 'ig'
      ? 'instagram_ads'
      : 'facebook_ads';
  }

  // 2. UTMs — a campaign the marketer tagged by hand.
  const paidMedium = /^(cpc|ppc|paid|paidsocial|paid_social|display)$/.test(utmMedium);
  if (utmSource) {
    if (utmSource.includes('google')) return paidMedium ? 'google_ads' : 'campaign';
    if (utmSource.includes('instagram') || utmSource === 'ig') return 'instagram_ads';
    if (utmSource.includes('facebook') || utmSource === 'fb' || utmSource.includes('meta')) {
      return 'facebook_ads';
    }
    return 'campaign';
  }

  // 3. Referrer — weakest signal, never treated as paid.
  if (referrerHost) {
    if (/(^|\.)google\./.test(referrerHost)) return 'google_organic';
    if (/(^|\.)(facebook|instagram|fb|l\.facebook)\./.test(referrerHost)) return 'social';
    if (/(^|\.)(linkedin|twitter|x|t\.co|youtube)\./.test(referrerHost)) return 'social';
    return 'referral';
  }

  return 'direct';
}

module.exports = { deriveLeadChannel, CHANNELS, CHANNEL_LABELS };
