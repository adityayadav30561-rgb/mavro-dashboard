'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Centered cohort-launch banner.
//
// Trigger contract (locked):
//   - Appears centered on first visit, brief ~400ms delay after mount so it
//     doesn't fight the LCP paint.
//   - Dismissed via the × icon OR the "Maybe later" button.
//   - Dismissal writes a timestamp to localStorage under DISMISS_KEY.
//   - Re-shown after 24 hours from last dismissal.
//   - Bumping DISMISS_KEY (suffix the version) invalidates every existing
//     dismissal next time the user loads the site.

const DISMISS_KEY = 'spanbix-cohort-banner-dismissed-2';
const SUPPRESS_MS = 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 400;

function CloseGlyph({ size = 16 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowGlyph({ size = 14 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function shouldShowFromStorage() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return true;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true;
    return Date.now() - ts > SUPPRESS_MS;
  } catch {
    // Private browsing / disabled storage — fall back to "show every visit"
    // rather than silently hide. Edge-case okay.
    return true;
  }
}

export default function CohortBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShowFromStorage()) return;
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Lock body scroll while the modal is open. Restore on close / unmount.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc closes (UX standard for modals).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignored — see shouldShowFromStorage()
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="spanbix-cohort-banner-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(16px, 4vw, 32px)',
        background: 'rgba(5, 13, 31, 0.62)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'sx-cohort-fade-in 200ms ease-out',
      }}
      onClick={(e) => {
        // Click on the backdrop (not the card) dismisses.
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <style>{`
        @keyframes sx-cohort-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes sx-cohort-rise {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        className="spanbix-scope"
        style={{
          position: 'relative',
          width: 'min(520px, 100%)',
          background: '#FFFFFF',
          color: 'var(--sx-ink-1, #0b1730)',
          borderRadius: 18,
          padding: 'clamp(28px, 4vw, 36px)',
          boxShadow: '0 30px 90px -20px rgba(7, 22, 50, 0.45)',
          border: '1px solid rgba(11, 23, 48, 0.08)',
          animation: 'sx-cohort-rise 280ms cubic-bezier(0.2, 0.7, 0.2, 1.05)',
          fontFamily: 'var(--sx-sans, "Geist", "Sora", system-ui, sans-serif)',
        }}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close announcement"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            display: 'inline-grid',
            placeItems: 'center',
            borderRadius: 999,
            background: 'rgba(11, 23, 48, 0.06)',
            border: 'none',
            color: 'rgba(11, 23, 48, 0.6)',
            cursor: 'pointer',
            transition: 'background 160ms ease, color 160ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(11, 23, 48, 0.12)';
            e.currentTarget.style.color = 'rgba(11, 23, 48, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(11, 23, 48, 0.06)';
            e.currentTarget.style.color = 'rgba(11, 23, 48, 0.6)';
          }}
        >
          <CloseGlyph size={16} />
        </button>

        <span
          className="sx-eyebrow"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 12px',
            borderRadius: 999,
            background: 'var(--sx-citron, #D4F04A)',
            color: 'var(--sx-citron-ink, #0b1730)',
            fontSize: 11,
            letterSpacing: '0.14em',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontFamily: 'var(--sx-mono, "JetBrains Mono", ui-monospace, monospace)',
            marginBottom: 18,
          }}
        >
          New Cohort · Enrolments Open
        </span>

        <h2
          id="spanbix-cohort-banner-title"
          style={{
            fontFamily: 'var(--sx-serif, "Instrument Serif", "DM Serif Display", Georgia, serif)',
            fontSize: 'clamp(30px, 4.6vw, 40px)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            margin: '0 0 18px',
            color: 'var(--sx-navy, #0b1730)',
          }}
        >
          Batch starts <span style={{ fontStyle: 'italic' }}>15 June 2026.</span>
        </h2>

        <div
          style={{
            display: 'grid',
            gap: 12,
            padding: '16px 0',
            borderTop: '1px solid rgba(11, 23, 48, 0.10)',
            borderBottom: '1px solid rgba(11, 23, 48, 0.10)',
            marginBottom: 18,
          }}
        >
          <Row icon="📅" label="STARTS" value="Monday · 15 June 2026" />
          <Row icon="🎯" label="TRACKS OPEN" value="SAP FICO · MM · SD · ABAP" />
          <Row icon="🪑" label="SEATS" value="Limited · cohort-capped" />
        </div>

        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.55,
            color: 'rgba(11, 23, 48, 0.72)',
            margin: '0 0 22px',
          }}
        >
          Reserve a seat before the cohort fills. 30-minute consultation to map
          the right track for your background.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <Link
            href="/contact"
            onClick={dismiss}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 999,
              background: 'var(--sx-navy, #0b1730)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '-0.005em',
              transition: 'transform 160ms ease, box-shadow 160ms ease',
              boxShadow: '0 14px 34px -10px rgba(11, 23, 48, 0.45)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Book Consultation <ArrowGlyph size={14} />
          </Link>

          <button
            type="button"
            onClick={dismiss}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              color: 'rgba(11, 23, 48, 0.6)',
              border: 'none',
              fontSize: 13.5,
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: '-0.005em',
              transition: 'color 160ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(11, 23, 48, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(11, 23, 48, 0.6)';
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span
        style={{
          width: 42,
          height: 42,
          flexShrink: 0,
          display: 'inline-grid',
          placeItems: 'center',
          fontSize: 20,
          borderRadius: 12,
          background: 'rgba(212, 240, 74, 0.18)',
          border: '1px solid rgba(212, 240, 74, 0.55)',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--sx-mono, "JetBrains Mono", ui-monospace, monospace)',
            fontSize: 11,
            letterSpacing: '0.12em',
            color: 'rgba(11, 23, 48, 0.5)',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 14.5, color: 'var(--sx-navy, #0b1730)', fontWeight: 500 }}>
          {value}
        </span>
      </div>
    </div>
  );
}
