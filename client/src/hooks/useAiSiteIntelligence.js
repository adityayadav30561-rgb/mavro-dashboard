import { useCallback, useRef, useState } from 'react';
import { generateSiteIntelligence as apiGenerate } from '@/api/ai';

/**
 * useAiSiteIntelligence — manages site-wide AI SEO intelligence requests
 * for the `/seo` command center. Mirrors useAiTitles / useAiMeta but with
 * a longer cache TTL (15 min) because the analysis is expensive + the
 * underlying corpus changes slowly.
 */

const CACHE_TTL_MS = 15 * 60 * 1000;

function signature(ctx) {
  return [
    ctx.targetWebsite || ctx.tenantSlug || '',
    ctx.deterministic?.avgSeoScore ?? '',
    ctx.deterministic?.linkGraph?.qualityScore ?? '',
    ctx.deterministic?.decay?.criticalCount ?? '',
    ctx.deterministic?.decay?.decliningCount ?? '',
    ctx.deterministic?.decay?.agingCount ?? '',
  ].join('§');
}

export function useAiSiteIntelligence() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSet, setActiveSet] = useState(null);
  const cacheRef = useRef(new Map());

  const generate = useCallback(async (ctx, opts = {}) => {
    setError(null);
    if (!ctx?.targetWebsite && !ctx?.tenantSlug) {
      setError('Pick a tenant before running site intelligence.');
      return null;
    }
    const key = signature(ctx);
    const now = Date.now();
    const cached = cacheRef.current.get(key);
    if (!opts.force && cached && now - cached.ts < CACHE_TTL_MS) {
      setActiveSet(cached.payload);
      return cached.payload;
    }
    setLoading(true);
    try {
      const res = await apiGenerate({
        targetWebsite: ctx.targetWebsite,
        tenantSlug: ctx.tenantSlug,
        deterministic: ctx.deterministic,
        sampleSize: ctx.sampleSize,
      });
      const payload = res?.data?.data || null;
      cacheRef.current.set(key, { ts: now, payload });
      setActiveSet(payload);
      return payload;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Site intelligence failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setActiveSet(null);
    setError(null);
  }, []);

  return { loading, error, activeSet, generate, clear };
}
