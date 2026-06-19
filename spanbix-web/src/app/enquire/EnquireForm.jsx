'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';
import { getPublicWebsite, submitPublicLead } from '@/api/public';
import { getOrCreateSession } from '@/lib/analytics';
import ConsentCheckbox, { CONSENT_RECORD } from '@/components/spanbix/ConsentCheckbox';

// EnquireForm — pure lead-capture component for /enquire.
//
// Visually distinct from ContactForm: single-column centered card on a soft
// cream backdrop, no contact-coordinates aside, no map embed. Reads as a
// one-job form, which is the point — the team shares this link 1-to-1 over
// WhatsApp / email and the submission gets tagged with the WhatsApp formId
// so admin Leads can separate it from organic /contact submissions.
//
// FORM ID DISCIPLINE
// ──────────────────
// `formId: 'spanbix-whatsapp'` is the attribution mechanism. Backend Lead
// schema indexes `formId`; admin Leads UI filters by it. Do NOT change this
// string without updating any admin saved-filter that depends on it.

const AUDIENCES = ['Student', 'Working professional', 'College / T&P office'];
const INTERESTS = ['SAP FICO', 'SAP MM', 'SAP SD', 'SAP ABAP', 'Not sure yet'];
// Highest education qualification is a free-text input — mirrors /contact's
// ContactForm so admin Leads has a single canonical column
// (`customFields.education`) across both inbound channels regardless of how
// people phrase their credential (B.Com Hons / MBA Finance / B.Tech CSE / CA
// Inter / Diploma in Mechanical Engineering / …). 120-char client-side cap;
// the leadController sanitizer enforces 1000-char ceiling server-side.

const FORM_ID = 'spanbix-whatsapp';
const SOURCE_TAG = 'whatsapp-share';

