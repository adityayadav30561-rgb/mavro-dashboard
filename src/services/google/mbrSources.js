/**
 * MBR data-source registry — which GA4 properties / Search Console sites the
 * MBR dashboard can report on. One service account (GOOGLE_SERVICE_ACCOUNT_JSON)
 * must have Viewer (GA4) / Full (GSC) on every listed property.
 *
 * Configure via env MBR_SOURCES — a JSON array:
 *   [{"key":"spanbix","label":"Spanbix","ga4PropertyId":"541588648","gscSiteUrl":"https://www.spanbix.com/","websiteSlug":"spanbix"},
 *    {"key":"saisatwik","label":"SaiSatwik","ga4PropertyId":"...","gscSiteUrl":"sc-domain:saisatwik.com"}]
 *
 * Fallback when MBR_SOURCES is unset: a single "spanbix" source built from the
 * legacy GA4_PROPERTY_ID + GSC_SITE_URL vars — existing deploys keep working.
 *
 * `websiteSlug` (optional) links a source to a Mavro Website row so the
 * dashboard can join own-DB data (button clicks, blogs, leads) to it.
 */

let cached; // parsed once per process

function getSources() {
  if (cached) return cached;

  const raw = (process.env.MBR_SOURCES || '').trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cached = parsed
          .filter((s) => s && s.key)
          .map((s) => ({
            key: String(s.key).toLowerCase(),
            label: s.label || s.key,
            ga4PropertyId: s.ga4PropertyId ? String(s.ga4PropertyId) : null,
            gscSiteUrl: s.gscSiteUrl || null,
            websiteSlug: s.websiteSlug || null,
            hostname: s.hostname || null,
          }));
        return cached;
      }
    } catch (err) {
      console.error('❌ [mbrSources] MBR_SOURCES is not valid JSON — falling back to legacy env vars:', err.message);
    }
  }

  cached = [
    {
      key: 'spanbix',
      label: 'Spanbix',
      ga4PropertyId: (process.env.GA4_PROPERTY_ID || '').trim() || null,
      gscSiteUrl: (process.env.GSC_SITE_URL || '').trim() || null,
      websiteSlug: 'spanbix',
    },
  ];
  return cached;
}

function getSource(key) {
  const k = String(key || '').toLowerCase();
  const sources = getSources();
  return sources.find((s) => s.key === k) || sources[0] || null;
}

/**
 * GA4 hostName scope for a source — keeps multi-site GA4 properties clean
 * (the same measurement tag on a second website merges its pages into every
 * report otherwise). Explicit `hostname` in MBR_SOURCES wins; else derived
 * from gscSiteUrl: URL-prefix → EXACT hostname, sc-domain → ENDS_WITH domain.
 */
function getHostScope(source) {
  if (!source) return null;
  if (source.hostname) return { matchType: 'EXACT', value: String(source.hostname).toLowerCase() };
  const site = source.gscSiteUrl || '';
  if (site.startsWith('sc-domain:')) {
    return { matchType: 'ENDS_WITH', value: site.slice('sc-domain:'.length).toLowerCase() };
  }
  try {
    const host = new URL(site).hostname;
    if (host) return { matchType: 'EXACT', value: host.toLowerCase() };
  } catch { /* no usable site url */ }
  return null;
}

module.exports = { getSources, getSource, getHostScope };
