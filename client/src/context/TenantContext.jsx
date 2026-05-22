import { createContext, useContext, useEffect, useState } from 'react';
import { getWebsites } from '@/api/websites';
import { useAuth } from './AuthContext';

// ===================================
// TenantContext
// ===================================
// Single source of truth for "which tenant is the admin dashboard scoped to".
// Consumed by:
//   - Topbar TenantSwitcher (writes selection)
//   - Dashboard (reads selection → passes websiteSlug to analytics endpoints)
//
// `selected` is either 'all' or a Website.slug.

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { user } = useAuth();
  const [websites, setWebsites] = useState([]);
  const [selected, setSelected] = useState('all');
  const [loading, setLoading] = useState(false);

  // Only fetch websites for authenticated users — `/api/websites` is protected.
  useEffect(() => {
    if (!user) {
      setWebsites([]);
      setSelected('all');
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getWebsites({ limit: 100 });
        if (cancelled) return;
        setWebsites(res?.data?.data?.websites || []);
      } catch {
        if (!cancelled) setWebsites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const selectedWebsite =
    selected === 'all' ? null : websites.find((w) => w.slug === selected) || null;

  return (
    <TenantContext.Provider value={{
      websites,
      selected,            // 'all' | <slug>
      setSelected,
      selectedWebsite,     // full Website doc, or null when 'all'
      loading,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
