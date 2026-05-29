import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import SpanbixLayout from '@/components/spanbix/SpanbixLayout';
import PageHero from '@/components/spanbix/redesign/PageHero';
import FinalCta from '@/components/spanbix/redesign/sections/FinalCta';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import useScrollReveal from '@/components/spanbix/redesign/useScrollReveal';
import useSEO from '@/hooks/useSEO';
import { SPANBIX_SITE, breadcrumbLd } from '@/lib/spanbixSeo';
import { getPublicWebsite, submitPublicLead } from '@/api/public';
import { getOrCreateSession } from '@/lib/analytics';

const LANES = [
  {
    t: "I'm a student / fresh grad",
    b: '30-minute career strategist call. We map the right ERP track, give you an honest placement timeline, and tell you straight if Spanbix is the wrong fit.',
    image: '/spanbix/STUDENT-CONSULTATION.png',
    eta: 'Response in 1 business day',
  },
  {
    t: "I'm a working professional",
    b: 'Career-switch consultation. Bring your background, target salary, and geography. We map your fastest path into ERP roles.',
    image: '/spanbix/PROFESSIONAL-PIVOT.png',
    eta: 'Response in 1 business day',
  },
  {
    t: "I'm a placement head / college",
    b: 'Institutional walkthrough with the Campus team. We align curriculum, cohort size, and placement strategy to your academic calendar.',
    image: '/spanbix/CAMPUS%20PARTNERSHIP.png',
    eta: 'Response within 24 hours',
  },
];

const COORDINATES = [
  { icon: Mail,    label: 'Email',     value: 'contact@spanbix.com' },
  { icon: Phone,   label: 'Phone',     value: '+91 93107 93790' },
  {
    icon: MapPin,
    label: 'Office',
    value:
      'Galaxy Blue Sapphire Plaza, 1105,\nGreater Noida West Link Rd, Sector 4,\nGhaziabad, Greater Noida,\nUttar Pradesh — 201009',
  },
  { icon: Clock,   label: 'Hours',     value: 'Mon–Sat · 10AM – 7PM IST' },
];

const AUDIENCES = ['Student', 'Working professional', 'College / T&P office'];
const INTERESTS = ['SAP FICO', 'SAP MM', 'SAP SD', 'SAP ABAP', 'Not sure yet'];

export default function SpanbixContact() {
  useSEO({
    title: `Contact — ${SPANBIX_SITE.name}`,
    description:
      'Talk to a Spanbix career strategist. 30-minute consultation for students, working professionals, or institutional partnerships.',
    keywords: ['contact Spanbix', 'ERP career consultation', 'campus partnership inquiry'],
    canonical: `${SPANBIX_SITE.url}/contact`,
    ogImage: SPANBIX_SITE.logo,
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', url: `${SPANBIX_SITE.url}/` },
        { name: 'Contact', url: `${SPANBIX_SITE.url}/contact` },
      ]),
    ],
  });
  useScrollReveal();

  return (
    <SpanbixLayout>
      <PageHero
        eyebrow="Talk To Spanbix"
        title={<>30 minutes with a strategist. <em>Then you decide.</em></>}
        subtitle="Share your background — degree, geography, current role, target salary. We'll map the right ERP track, give you an honest placement timeline, and tell you straight if Spanbix isn't the right fit."
      />

      <ContactForm />

      {/* Audience lanes */}
      <section
        className="sx-section sx-section-paper"
        style={{ paddingTop: 'clamp(32px, 4vw, 56px)', paddingBottom: 'clamp(40px, 5vw, 72px)' }}
      >
        <div className="sx-container">
          <div className="sx-section-head">
            <div className="sx-stack-md">
              <span className="sx-eyebrow">Who Should I Be Talking To?</span>
              <h2 className="sx-display sx-h2 sx-reveal">
                Three doors. Pick the one that <em>fits your stage</em>.
              </h2>
            </div>
            <p className="sx-lead sx-reveal">
              Different inquiries route to different teams. Picking the right lane gets you the
              right strategist faster.
            </p>
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {LANES.map((l, i) => (
              <article
                key={l.t}
                className="sx-reveal overflow-hidden flex flex-col"
                style={{
                  background: 'var(--sx-white)',
                  border: '1px solid var(--sx-hairline)',
                  borderRadius: 14,
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--sx-cream-50)' }}>
                  <img
                    src={l.image}
                    alt={l.t}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h4 style={{ fontFamily: 'var(--sx-serif)', fontSize: 22, color: 'var(--sx-navy)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
                    {l.t}
                  </h4>
                  <p style={{ color: 'var(--sx-ink-3)', fontSize: 14.5, lineHeight: 1.55, margin: '0 0 14px' }}>{l.b}</p>
                  <div className="sx-mono" style={{ color: 'var(--sx-ink-4)' }}>{l.eta.toUpperCase()}</div>
                  <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                    <a
                      href="#contact-form"
                      className="sx-btn sx-btn-dark"
                      style={{ justifyContent: 'center', width: '100%' }}
                    >
                      Start The Conversation <Arrow />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FinalCta />
    </SpanbixLayout>
  );
}

function ContactForm() {
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
                        <div style={{ fontSize: 14.5, color: '#fff', fontWeight: 500, marginTop: 3, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
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
                  allowFullScreen=""
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
