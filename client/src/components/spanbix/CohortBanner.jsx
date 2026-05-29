import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Target, Armchair, X } from 'lucide-react';
import { withSpanbixBase } from '@/lib/routeBase';
import { trackCtaClick } from '@/lib/analytics';
import { Arrow } from './redesign/Arrow';

// Cohort-launch popup. Centers a banner on first visit. Dismiss via close button
// or "Maybe later" → suppressed for 24h via localStorage. Bump STORAGE_KEY when
// the cohort copy changes so old dismissals invalidate cleanly.

const STORAGE_KEY = 'spanbix-cohort-banner-dismissed-1';
const SUPPRESS_HOURS = 24;
const APPEAR_DELAY_MS = 600;

function isDismissed() {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    const ageHours = (Date.now() - ts) / (1000 * 60 * 60);
    return ageHours < SUPPRESS_HOURS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // localStorage may be blocked (Safari private mode etc.) — fail silently
  }
}

export default function CohortBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isDismissed()) return;
    const t = setTimeout(() => setOpen(true), APPEAR_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC key closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    markDismissed();
    setOpen(false);
  };

  const handleCta = () => {
    trackCtaClick('Cohort Banner — Book Consultation', { location: 'cohort-popup' });
    markDismissed();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cohort-banner-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cohort-banner-heading"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(5, 13, 31, 0.62)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            padding: 'clamp(16px, 4vw, 32px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 480,
              background: 'var(--sx-navy)',
              color: '#fff',
              borderRadius: 18,
              padding: 'clamp(22px, 4vw, 32px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55)',
              overflow: 'hidden',
            }}
          >
            {/* Subtle grid bg pattern */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                opacity: 0.7,
              }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close cohort announcement"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 34,
                height: 34,
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.85)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                zIndex: 2,
              }}
            >
              <X size={16} />
            </button>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Eyebrow pill */}
              <span
                className="sx-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'var(--sx-citron)',
                  color: 'var(--sx-citron-ink)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: 'var(--sx-citron-ink)',
                  }}
                />
                NEW COHORT · ENROLMENTS OPEN
              </span>

              <h2
                id="cohort-banner-heading"
                style={{
                  fontFamily: 'var(--sx-serif)',
                  fontSize: 'clamp(28px, 5vw, 38px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  margin: '16px 0 0',
                  color: '#fff',
                }}
              >
                Batch starts <em style={{ color: 'var(--sx-citron)', fontStyle: 'italic' }}>8 June 2026</em>.
              </h2>

              <div
                style={{
                  margin: '22px 0',
                  paddingTop: 18,
                  paddingBottom: 18,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'grid',
                  gap: 14,
                }}
              >
                <BannerRow Icon={Calendar} label="STARTS" value="Monday · 8 June 2026" />
                <BannerRow Icon={Target} label="TRACKS OPEN" value="SAP FICO · MM · SD · ABAP" />
                <BannerRow Icon={Armchair} label="SEATS" value="Limited · cohort-capped" />
              </div>

              <p
                style={{
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.72)',
                  fontSize: 14.5,
                  lineHeight: 1.55,
                }}
              >
                Reserve a seat before the cohort fills. 30-minute consultation to map the right track for your background.
              </p>

              <div
                className="flex items-center"
                style={{
                  marginTop: 22,
                  gap: 14,
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}
              >
                <Link
                  to={withSpanbixBase('/contact')}
                  onClick={handleCta}
                  className="sx-btn sx-btn-citron"
                  style={{ flex: '0 1 auto' }}
                >
                  Book Consultation <Arrow />
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: 'var(--sx-sans)',
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: '6px 4px',
                  }}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BannerRow({ Icon, label, value }) {
  return (
    <div className="flex items-center" style={{ gap: 14 }}>
      <span
        className="grid place-items-center shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'var(--sx-citron)',
        }}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <div
          className="sx-mono"
          style={{ color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.12em', fontSize: 10.5 }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 14.5,
            color: '#fff',
            fontWeight: 500,
            marginTop: 3,
            lineHeight: 1.4,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