export default function EnquireForm() {
  const [websiteId, setWebsiteId] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    audience: 'Student', interest: '', education: '', message: '',
  });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    getPublicWebsite(SPANBIX_SITE.slug)
      .then((res) => setWebsiteId(res?.data?.data?.website?._id))
      .catch(() => {});
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setServerError('Name, email, and phone are required.');
      setStatus('error');
      return;
    }
    if (!form.education.trim()) {
      setServerError('Please enter your highest education qualification.');
      setStatus('error');
      return;
    }
    if (!consent) {
      setServerError('Please agree to the Privacy Policy to continue.');
      setStatus('error');
      return;
    }
    if (!websiteId) {
      setServerError('Still connecting — try again in a moment.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setServerError('');
    try {
      await submitPublicLead({
        website: websiteId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || undefined,
        message: form.message.trim() || undefined,
        customFields: {
          // `source` is a redundant attribution signal beyond `formId`. Admin
          // Leads list renders every customFields key as its own column, so
          // operators see WHATSAPP-SHARE next to the lead at a glance.
          source: SOURCE_TAG,
          ...(form.audience ? { audience: form.audience } : {}),
          ...(form.education.trim() ? { education: form.education.trim() } : {}),
          ...(form.interest ? { interest: form.interest } : {}),
          consent: CONSENT_RECORD,
        },
        sourcePage: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        sessionId: getOrCreateSession(),
        formId: FORM_ID,
      });
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', audience: 'Student', interest: '', education: '', message: '' });
      setConsent(false);
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Submission failed. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section
      className="sx-section"
      style={{
        background: 'var(--sx-cream-50, #f6f1e7)',
        paddingTop: 'clamp(48px, 7vw, 88px)',
        paddingBottom: 'clamp(64px, 9vw, 112px)',
        minHeight: '70vh',
      }}
    >
      <div className="sx-container" style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 'clamp(24px, 4vw, 36px)' }}>
          <span
            className="sx-eyebrow"
            style={{
              display: 'inline-block',
              marginBottom: 14,
              color: 'var(--sx-navy, #0b1730)',
            }}
          >
            QUICK ENQUIRY
          </span>
          <h1
            style={{
              fontFamily: 'var(--sx-serif, "Instrument Serif", Georgia, serif)',
              fontSize: 'clamp(34px, 5vw, 48px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--sx-navy, #0b1730)',
              margin: '0 0 14px',
            }}
          >
            Tell us about <em>you</em>.
          </h1>
          <p
            style={{
              fontFamily: 'var(--sx-sans, "Geist", "Sora", system-ui, sans-serif)',
              fontSize: 'clamp(14.5px, 1.4vw, 16px)',
              lineHeight: 1.55,
              color: 'rgba(11, 23, 48, 0.72)',
              maxWidth: 520,
              margin: '0 auto',
            }}
          >
            Share a few details and a Spanbix career strategist will reach out
            within one business day to map the right SAP track for your background.
          </p>
        </header>

        <div
          style={{
            background: 'var(--sx-white, #ffffff)',
            border: '1px solid rgba(11, 23, 48, 0.08)',
            borderRadius: 18,
            padding: 'clamp(28px, 4vw, 40px)',
            boxShadow: '0 30px 80px -30px rgba(16, 44, 86, 0.18)',
          }}
        >
          {status === 'success' ? (
            <div
              className="flex items-start gap-3 p-5 rounded-xl"
              style={{
                background: 'rgba(22, 163, 74, 0.06)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
                color: '#15803d',
              }}
            >
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Thanks — we got it.</div>
                <div style={{ fontSize: 13.5, marginTop: 4, color: 'var(--sx-ink-2, #1f2c4d)' }}>
                  A Spanbix strategist will reach out within one business day.
                  Check your inbox + spam folder so the reply doesn&apos;t get lost.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
              >
                <Field label="Full Name *" placeholder="Priya Sharma" value={form.name} onChange={update('name')} required />
                <Field label="Email *" placeholder="priya@example.com" value={form.email} onChange={update('email')} required type="email" />
                <Field label="Phone (WhatsApp) *" placeholder="+91 98XXXXXXXX" value={form.phone} onChange={update('phone')} required type="tel" />
                <Field label="Company / College" placeholder="Tata Consultancy Services" value={form.company} onChange={update('company')} />
              </div>

              <div>
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4, #5d6a8a)', marginBottom: 8 }}>I AM A</div>
                <div className="sx-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {AUDIENCES.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, audience: a }))}
                      className={form.audience === a ? 'sx-role-chip active' : 'sx-role-chip'}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <Field
                label="Highest Education *"
                placeholder="e.g. B.Com (Hons), MBA Finance, B.Tech CSE…"
                value={form.education}
                onChange={update('education')}
                required
                maxLength={120}
              />

              <div>
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4, #5d6a8a)', marginBottom: 8 }}>INTERESTED TRACK</div>
                <div className="sx-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {INTERESTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, interest: t }))}
                      className={form.interest === t ? 'sx-role-chip active' : 'sx-role-chip'}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4, #5d6a8a)', marginBottom: 8 }}>
                  ANY EXTRA CONTEXT FOR THE STRATEGIST (OPTIONAL)
                </div>
                <textarea
                  className="sx-input"
                  rows={3}
                  value={form.message}
                  onChange={update('message')}
                  placeholder="Background, target geography, salary expectation, batch timing…"
                />
              </div>

              {status === 'error' && serverError && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(244, 63, 94, 0.06)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#b91c1c',
                  }}
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <ConsentCheckbox checked={consent} onChange={(e) => setConsent(e.target.checked)} error={status === 'error' && !consent} />

              <div className="flex items-center justify-end mt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="sx-btn sx-btn-dark"
                  style={{ minWidth: 220 }}
                >
                  {status === 'loading' ? (
                    <><Loader2 size={14} className="animate-spin" /> Sending…</>
                  ) : (
                    <>Send Enquiry <Arrow /></>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: 22,
            fontFamily: 'var(--sx-mono, "JetBrains Mono", ui-monospace, monospace)',
            fontSize: 11.5,
            letterSpacing: '0.08em',
            color: 'rgba(11, 23, 48, 0.45)',
          }}
        >
          SECURE · NO SPAM · UNSUBSCRIBE ANYTIME
        </p>
      </div>
    </section>
  );
}

function Field({ label, placeholder, value, onChange, required, type = 'text', maxLength }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="sx-mono" style={{ color: 'var(--sx-ink-3, #3a4970)' }}>
        {label.toUpperCase()}
      </span>
      <input
        className="sx-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
      />
    </label>
  );
}
