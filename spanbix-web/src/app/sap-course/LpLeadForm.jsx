'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';
import { getPublicWebsite, submitPublicLead } from '@/api/public';
import { getOrCreateSession } from '@/lib/analytics';
import { track, trackLead } from '@/lib/track';
import { getAttribution } from '@/lib/attribution';
import ConsentCheckbox, { CONSENT_RECORD } from '@/components/spanbix/ConsentCheckbox';
import Honeypot from '@/components/spanbix/Honeypot';
import EnquiryDisclaimer from '@/components/spanbix/EnquiryDisclaimer';

// Lead form for the SAP Ads landing page. Leads land under formId
// `spanbix-sap-lp` so the admin LeadList can filter them apart from organic
// /contact (spanbix-contact) and WhatsApp (/enquire) leads — no DB change, the
// formId field is already indexed + filterable.
const LP_FORM_ID = 'spanbix-sap-lp';
// Course choice is REQUIRED on the ads landing page — the counsellor needs it
// before the callback. "Not decided yet" is a real answer, not a way to skip:
// nothing is preselected, so the visitor has to pick one of these.
const TRACKS = ['SAP FICO', 'SAP MM', 'SAP SD', 'SAP ABAP', 'Not decided yet'];

export default function LpLeadForm({ location = 'hero', dark = false }) {
  const [websiteId, setWebsiteId] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: '' });
  const [hp, setHp] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  // Refs so a blocked submit can move the visitor to the field that stopped it.
  // Reddening the control in place was not enough: a paid-ads consultant
  // testing this form missed the course chips and the consent box, assumed the
  // submission had gone through, and reported the Meta pixel as broken.
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const courseRef = useRef(null);
  const consentRef = useRef(null);

  // Bring the offending field into view and focus it. Focus alone can leave the
  // control under the sticky header on mobile, so scroll first.
  const focusField = (ref) => {
    const el = ref?.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Chips are buttons in a wrapper div, which is not focusable — guard it.
    if (typeof el.focus === 'function') {
      setTimeout(() => el.focus({ preventScroll: true }), 300);
    }
  };

  useEffect(() => {
    getPublicWebsite(SPANBIX_SITE.slug)
      .then((res) => setWebsiteId(res?.data?.data?.website?._id))
      .catch(() => {});
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    // Honeypot: a real user can't see/fill this. If set, it's a bot — show the
    // success UI but never post the lead.
    if (hp.trim()) { setStatus('success'); return; }
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone are required.');
      setStatus('error');
      focusField(!form.name.trim() ? nameRef : phoneRef);
      return;
    }
    if (!form.interest) {
      setError('Please choose a course. Pick "Not decided yet" if you are still deciding.');
      setStatus('error');
      focusField(courseRef);
      return;
    }
    if (!consent) {
      setError('Please agree to the Privacy Policy and consent to be contacted.');
      setStatus('error');
      focusField(consentRef);
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
          interest: form.interest,
          source: 'google-ads-sap-lp',
          consent: CONSENT_RECORD,
          ...getAttribution(),
        },
        sourcePage: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        sessionId: getOrCreateSession(),
        formId: LP_FORM_ID,
      });
      // GA4 + Google Ads conversion signal. The backend emits the authoritative
      // form_submit on save, so we only push the marketing conversion here.
      trackLead({ form: LP_FORM_ID, location, interest: form.interest });
      setStatus('success');
      setForm({ name: '', phone: '', email: '', interest: '' });
      setConsent(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Submission failed. Please try again.');
      setStatus('error');
    }
  };

  const labelColor = dark ? 'rgba(255,255,255,0.6)' : 'var(--sx-ink-4)';
  // Course is the blocker: submit was attempted and nothing is chosen.
  const courseMissing = status === 'error' && !form.interest;

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
      <LpField label="Full Name *" placeholder="Your name" value={form.name} onChange={update('name')} dark={dark} required inputRef={nameRef} />
      <LpField label="Phone *" type="tel" placeholder="+91 98XXXXXXXX" value={form.phone} onChange={update('phone')} dark={dark} required inputRef={phoneRef} />
      <LpField label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} dark={dark} />

      {/* The whole block gets a tinted, outlined panel when the course is the
          thing blocking submission. Chip-level colouring proved unreliable
          here, and a panel on a plain div is unambiguous — this is the cue an
          ads consultant missed when testing, which cost a day of "the pixel is
          broken" investigation. */}
      <div
        ref={courseRef}
        style={courseMissing ? {
          padding: '10px 12px',
          margin: '-10px -12px',
          borderRadius: 10,
          background: 'rgba(244,63,94,0.07)',
          border: '1px solid rgba(244,63,94,0.45)',
        } : undefined}
      >
        <div className="sx-mono" style={{ color: courseMissing ? '#dc2626' : labelColor, marginBottom: 8, fontSize: 11 }}>
          WHICH COURSE? * {courseMissing && <span style={{ fontWeight: 700 }}>— PLEASE PICK ONE</span>}
        </div>
        <div className="flex flex-wrap" style={{ gap: 8 }}>
          {TRACKS.map((t) => {
            const active = form.interest === t;
            const base = { borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease', whiteSpace: 'nowrap' };
            // Unselected chips turn red once the visitor tries to submit without
            // choosing. NOTE: this must set the `border` SHORTHAND, not
            // `borderColor` — a longhand borderColor was being overridden here
            // and the red never actually rendered, which is how an ads
            // consultant testing the form missed the field entirely. The ring
            // is belt-and-braces: nothing else in the design system sets it.
            const missing = courseMissing;
            const ring = missing ? { boxShadow: '0 0 0 3px rgba(244,63,94,0.18)' } : {};
            const style = dark
              ? (active
                  ? { ...base, background: 'var(--sx-citron)', color: 'var(--sx-navy)', border: '1px solid var(--sx-citron)' }
                  : { ...base, background: 'rgba(255,255,255,0.07)', color: '#fff', border: missing ? '1px solid rgba(244,63,94,0.95)' : '1px solid rgba(255,255,255,0.24)', ...ring })
              : (active
                  ? { ...base, background: 'var(--sx-navy)', color: '#fff', border: '1px solid var(--sx-navy)' }
                  : { ...base, background: '#fff', color: 'var(--sx-navy)', border: missing ? '1px solid rgba(244,63,94,0.9)' : '1px solid var(--sx-hairline)', ...ring });
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

      <Honeypot value={hp} onChange={(e) => setHp(e.target.value)} />

      <ConsentCheckbox
        checked={consent}
        onChange={(e) => setConsent(e.target.checked)}
        dark={dark}
        error={status === 'error' && !consent}
        inputRef={consentRef}
      />

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
      <EnquiryDisclaimer dark={dark} align="center" />
    </form>
  );
}

function LpField({ label, placeholder, value, onChange, required, type = 'text', dark, inputRef }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="sx-mono" style={{ color: dark ? 'rgba(255,255,255,0.6)' : 'var(--sx-ink-3)', fontSize: 11 }}>
        {label.toUpperCase()}
      </span>
      <input
        ref={inputRef}
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
