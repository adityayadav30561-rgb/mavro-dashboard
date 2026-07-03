'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Arrow } from '@/components/spanbix/redesign/Arrow';
import { SPANBIX_SITE } from '@/lib/spanbixSeo';
import { getPublicWebsite, submitPublicLead } from '@/api/public';
import { getOrCreateSession } from '@/lib/analytics';
import { getAttribution } from '@/lib/attribution';
import ConsentCheckbox, { CONSENT_RECORD } from '@/components/spanbix/ConsentCheckbox';
import Honeypot from '@/components/spanbix/Honeypot';

// CampusVisitForm — lead-capture component for /campus-visit.
//
// Shared 1-to-1 with college campuses (T&P offices, student WhatsApp groups).
// Same cream single-column card language as /enquire, plus a campus line-art
// illustration and a custom date+time picker so attendees can pick a session
// slot the way they would on any booking site.
//
// FORM ID DISCIPLINE
// ──────────────────
// `formId: 'spanbix-campus'` is the attribution mechanism. Backend Lead schema
// indexes `formId`; admin Leads UI filters by it and auto-renders every
// customFields key (college / preferredDate / preferredTime) as its own cell.
// Do NOT change this string without updating admin saved-filters.
//
// Email stays on the form even though the share brief only asked for four
// fields — the Lead schema requires it and the silent 10-minute dedup window
// keys on email + website.

const FORM_ID = 'spanbix-campus';
const SOURCE_TAG = 'campus-share';

const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MAX_DAYS_AHEAD = 90;

