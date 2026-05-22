// ===================================
// useTenantBlogCorpus
// ===================================
// Fetches the published-blog corpus for the currently-edited tenant
// (form.targetWebsite). Used by the Internal Link Engine + Keyword
// Intelligence card to power tenant-aware suggestions.
//
// Multi-tenant invariant: scoped strictly to the passed targetWebsite id.
// Never returns blogs from another tenant. Empty input → empty corpus.
//
// Performance:
// - One fetch per tenant switch
// - SessionStorage cache keyed by targetWebsite id (5-min TTL)
// - includeContent=true required so the engine can analyze tokens/headings
// - Defensive against in-flight tenant flips via cancelled flag

import { useEffect, useRef, useState } from 'react';
import { getBlogs } from '../api/blogs';

const CACHE_PREFIX = 'mavro_corpus_';
const CACHE_TTL_MS = 5 * 60 * 1000;

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.t || Date.now() - parsed.t > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), data }));
  } catch { /* quota / private-mode safe */ }
}

export default function useTenantBlogCorpus(targetWebsiteId, currentBlogId = null) {
  const [state, setState] = useState({ corpus: [], loading: false, error: null });
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    if (!targetWebsiteId) {
      setState({ corpus: [], loading: false, error: null });
      return;
    }

    const cached = readCache(targetWebsiteId);
    if (cached) {
      const filtered = currentBlogId ? cached.filter((b) => b._id !== currentBlogId) : cached;
      setState({ corpus: filtered, loading: false, error: null });
      return () => { cancelledRef.current = true; };
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    getBlogs({
      targetWebsite: targetWebsiteId,
      status: 'published',
      includeContent: true,
      limit: 100,
      sort: '-publishedAt',
    })
      .then((r) => {
        if (cancelledRef.current) return;
        const blogs = r?.data?.data?.blogs || [];
        writeCache(targetWebsiteId, blogs);
        const filtered = currentBlogId ? blogs.filter((b) => b._id !== currentBlogId) : blogs;
        setState({ corpus: filtered, loading: false, error: null });
      })
      .catch((e) => {
        if (cancelledRef.current) return;
        setState({ corpus: [], loading: false, error: e?.message || 'Failed to load corpus' });
      });

    return () => { cancelledRef.current = true; };
  }, [targetWebsiteId, currentBlogId]);

  return state;
}
