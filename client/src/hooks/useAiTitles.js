import { useCallback, useMemo, useRef, useState } from 'react';
import { generateBlogTitles as apiGenerateBlogTitles } from '@/api/ai';
import { analyzeTitleSet } from '@/lib/titleQuality';

/**
 * useAiTitles — manages the lifecycle of AI title suggestion requests for
 * the blog editor cockpit.
 *
 * Responsibilities:
 *   - Build the request payload from editor state (caller passes context)
 *   - Cache responses by context signature (avoid re-burning quota on reopen)
 *   - Track loading + error states
 *   - Apply deterministic per-title quality analysis client-side
 *
 * The orchestrator (backend) handles provider routing — the hook is
 * provider-agnostic by design.
 */

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function signature(ctx) {
  // Stable key — only the inputs that change generation outcome.
  const headingHash = (ctx.headings || [])
    .map((h) => `${h.level}:${(h.text || '').slice(0, 40)}`)
    .join('|');
  return [
    ctx.focusKeyword || '',
    ctx.currentTitle || '',
    ctx.targetWebsite || ctx.tenantSlug || '',
    (ctx.tags || []).join(','),
    (ctx.semanticKeywords || []).join(','),
    ctx.intent || '',
    ctx.category || '',
    (ctx.categories || []).join(','),
    headingHash,
    (ctx.contentHtml || '').length, // length is enough — full body is heavy
  ].join('§');
}

export function useAiTitles() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]); // [{ts, focusKeyword, suggestions, provider, model}]
  const [activeSet, setActiveSet] = useState(null);
  const cacheRef = useRef(new Map());

  /**
   * @param {object} ctx
   * @param {boolean} [opts.force]  - bypass cache and regenerate
   */
  const generate = useCallback(async (ctx, opts = {}) => {
    setError(null);
    if (!ctx?.focusKeyword || !String(ctx.focusKeyword).trim()) {
      setError('Set a focus keyword before generating AI titles.');
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
      const res = await apiGenerateBlogTitles({
        focusKeyword: ctx.focusKeyword,
        currentTitle: ctx.currentTitle,
        contentHtml: ctx.contentHtml,
        headings: ctx.headings,
        tags: ctx.tags,
        semanticKeywords: ctx.semanticKeywords,
        intent: ctx.intent,
        category: ctx.category,
        targetWebsite: ctx.targetWebsite,
        tenantSlug: ctx.tenantSlug,
        categories: ctx.categories,
        perCategory: ctx.perCategory ?? 2,
      });
      const data = res?.data?.data || {};
      // Augment each suggestion with deterministic quality bundle.
      const enriched = {};
      Object.entries(data.suggestions || {}).forEach(([cat, list]) => {
        enriched[cat] = analyzeTitleSet(list, ctx.focusKeyword);
      });
      const payload = {
        ...data,
        suggestions: enriched,
        generatedAt: now,
        contextSignature: key,
      };
      cacheRef.current.set(key, { ts: now, payload });
      setActiveSet(payload);
      setHistory((prev) => [{ ts: now, focusKeyword: ctx.focusKeyword, payload }, ...prev].slice(0, 8));
      return payload;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'AI title generation failed';
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

  const totalCount = useMemo(() => {
    if (!activeSet?.suggestions) return 0;
    return Object.values(activeSet.suggestions).reduce((s, arr) => s + arr.length, 0);
  }, [activeSet]);

  return {
    loading,
    error,
    activeSet,
    history,
    totalCount,
    generate,
    clear,
  };
}
