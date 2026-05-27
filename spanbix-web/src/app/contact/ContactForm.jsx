'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';
import { getPublicWebsite, submitPublicLead } from '@/api/public';
import { getOrCreateSession } from '@/lib/analytics';

const COORDINATES = [
  { icon: Mail,    label: 'Email',     value: 'hello@spanbix.com' },
  { icon: Phone,   label: 'Phone',     value: '+91 9211429011' },
  { icon: MapPin,  label: 'Locations', value: 'Noida · Lucknow' },
  { icon: Clock,   label: 'Hours',     value: 'Mon–Sat · 10AM – 7PM IST' },
];

const AUDIENCES = ['Student', 'Working professional', 'College / T&P office'];
const INTERESTS = ['SAP FICO', 'SAP MM', 'SAP SD', 'SAP ABAP', 'Not sure yet'];

export default function ContactForm() {
  const [websiteId, setWebsiteId] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    audience: 'Student', interest: '', message: '',
  });
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
    if (!form.name.trim() || !form.email.trim()) {
      setServerError('Name and email are required.');
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
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        message: form.message.trim() || undefined,
        customFields: {
          ...(form.audience ? { audience: form.audience } : {}),
          ...(form.interest ? { interest: form.interest } : {}),
        },
        sourcePage: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        sessionId: getOrCreateSession(),
        formId: 'spanbix-contact',
      });
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', audience: 'Student', interest: '', message: '' });
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Submission failed. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section
      className="sx-section sx-section-paper"
      id="contact-form"
      style={{ paddingTop: 'clamp(32px, 4vw, 48px)', paddingBottom: 'clamp(32px, 4vw, 48px)' }}
    >
      <div className="sx-container">
        <div className="grid gap-6 md:gap-8 grid-cols-1 md:[grid-template-columns:30%_70%] items-start">
            {/* LEFT — contact details (30%) */}
            <aside
              style={{
                background: 'var(--sx-navy)',
                color: '#fff',
                borderRadius: 16,
                padding: 'clamp(22px, 3vw, 30px)',
                boxShadow: '0 30px 80px -40px rgba(16,44,86,0.35)',
              }}
            >
              <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.55)' }}>GET IN TOUCH</div>
              <h3 style={{
                fontFamily: 'var(--sx-serif)',
                fontSize: 'clamp(22px, 3vw, 28px)',
                color: '#fff',
                margin: '6px 0 22px',
                letterSpacing: '-0.01em',
                lineHeight: 1.15,
              }}>
                Talk to us directly.
              </h3>
              <div className="flex flex-col gap-5">
                {COORDINATES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <div key={c.label} className="flex items-start gap-3">
                      <span
                        className="grid place-items-center shrink-0"
                        style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: 'rgba(255,255,255,0.08)',
                          color: 'var(--sx-citron)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.label.toUpperCase()}</div>
                        <div style={{ fontSize: 14.5, color: '#fff', fontWeight: 500, marginTop: 3, lineHeight: 1.4, wordBreak: 'break-word' }}>
                          {c.value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Office location map */}
              <div
                style={{
                  marginTop: 24,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <iframe
                  title="Spanbix office location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.8304222630195!2d77.43036737706927!3d28.604863675679876!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cf36d281a3787%3A0x365799707d044772!2sBest%20SAP%20Consulting%20Company%20-%20Saisatwik%20Technologies%20Private%20Limited!5e0!3m2!1sen!2sin!4v1779759062749!5m2!1sen!2sin"
                  width="100%"
                  height="240"
                  style={{ border: 0, display: 'block', filter: 'grayscale(0.15)' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </aside>

            {/* RIGHT — form (70%) */}
            <div
              style={{
                background: 'var(--sx-white)',
                border: '1px solid var(--sx-hairline)',
                borderRadius: 16,
                padding: 'clamp(22px, 4vw, 36px)',
                boxShadow: '0 30px 80px -40px rgba(16,44,86,0.18)',
              }}
            >
              <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>CAREER CONSULTATION</div>
              <h3 style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(22px, 3.4vw, 28px)', color: 'var(--sx-navy)', margin: '6px 0 22px', letterSpacing: '-0.01em' }}>
                Book a 30-minute call with a career strategist
              </h3>

              {status === 'success' ? (
              <div
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)', color: '#15803d' }}
              >
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <div>
                  <div style={{ fontWeight: 600 }}>Thanks — we got it.</div>
                  <div style={{ fontSize: 13.5, marginTop: 4, color: 'var(--sx-ink-2)' }}>
                    A career strategist will reach out within one business day. Check your inbox + spam.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <Field label="Full Name *" placeholder="Priya Sharma" value={form.name} onChange={update('name')} required />
                  <Field label="Email *" placeholder="priya@example.com" value={form.email} onChange={update('email')} required type="email" />
                  <Field label="Phone" placeholder="+91 98XXXXXXXX" value={form.phone} onChange={update('phone')} />
                  <Field label="Company / College" placeholder="Tata Consultancy Services" value={form.company} onChange={update('company')} />
                </div>

                <div>
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', marginBottom: 8 }}>I AM A</div>
                  <div className="sx-row" style={{ gap: 8 }}>
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

                <div>
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', marginBottom: 8 }}>INTERESTED TRACK</div>
                  <div className="sx-row" style={{ gap: 8 }}>
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
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', marginBottom: 8 }}>
                    TELL US ABOUT YOUR BACKGROUND (OPTIONAL)
                  </div>
                  <textarea
                    className="sx-input"
                    rows={3}
                    value={form.message}
                    onChange={update('message')}
                    placeholder="Current role, years of experience, target geography, salary expectation…"
                  />
                </div>

                {status === 'error' && serverError && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-lg text-sm"
                    style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.25)', color: '#b91c1c' }}
                  >
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end mt-2">
                  <button type="submit" disabled={status === 'loading'} className="sx-btn sx-btn-dark" style={{ minWidth: 220 }}>
                    {status === 'loading' ? (
                      <><Loader2 size={14} className="animate-spin" /> Sending…</>
                    ) : (
                      <>Book Career Consultation <Arrow /></>
                    )}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
    </section>
  );
}

function Field({ label, placeholder, value, onChange, required, type = 'text' }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="sx-mono" style={{ color: 'var(--sx-ink-3)' }}>{label.toUpperCase()}</span>
      <input
        className="sx-input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
