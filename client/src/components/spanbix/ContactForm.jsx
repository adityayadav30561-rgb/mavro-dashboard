import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle2, AlertCircle, Phone, Mail, Calendar } from 'lucide-react';
import { getPublicWebsite, submitPublicLead } from '@/api/public';
import Section from './Section';
import { cn } from '@/lib/utils';
import { getOrCreateSession } from '@/lib/analytics';
import { SPANBIX_BRAND, SPANBIX_SITE } from '@/lib/spanbixSeo';

const interestOptions = [
  'SAP FICO',
  'SAP MM',
  'SAP SD',
  'SAP ABAP',
  'Not sure yet',
];

const audienceOptions = [
  { value: 'student', label: 'Student' },
  { value: 'professional', label: 'Working professional' },
  { value: 'campus', label: 'College / T&P office' },
];

export default function ContactForm({ embedded = false }) {
  const [websiteId, setWebsiteId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    audience: '',
    interest: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    getPublicWebsite(SPANBIX_SITE.slug)
      .then((res) => setWebsiteId(res?.data?.data?.website?._id))
      .catch(() => {});
  }, []);

  const handleChange = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (!/^[a-zA-Z\s.\-']+$/.test(form.name.trim())) e.name = "Letters, spaces, .-' only";
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Invalid email';
    if (form.phone && form.phone.length > 20) e.phone = 'Too long';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!websiteId) {
      setServerError('Connecting to the platform… please try again in a moment.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setServerError('');
    try {
      const meta = [
        form.audience ? `Audience: ${form.audience}` : null,
        form.interest ? `Interest: ${form.interest}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      const message = (form.message + (meta ? `\n\n[${meta}]` : '')).trim();

      await submitPublicLead({
        website: websiteId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        message: message || undefined,
        sourcePage: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        sessionId: getOrCreateSession(),
        formId: 'spanbix-contact',
      });
      // No client-side trackFormSubmit — backend emits the canonical form_submit
      // event on Lead.create() so Leads count and AnalyticsEvent count stay in sync.
      setStatus('success');
      setForm({ name: '', email: '', phone: '', company: '', audience: '', interest: '', message: '' });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        'Submission failed. Please try again.';
      setServerError(msg);
      setStatus('error');
    }
  };

  const formInner = (
    <div className="grid lg:grid-cols-12 gap-10 items-start">
      {/* Left: intro panels */}
      <div className="lg:col-span-5 space-y-5">
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${SPANBIX_BRAND.border}`,
            boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 8px 24px -16px rgba(16,44,86,0.08)',
          }}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: SPANBIX_BRAND.accent }} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] font-sora" style={{ color: SPANBIX_BRAND.accent }}>
              Career Consultation
            </p>
          </div>
          <h3 className="mt-3 font-serif text-[20px] tracking-tight" style={{ color: SPANBIX_BRAND.navy }}>
            A 30-minute call with a career strategist
          </h3>
          <p className="mt-3 text-[13.5px] leading-relaxed font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
            Walk through your background, target geography, and salary expectation. We map a
            realistic SAP track and a placement plan — not a sales pitch.
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${SPANBIX_BRAND.border}`,
            boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 8px 24px -16px rgba(16,44,86,0.08)',
          }}
        >
          <div className="flex items-center gap-2">
            <Phone size={16} style={{ color: SPANBIX_BRAND.accent }} />
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] font-sora" style={{ color: SPANBIX_BRAND.accent }}>
              Talk to admissions
            </p>
          </div>
          <h3 className="mt-3 font-serif text-[20px] tracking-tight" style={{ color: SPANBIX_BRAND.navy }}>
            Prefer a direct call?
          </h3>
          <p className="mt-3 text-[13.5px] leading-relaxed font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
            Reach us at <span className="font-mono">hello@spanbix.com</span> or drop your phone in
            the form — we'll call back within a working day.
          </p>
          <a
            href="mailto:hello@spanbix.com"
            className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold font-sora"
            style={{ color: SPANBIX_BRAND.accent }}
          >
            <Mail size={14} />
            hello@spanbix.com
          </a>
        </div>
      </div>

      {/* Right: form */}
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="lg:col-span-7 relative rounded-2xl p-7 md:p-9"
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${SPANBIX_BRAND.border}`,
          boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 12px 32px -16px rgba(16,44,86,0.12)',
        }}
      >
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center z-10 p-8"
              style={{ backgroundColor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)' }}
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  backgroundColor: 'rgba(22,163,74,0.10)',
                  border: '1px solid rgba(22,163,74,0.40)',
                }}
              >
                <CheckCircle2 size={32} color="#16a34a" />
              </motion.div>
              <h3 className="font-serif text-[22px] tracking-tight" style={{ color: SPANBIX_BRAND.navy }}>
                Consultation request received
              </h3>
              <p className="mt-2 text-[14px] font-sora max-w-sm" style={{ color: SPANBIX_BRAND.textMuted }}>
                A career strategist will reach out within a working day to schedule your call.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-6 px-5 py-2.5 rounded-md text-[13px] font-semibold font-sora text-white"
                style={{ backgroundColor: SPANBIX_BRAND.navy }}
              >
                Send another
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" required value={form.name} onChange={handleChange('name')} error={errors.name} placeholder="Priya Sharma" />
          <Field label="Email" required type="email" value={form.email} onChange={handleChange('email')} error={errors.email} placeholder="priya@example.com" />
          <Field label="Phone" value={form.phone} onChange={handleChange('phone')} error={errors.phone} placeholder="+91 98XXXXXXXX" />
          <Field label="Company / College (optional)" value={form.company} onChange={handleChange('company')} placeholder="Tata Consultancy Services" />
        </div>

        <div className="mt-5">
          <FieldLabel>I am a</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {audienceOptions.map((a) => {
              const active = form.audience === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, audience: a.value }))}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-[12px] font-medium font-sora border transition-all'
                  )}
                  style={{
                    backgroundColor: active ? 'rgba(39,100,228,0.10)' : '#f5f8ff',
                    borderColor: active ? SPANBIX_BRAND.accent : SPANBIX_BRAND.border,
                    color: active ? SPANBIX_BRAND.accent : SPANBIX_BRAND.textMuted,
                  }}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel>Interested track</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((t) => {
              const active = form.interest === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, interest: t }))}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-medium font-sora border transition-all"
                  style={{
                    backgroundColor: active ? 'rgba(39,100,228,0.10)' : '#f5f8ff',
                    borderColor: active ? SPANBIX_BRAND.accent : SPANBIX_BRAND.border,
                    color: active ? SPANBIX_BRAND.accent : SPANBIX_BRAND.textMuted,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <FieldLabel>Tell us about your background (optional)</FieldLabel>
          <textarea
            rows={4}
            value={form.message}
            onChange={handleChange('message')}
            placeholder="Current role, years of experience, target geography, salary expectation…"
            className="w-full px-4 py-3 rounded-lg text-[13.5px] font-sora outline-none transition-all resize-none"
            style={{
              backgroundColor: '#f5f8ff',
              border: `1px solid ${SPANBIX_BRAND.border}`,
              color: SPANBIX_BRAND.textDark,
            }}
          />
        </div>

        {status === 'error' && serverError && (
          <div
            className="mt-4 flex items-center gap-2 p-3 rounded-lg text-[12px] font-sora"
            style={{ backgroundColor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.30)', color: '#b91c1c' }}
          >
            <AlertCircle size={14} />
            {serverError}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-[14px] font-semibold font-sora text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_14px_30px_-12px_rgba(39,100,228,0.55)]"
            style={{ backgroundColor: SPANBIX_BRAND.accent }}
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                Book Career Consultation
                <Send size={14} />
              </>
            )}
          </button>
          <a
            href="mailto:hello@spanbix.com"
            className="px-5 py-3 rounded-md text-[13.5px] font-semibold font-sora transition-colors"
            style={{ color: SPANBIX_BRAND.textMuted }}
          >
            Contact Sales
          </a>
        </div>
      </motion.form>
    </div>
  );

  if (embedded) return formInner;

  return (
    <Section
      id="contact"
      tone="cream"
      caption="Talk To Us"
      title="Map your SAP track in one conversation."
      subtitle="Working professional, fresh graduate, or placement head exploring a campus partnership — pick the lane below. A Spanbix team member reaches back within a working day. No automated chatbots, no scripted scripts."
    >
      {formInner}
    </Section>
  );
}

function FieldLabel({ children }) {
  return (
    <label
      className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] font-sora mb-2"
      style={{ color: SPANBIX_BRAND.textMuted }}
    >
      {children}
    </label>
  );
}

function Field({ label, required, value, onChange, error, placeholder, type = 'text' }) {
  return (
    <div>
      <FieldLabel>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </FieldLabel>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg text-[13.5px] font-sora outline-none transition-all"
        style={{
          backgroundColor: '#f5f8ff',
          border: `1px solid ${error ? '#dc2626' : SPANBIX_BRAND.border}`,
          color: SPANBIX_BRAND.textDark,
        }}
      />
      {error && (
        <p className="mt-1 text-[11px] font-sora" style={{ color: '#dc2626' }}>
          {error}
        </p>
      )}
    </div>
  );
}
