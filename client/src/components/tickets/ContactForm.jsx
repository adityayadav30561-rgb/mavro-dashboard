import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getPublicWebsite, submitPublicLead } from '@/api/public';
import EditorialSection from '@/components/hrms/EditorialSection';
import { cn } from '@/lib/utils';
import { getOrCreateSession } from '@/lib/analytics';
import { TICKETS_SITE } from '@/lib/ticketsSeo';

const teamSizes = ['1–10', '11–50', '51–200', '201–500', '500+'];
const ticketVolumes = ['<100/mo', '100–500/mo', '500–2k/mo', '2k–10k/mo', '10k+/mo'];

export default function ContactForm() {
  const [websiteId, setWebsiteId] = useState(null);
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', teamSize: '', ticketVolume: '', message: '',
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    getPublicWebsite(TICKETS_SITE.slug)
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
    else if (!/^[a-zA-Z\s.\-']+$/.test(form.name.trim())) e.name = 'Letters, spaces, .-\' only';
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
      setServerError('Connecting to platform… please try again in a moment.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setServerError('');
    try {
      const messageWithMeta = [
        form.message,
        form.teamSize     ? `[Team size: ${form.teamSize}]`           : '',
        form.ticketVolume ? `[Ticket volume: ${form.ticketVolume}]`   : '',
      ].filter(Boolean).join('\n\n');

      await submitPublicLead({
        website: websiteId,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        message: messageWithMeta.trim() || undefined,
        sourcePage: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        sessionId: getOrCreateSession(),
        formId: 'tickets-contact',
      });
      setStatus('success');
      setForm({ name: '', company: '', email: '', phone: '', teamSize: '', ticketVolume: '', message: '' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Submission failed. Please try again.';
      setServerError(msg);
      setStatus('error');
    }
  };

  return (
    <EditorialSection
      id="contact"
      caption="Get In Touch"
      title="Modernize Your Support Operations"
      subtitle="See how Mavro Ticket Management can centralize your IT support workflows with SLA accountability and operational visibility."
    >
      <div className="grid lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Schedule Demo</p>
            <h3 className="text-xl font-bold mt-2 tracking-tight">A 30-minute operational walkthrough</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              See the platform configured against your real ticket flow — intake channels, routing graph, SLA policy, and escalation ladders.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">Contact Sales</p>
            <h3 className="text-xl font-bold mt-2 tracking-tight">Build a tailored rollout plan</h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              We'll align modules, RBAC scopes, and integration roadmap with your existing operational stack.
            </p>
          </div>
        </div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 relative p-7 md:p-9 rounded-2xl bg-card/75 backdrop-blur-2xl border border-border/70 shadow-[var(--shadow-card)]"
        >
          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-2xl bg-card/95 backdrop-blur-xl flex flex-col items-center justify-center text-center z-10 p-8"
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mb-5 shadow-[0_0_30px_-4px_hsl(160_70%_45%/0.5)]"
                >
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </motion.div>
                <h3 className="text-xl font-bold tracking-tight">Request received</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Our team will reach out shortly to schedule your operational walkthrough.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 px-4 py-2 rounded-lg text-[13px] font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Send another
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" required value={form.name} onChange={handleChange('name')} error={errors.name} placeholder="Aarav Mehta" accent="cyan" />
            <Field label="Company" value={form.company} onChange={handleChange('company')} placeholder="Acme Technologies" accent="cyan" />
            <Field label="Work Email" required type="email" value={form.email} onChange={handleChange('email')} error={errors.email} placeholder="aarav@company.com" accent="cyan" />
            <Field label="Phone" value={form.phone} onChange={handleChange('phone')} error={errors.phone} placeholder="+91 98XXXXXXXX" accent="cyan" />
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <PillGroup
              label="Team Size"
              options={teamSizes}
              value={form.teamSize}
              onSelect={(v) => setForm((f) => ({ ...f, teamSize: v }))}
            />
            <PillGroup
              label="Current Ticket Volume"
              options={ticketVolumes}
              value={form.ticketVolume}
              onSelect={(v) => setForm((f) => ({ ...f, ticketVolume: v }))}
            />
          </div>

          <div className="mt-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">Message</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={handleChange('message')}
              placeholder="Tell us about your support stack, current bottlenecks, and what success looks like."
              className="w-full px-4 py-3 rounded-xl bg-foreground/[0.03] border border-border/70 focus:border-cyan-500/60 focus:bg-foreground/[0.05] outline-none transition-all text-sm placeholder:text-muted-foreground/60 resize-none"
            />
          </div>

          {status === 'error' && serverError && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[12px] text-rose-300">
              <AlertCircle size={14} /> {serverError}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-br from-cyan-500 to-teal-700 text-white shadow-[0_18px_40px_-12px_hsl(192_85%_50%/0.6)] hover:shadow-[0_22px_50px_-12px_hsl(192_85%_50%/0.8)] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {status === 'loading' ? (
                <><Loader2 size={15} className="animate-spin" /> Sending…</>
              ) : (
                <>Schedule Demo <Send size={14} /></>
              )}
            </button>
            <a href="mailto:hello@mavro.com" className="px-5 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              Contact Sales
            </a>
          </div>
        </motion.form>
      </div>
    </EditorialSection>
  );
}

function Field({ label, required, value, onChange, error, placeholder, type = 'text', accent = 'cyan' }) {
  const focus = accent === 'cyan' ? 'focus:border-cyan-500/60' : 'focus:border-violet-500/60';
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-foreground/[0.03] border outline-none transition-all text-sm placeholder:text-muted-foreground/60 focus:bg-foreground/[0.05]',
          error ? 'border-rose-500/60' : `border-border/70 ${focus}`
        )}
      />
      {error && <p className="mt-1 text-[11px] text-rose-400">{error}</p>}
    </div>
  );
}

function PillGroup({ label, options, value, onSelect }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onSelect(t)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all',
              value === t
                ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                : 'bg-foreground/[0.03] border-border/70 text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
