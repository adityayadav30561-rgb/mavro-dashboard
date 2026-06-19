'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';
import { getPublicWebsite, submitPublicLead } from '@/api/public';
import { getOrCreateSession } from '@/lib/analytics';
import { track, trackLead } from '@/lib/track';

// Lead form for the SAP Ads landing page. Leads land under formId
// `spanbix-sap-lp` so the admin LeadList can filter them apart from organic
// /contact (spanbix-contact) and WhatsApp (/enquire) leads — no DB change, the
// formId field is already indexed + filterable.
const LP_FORM_ID = 'spanbix-sap-lp';
const TRACKS = ['SAP FICO', 'SAP MM', 'SAP SD', 'SAP ABAP', 'Not sure yet'];

export default function LpLeadForm({ location = 'hero', dark = false }) {
  const [websiteId, setWebsiteId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    getPublicWebsite(SPANBIX_SITE.slug)
      .then((res) => setWebsiteId(res?.data?.data?.website?._id))
      .catch(() => {});
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required.');
      setStatus('error');
      return;
    }
    if (!websiteId) {
      setError('Still connecting — try again in a moment.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    track('cta_click', { cta: 'lead_submit', location });
    try {
      await submitPublicLead({
        website: websiteId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        customFields: {
          ...(form.interest ? { interest: form.interest } : {}),
          source: 'google-ads-sap-lp',
        },
        sourcePage: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        sessionId: getOrCreateSession(),
        formId: LP_FORM_ID,
      });
      // GA4 + Google Ads conversion signal. The backend emits the authoritative
      // form_submit on save, so we only push the marketing conversion here.
      trackLead({ form: LP_FORM_ID, location, interest: form.interest || 'unspecified' });
      setStatus('success');
      setForm({ name: '', phone: '', email: '', interest: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Submission failed. Please try again.');
      setStatus('error');
    }
  };

  const labelColor = dark ? 'rgba(255,255,255,0.6)' : 'var(--sx-ink-4)';

  if (status === 'success') {
    return (
      <div
        className="flex items-start gap-3 p-5 rounded-xl"
        style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', color: '#15803d' }}
      >
        <CheckCircle2 size={22} className="shrink-0 mt-0.5" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Thanks — request received.</div>
          <div style={{ fontSize: 14, marginTop: 4, color: dark ? 'rgba(255,255,255,0.8)' : 'var(--sx-ink-2)' }}>
            A career counsellor will call you within one business day. Keep your phone handy.
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3.5">
      <LpField label="Full Name *" placeholder="Your name" value={form.name} onChange={update('name')} dark={dark} required />
      <LpField label="Phone *" type="tel" placeholder="+91 98XXXXXXXX" value={form.phone} onChange={update('phone')} dark={dark} required />
      <LpField label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} dark={dark} />

      <div>
        <div className="sx-mono" style={{ color: labelColor, marginBottom: 8, fontSize: 11 }}>INTERESTED TRACK</div>
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {TRACKS.map((t) => {
            const active = form.interest === t;
            const base = { borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease', border: '1px solid', whiteSpace: 'nowrap' };
            const style = dark
              ? (active
                  ? { ...base, background: 'var(--sx-citron)', color: 'var(--sx-navy)', borderColor: 'var(--sx-citron)' }
                  : { ...base, background: 'rgba(255,255,255,0.07)', color: '#fff', borderColor: 'rgba(255,255,255,0.24)' })
              : (active
                  ? { ...base, background: 'var(--sx-navy)', color: '#fff', borderColor: 'var(--sx-navy)' }
                  : { ...base, background: '#fff', color: 'var(--sx-navy)', borderColor: 'var(--sx-hairline)' });
            return (
              <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, interest: t }))} style={style}>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {status === 'error' && error && (
        <div
          className="flex items-start gap-2 p-3 rounded-lg text-sm"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', color: '#b91c1c' }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="sx-btn sx-btn-dark"
        style={{ width: '100%', justifyContent: 'center', marginTop: 4, fontSize: 15.5, padding: '14px 20px' }}
      >
        {status === 'loading' ? (
          <><Loader2 size={16} className="animate-spin" /> Sending…</>
        ) : (
          'Enroll Now — Get a Callback'
        )}
      </button>
      <p style={{ fontSize: 12, textAlign: 'center', color: dark ? 'rgba(255,255,255,0.5)' : 'var(--sx-ink-4)' }}>
        No spam. We call once, you decide.
      </p>
    </form>
  );
}

function LpField({ label, placeholder, value, onChange, required, type = 'text', dark }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="sx-mono" style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'var(--sx-ink-3)', fontSize: 11 }}>
        {label.toUpperCase()}
      </span>
      <input
        className="sx-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={dark ? { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.18)', color: '#fff' } : undefined}
      />
    </label>
  );
}
