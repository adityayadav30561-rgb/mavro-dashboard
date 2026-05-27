import { apiPath } from '@/lib/apiBase';

// Public, unauthenticated API client for the Spanbix Next.js app. Uses native
// fetch (no axios dependency). Returns { data } so call sites read the parsed
// body via res.data — matching the old axios response shape. Routes every call
// through apiPath() so NEXT_PUBLIC_API_BASE_URL points it at the Render backend
// in production and stays relative in local dev.
async function request(path, options = {}) {
  const res = await fetch(apiPath(`/api${path}`), {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.response = { data, status: res.status };
    throw err;
  }
  return { data };
}

export const getPublicWebsite = (slug) => request(`/websites/public/${slug}`);

export const submitPublicLead = (data) =>
  request('/leads/submit', { method: 'POST', body: JSON.stringify(data) });