const pad2 = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function formatDisplay(key) {
  if (!key) return '';
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CampusVisitForm() {
  const [websiteId, setWebsiteId] = useState(null);
  const [form, setForm] = useState({ name: '', college: '', phone: '', email: '' });
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [hp, setHp] = useState('');
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
    if (hp.trim()) { setStatus('success'); return; }
    if (!form.name.trim() || !form.college.trim() || !form.phone.trim() || !form.email.trim()) {
      setServerError('Name, college, mobile number, and email are required.');
      setStatus('error');
      return;
    }
    if (!date || !time) {
      setServerError('Please pick a preferred date and time slot.');
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
        company: form.college.trim(),
        customFields: {
          source: SOURCE_TAG,
          college: form.college.trim(),
          preferredDate: date,
          preferredTime: time,
          preferredSlot: `${formatDisplay(date)} · ${time}`,
          consent: CONSENT_RECORD,
          ...getAttribution(),
        },
        sourcePage: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        sessionId: getOrCreateSession(),
        formId: FORM_ID,
      });
      setStatus('success');
      setForm({ name: '', college: '', phone: '', email: '' });
      setDate('');
      setTime('');
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
          <CampusIllustration />
          <span
            className="sx-eyebrow"
            style={{ display: 'inline-block', marginBottom: 14, color: 'var(--sx-navy, #0b1730)' }}
          >
            CAMPUS SESSION
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
            Book your <em>campus session</em>.
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
            Tell us who&apos;s attending and pick a date and time that works for you —
            the Spanbix team will confirm your slot within one business day.
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
                <div style={{ fontWeight: 600, fontSize: 15 }}>You&apos;re on the list.</div>
                <div style={{ fontSize: 13.5, marginTop: 4, color: 'var(--sx-ink-2, #1f2c4d)' }}>
                  The Spanbix team will confirm your session slot within one business
                  day. Keep an eye on your phone + inbox.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
              >
                <Field label="Name of person attending *" placeholder="Priya Sharma" value={form.name} onChange={update('name')} required />
                <Field label="College Name *" placeholder="IIMT College of Engineering" value={form.college} onChange={update('college')} required />
                <Field label="Mobile Number *" placeholder="+91 98XXXXXXXX" value={form.phone} onChange={update('phone')} required type="tel" />
                <Field label="Email *" placeholder="priya@example.com" value={form.email} onChange={update('email')} required type="email" />
              </div>

              <div>
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4, #5d6a8a)', marginBottom: 8 }}>
                  PREFERRED DATE *
                </div>
                <DatePicker value={date} onChange={setDate} />
              </div>

              <div>
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4, #5d6a8a)', marginBottom: 8 }}>
                  PREFERRED TIME *
                </div>
                <div className="sx-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      className={time === t ? 'sx-role-chip active' : 'sx-role-chip'}
                    >
                      <Clock size={12} style={{ marginRight: 6, verticalAlign: '-1px', display: 'inline' }} />
                      {t}
                    </button>
                  ))}
                </div>
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

              <Honeypot value={hp} onChange={(e) => setHp(e.target.value)} />

              <ConsentCheckbox checked={consent} onChange={(e) => setConsent(e.target.checked)} error={status === 'error' && !consent} />

              <div className="flex items-center justify-end mt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="sx-btn sx-btn-dark"
                  style={{ minWidth: 220 }}
                >
                  {status === 'loading' ? (
                    <><Loader2 size={14} className="animate-spin" /> Booking…</>
                  ) : (
                    <>Book My Slot <Arrow /></>
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

/**
 * DatePicker — dependency-free calendar popover.
 *
 * Click the trigger → month grid opens. Past dates and dates beyond
 * MAX_DAYS_AHEAD are disabled. Value round-trips as `YYYY-MM-DD` (goes to
 * customFields.preferredDate); the trigger shows a human-readable form.
 * Closes on select, outside click, and Escape.
 */
function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + MAX_DAYS_AHEAD);
    return d;
  }, [today]);
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const firstOfMonth = new Date(view.y, view.m, 1);
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const canGoPrev = new Date(view.y, view.m, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoNext = new Date(view.y, view.m + 1, 1) <= maxDate;

  const shiftMonth = (delta) => {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const cells = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(view.y, view.m, d));

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="sx-input"
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          color: value ? 'var(--sx-navy, #0b1730)' : 'rgba(11, 23, 48, 0.42)',
        }}
      >
        <CalendarDays size={16} style={{ color: 'var(--sx-ink-4, #5d6a8a)', flexShrink: 0 }} />
        {value ? formatDisplay(value) : 'Pick a date'}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          style={{
            position: 'absolute',
            zIndex: 40,
            top: 'calc(100% + 8px)',
            left: 0,
            width: 'min(320px, 100%)',
            background: 'var(--sx-white, #ffffff)',
            border: '1px solid rgba(11, 23, 48, 0.12)',
            borderRadius: 14,
            padding: 14,
            boxShadow: '0 24px 60px -18px rgba(16, 44, 86, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <NavBtn disabled={!canGoPrev} onClick={() => shiftMonth(-1)} label="Previous month">
              <ChevronLeft size={16} />
            </NavBtn>
            <span
              style={{
                fontFamily: 'var(--sx-sans, "Geist", system-ui, sans-serif)',
                fontWeight: 600,
                fontSize: 14,
                color: 'var(--sx-navy, #0b1730)',
              }}
            >
              {MONTHS[view.m]} {view.y}
            </span>
            <NavBtn disabled={!canGoNext} onClick={() => shiftMonth(1)} label="Next month">
              <ChevronRight size={16} />
            </NavBtn>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="sx-mono"
                style={{ textAlign: 'center', fontSize: 10, padding: '4px 0', color: 'var(--sx-ink-4, #5d6a8a)' }}
              >
                {w}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={`b-${i}`} />;
              const key = toKey(d);
              const disabled = d < today || d > maxDate;
              const isSelected = key === value;
              const isToday = key === toKey(today);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(key); setOpen(false); }}
                  style={{
                    height: 34,
                    borderRadius: 8,
                    border: isToday && !isSelected ? '1px solid rgba(11, 23, 48, 0.25)' : '1px solid transparent',
                    fontFamily: 'var(--sx-sans, "Geist", system-ui, sans-serif)',
                    fontSize: 13,
                    cursor: disabled ? 'default' : 'pointer',
                    background: isSelected ? 'var(--sx-navy, #0b1730)' : 'transparent',
                    color: isSelected
                      ? 'var(--sx-citron, #e8f36a)'
                      : disabled
                        ? 'rgba(11, 23, 48, 0.22)'
                        : 'var(--sx-navy, #0b1730)',
                    fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ disabled, onClick, label, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 8,
        border: '1px solid rgba(11, 23, 48, 0.12)',
        background: 'transparent',
        color: disabled ? 'rgba(11, 23, 48, 0.2)' : 'var(--sx-navy, #0b1730)',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

/** Campus line-art: college building + flag + graduation cap, navy strokes with a citron accent. */
function CampusIllustration() {
  return (
    <svg
      viewBox="0 0 240 110"
      width="200"
      height="92"
      aria-hidden="true"
      style={{ display: 'block', margin: '0 auto 6px' }}
    >
      <g stroke="var(--sx-navy, #0b1730)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* main hall */}
        <path d="M60 98V58h120v40" />
        <path d="M52 58L120 26l68 32" />
        {/* pillars */}
        <path d="M84 98V70M108 98V70M132 98V70M156 98V70" />
        {/* steps */}
        <path d="M48 98h144" />
        {/* door arch */}
        <path d="M112 98v-16a8 8 0 0 1 16 0v16" />
        {/* flag pole */}
        <path d="M120 26V8" />
      </g>
      {/* flag */}
      <path d="M120 8h24l-6 6 6 6h-24z" fill="var(--sx-citron, #e8f36a)" stroke="var(--sx-navy, #0b1730)" strokeWidth="2" strokeLinejoin="round" />
      {/* graduation cap, floating left of the hall */}
      <g stroke="var(--sx-navy, #0b1730)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 46l22-9 22 9-22 9z" fill="var(--sx-citron, #e8f36a)" />
        <path d="M25 51v9c0 3 5 6 11 6s11-3 11-6v-9" />
        <path d="M58 46v13" />
      </g>
      {/* sparkle accents */}
      <g stroke="var(--sx-navy, #0b1730)" strokeWidth="2" strokeLinecap="round">
        <path d="M210 30v10M205 35h10" />
        <path d="M196 60v6M193 63h6" />
      </g>
    </svg>
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
