import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { GitBranch, ArrowRight, AlertTriangle } from 'lucide-react';
import { fetchPublicRoutingForm, evaluatePublicRoutingForm } from '../api/scheduler';

// ════════════════════════════════════════════════════════════════════════════
// PublicRoutingPage — invitee-facing intake → redirect
// ════════════════════════════════════════════════════════════════════════════
// Route: /route/:slug
//   1. fetch form metadata
//   2. render questions
//   3. POST answers → backend evaluates → returns { target }
//   4. redirect:
//        - event_type → /book/<eventTypeSlug>
//        - url        → external URL
// ════════════════════════════════════════════════════════════════════════════

function resolveTenantSlug(searchParams) {
  const target = import.meta.env.VITE_BUILD_TARGET;
  if (target && target !== 'full') return target;
  return searchParams.get('tenant') || '';
}

export default function PublicRoutingPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const tenantSlug = resolveTenantSlug(searchParams);

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [evalError, setEvalError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPublicRoutingForm(slug, tenantSlug);
        if (cancelled) return;
        setForm((res.data || res).form);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, tenantSlug]);

  const update = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setEvalError(null);
    try {
      const res = await evaluatePublicRoutingForm(slug, tenantSlug, answers);
      const target = (res.data || res).target;
      if (!target) {
        setEvalError("Sorry, we couldn't find a meeting type that matches your answers. Please contact us directly.");
        return;
      }
      if (target.type === 'event_type') {
        const bookingPath = tenantSlug
          ? `/${tenantSlug}/book/${target.eventTypeSlug}`
          : `/book/${target.eventTypeSlug}`;
        window.location.href = bookingPath;
      } else if (target.type === 'url' && target.url) {
        window.location.href = target.url;
      }
    } catch (err) {
      setEvalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Shell><div className="text-sm text-muted-foreground">Loading…</div></Shell>;
  }
  if (error || !form) {
    return <Shell>
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-sm text-rose-500">
        <AlertTriangle size={14} className="inline mr-1" /> {error || 'Routing form not found'}
      </div>
    </Shell>;
  }

  return (
    <Shell>
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-medium mb-2">
        <GitBranch size={12} className="inline mr-1" /> Quick intake
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{form.name}</h1>
      {form.description && <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{form.description}</p>}

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-4">
        {form.questions.map((q) => (
          <QuestionField key={q.key} q={q} value={answers[q.key]} onChange={(v) => update(q.key, v)} />
        ))}
        {evalError && (
          <div className="px-3 py-2 rounded-md border border-rose-500/30 bg-rose-500/5 text-sm text-rose-500">{evalError}</div>
        )}
        <button type="submit" disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition">
          {submitting ? 'Routing…' : <>Continue <ArrowRight size={14} /></>}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-10">{children}</div>
    </div>
  );
}

function QuestionField({ q, value, onChange }) {
  const required = !!q.isRequired;
  if (q.type === 'long_text') {
    return <Field label={q.label} hint={q.helpText} required={required}>
      <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder} required={required} rows={3}
        className="w-full text-sm rounded-md border border-border bg-background px-3 py-2" />
    </Field>;
  }
  if (q.type === 'select') {
    return <Field label={q.label} hint={q.helpText} required={required}>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full text-sm rounded-md border border-border bg-background px-3 py-2">
        <option value="">{q.placeholder || 'Choose…'}</option>
        {(q.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>;
  }
  if (q.type === 'multi_select') {
    const arr = Array.isArray(value) ? value : [];
    const toggle = (opt) => onChange(arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
    return <Field label={q.label} hint={q.helpText} required={required}>
      <div className="flex flex-wrap gap-1.5">
        {(q.options || []).map((opt) => (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-md border text-xs transition ${arr.includes(opt) ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-border'}`}>
            {opt}
          </button>
        ))}
      </div>
    </Field>;
  }
  if (q.type === 'boolean') {
    return <Field label={q.label} hint={q.helpText} required={required}>
      <div className="flex gap-2">
        {['Yes', 'No'].map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt === 'Yes')}
            className={`px-3 py-1.5 rounded-md border text-xs transition ${(value === true && opt === 'Yes') || (value === false && opt === 'No') ? 'border-brand-500 text-brand-500 bg-brand-500/5' : 'border-border'}`}>
            {opt}
          </button>
        ))}
      </div>
    </Field>;
  }
  if (q.type === 'number') {
    return <Field label={q.label} hint={q.helpText} required={required}>
      <input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={q.placeholder} required={required}
        className="w-full text-sm rounded-md border border-border bg-background px-3 py-2" />
    </Field>;
  }
  return <Field label={q.label} hint={q.helpText} required={required}>
    <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder} required={required}
      className="w-full text-sm rounded-md border border-border bg-background px-3 py-2" />
  </Field>;
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground">{label}{required && <span className="text-rose-500"> *</span>}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="block mt-1 text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
