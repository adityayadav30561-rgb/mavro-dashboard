import { useCallback, useMemo, useRef, useState } from 'react';
import { generateBlogFaqs as apiGenerate } from '@/api/ai';
import { analyzeFaqSet } from '@/lib/faqQuality';

/**
 * useAiFaqs — manages AI FAQ generation lifecycle for the Blog Editor
 * Cockpit. Mirrors useAiTitles / useAiMeta:
 *   - Cache by context signature (5 min)
 *   - Track loading + error
 *   - Enrich each suggestion with deterministic quality bundle
 *   - Maintain a per-item "selected" state so the operator can do
 *     selective insertion (toggle individual / insert all / regenerate)
 */

const CACHE_TTL_MS = 5 * 60 * 1000;

function signature(ctx) {
  const headingHash = (ctx.headings || [])
    .map((h) => `${h.level}:${(h.text || '').slice(0, 40)}`)
    .join('|');
  const existingHash = (ctx.existingQuestions || []).map((q) => (q || '').slice(0, 60)).join('|');
  return [
    ctx.focusKeyword || '',
    ctx.blogTitle || '',
    ctx.targetWebsite || ctx.tenantSlug || '',
    (ctx.tags || []).join(','),
    (ctx.semanticKeywords || []).join(','),
    ctx.category || '',
    ctx.tone || '',
    ctx.count || 6,
    headingHash,
    existingHash,
    (ctx.contentHtml || '').length,
  ].join('§');
}

export function useAiFaqs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSet, setActiveSet] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const cacheRef = useRef(new Map());

  const generate = useCallback(async (ctx, opts = {}) => {
    setError(null);
    if (!ctx?.focusKeyword || !String(ctx.focusKeyword).trim()) {
      setError('Set a focus keyword before generating FAQs.');
      return null;
    }
    const key = signature(ctx);
    const now = Date.now();
    const cached = cacheRef.current.get(key);
    if (!opts.force && cached && now - cached.ts < CACHE_TTL_MS) {
      setActiveSet(cached.payload);
      setSelectedIds(new Set());
      return cached.payload;
    }
    setLoading(true);
    try {
      const res = await apiGenerate({
        focusKeyword: ctx.focusKeyword,
        blogTitle: ctx.blogTitle,
        contentHtml: ctx.contentHtml,
        headings: ctx.headings,
        tags: ctx.tags,
        semanticKeywords: ctx.semanticKeywords,
        category: ctx.category,
        existingQuestions: ctx.existingQuestions,
        targetWebsite: ctx.targetWebsite,
        tenantSlug: ctx.tenantSlug,
        count: ctx.count ?? 6,
        tone: ctx.tone,
      });
      const data = res?.data?.data || {};
      const enriched = analyzeFaqSet(data.suggestions || [], {
        focusKeyword: ctx.focusKeyword,
        headings: ctx.headings,
        existingQuestions: ctx.existingQuestions,
      }).map((it, i) => ({ ...it, _id: `${now}-${i}` }));
      const payload = {
        ...data,
        suggestions: enriched,
        generatedAt: now,
        contextSignature: key,
      };
      cacheRef.current.set(key, { ts: now, payload });
      setActiveSet(payload);
      setSelectedIds(new Set());
      return payload;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'FAQ generation failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!activeSet?.suggestions) return;
    setSelectedIds(new Set(activeSet.suggestions.map((s) => s._id)));
  }, [activeSet]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const remove = useCallback((id) => {
    setActiveSet((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        suggestions: prev.suggestions.filter((s) => s._id !== id),
      };
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setActiveSet(null);
    setError(null);
    setSelectedIds(new Set());
  }, []);

  const selected = useMemo(() => {
    if (!activeSet?.suggestions) return [];
    return activeSet.suggestions.filter((s) => selectedIds.has(s._id));
  }, [activeSet, selectedIds]);

  return {
    loading,
    error,
    activeSet,
    selected,
    selectedIds,
    generate,
    toggle,
    selectAll,
    clearSelection,
    remove,
    clear,
  };
}
