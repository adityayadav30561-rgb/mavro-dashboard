import { useCallback, useMemo, useRef, useState } from 'react';
import { generateBlogMetaDescriptions as apiGenerate } from '@/api/ai';
import { analyzeMetaSet } from '@/lib/metaQuality';

/**
 * useAiMeta — manages AI meta-description suggestion lifecycle for the
 * Blog Editor Cockpit. Mirrors useAiTitles for consistent UX patterns.
 */

const CACHE_TTL_MS = 5 * 60 * 1000;

function signature(ctx) {
  const headingHash = (ctx.headings || [])
    .map((h) => `${h.level}:${(h.text || '').slice(0, 40)}`)
    .join('|');
  const faqHash = (ctx.faqs || []).map((f) => (f.question || '').slice(0, 50)).join('|');
  return [
    ctx.focusKeyword || '',
    ctx.blogTitle || '',
    ctx.currentDescription || '',
    ctx.targetWebsite || ctx.tenantSlug || '',
    (ctx.tags || []).join(','),
    (ctx.semanticKeywords || []).join(','),
    ctx.intent || '',
    ctx.category || '',
    (ctx.categories || []).join(','),
    headingHash,
    faqHash,
    (ctx.contentHtml || '').length,
  ].join('§');
}

export function useAiMeta() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSet, setActiveSet] = useState(null);
  const [history, setHistory] = useState([]);
  const cacheRef = useRef(new Map());

  const generate = useCallback(async (ctx, opts = {}) => {
    setError(null);
    if (!ctx?.focusKeyword || !String(ctx.focusKeyword).trim()) {
      setError('Set a focus keyword before generating meta descriptions.');
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
        focusKeyword: ctx.focusKeyword,
        blogTitle: ctx.blogTitle,
        currentDescription: ctx.currentDescription,
        contentHtml: ctx.contentHtml,
        headings: ctx.headings,
        faqs: ctx.faqs,
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
      const enriched = {};
      Object.entries(data.suggestions || {}).forEach(([cat, list]) => {
        enriched[cat] = analyzeMetaSet(list, ctx.focusKeyword);
      });
      const payload = {
        ...data,
        suggestions: enriched,
        generatedAt: now,
        contextSignature: key,
      };
      cacheRef.current.set(key, { ts: now, payload });
      setActiveSet(payload);
      setHistory((prev) =>
        [{ ts: now, focusKeyword: ctx.focusKeyword, payload }, ...prev].slice(0, 8)
      );
      return payload;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Meta description generation failed';
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
    return Object.values(activeSet.suggestions).reduce((s, a) => s + a.length, 0);
  }, [activeSet]);

  return { loading, error, activeSet, history, totalCount, generate, clear };
}
