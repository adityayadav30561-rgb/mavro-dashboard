import { Check, FileText, Network, Handshake, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Section from './Section';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

/**
 * 3-step placement support section — Spanbix's answer to the "how do graduates
 * actually get placed" question. Modeled on the Bosscoder placement-support
 * layout (three navy cards on a soft cream surface, each carrying a checklist
 * + an illustrative bottom panel) but kept in Spanbix's design language.
 *
 * No fake hiring-partner logos. Until real partnerships are signed, the bottom
 * strip surfaces honest hiring-category chips instead of a brand wall.
 */

const steps = [
  {
    title: 'Profile Building',
    icon: FileText,
    checklist: [
      'ATS-friendly resume reviewed by working consultants',
      'Optimized LinkedIn profile + portfolio',
      'Capstone artifacts recruiters can verify',
    ],
    Visual: ResumeVisual,
  },
  {
    title: 'Mentor & Alumni Referrals',
    icon: Network,
    checklist: [
      'Referrals from active SAP consultants in your track',
      'Access to alumni hiring-partner network',
      'Mock interviews tuned to live SI hiring panels',
    ],
    Visual: ReferralVisual,
  },
  {
    title: 'Hiring Partner Tie-Ups',
    icon: Handshake,
    checklist: [
      'Curated openings across IT, GCC, and manufacturing',
      'Direct interview connects with hiring managers',
      'Salary negotiation + offer review support',
    ],
    Visual: TieUpVisual,
  },
];

const hiringCategories = [
  'Tier-1 IT Services',
  'GCC / Captive Centers',
  'Global SI Partners',
  'Manufacturing Majors',
  'Banking & Financial Services',
  'Pharma & Healthcare',
  'FMCG & Retail',
  'Mid-market ERP Consultancies',
];

export default function PlacementSupport() {
  return (
    <Section
      id="placement-support"
      tone="white"
      caption="Placement Support"
      title={
        <>
          We don't hand you a certificate and{' '}
          <span style={{ color: SPANBIX_BRAND.accent }}>disappear.</span> Three steps get you placed.
        </>
      }
      subtitle="A certificate without an offer is wallpaper. Spanbix's placement layer turns on from week one of your track — profile building, mentor referrals, and direct hiring-partner connects — and stays on until you sign your first offer letter."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {steps.map((s, i) => (
          <StepCard key={s.title} step={s} index={i} />
        ))}
      </div>

      {/* Hiring strip */}
      <div className="mt-14">
        <div className="flex items-center justify-center gap-4">
          <span aria-hidden className="h-px w-12" style={{ backgroundColor: 'rgba(39,100,228,0.55)' }} />
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.28em] font-sora text-center"
            style={{ color: SPANBIX_BRAND.navy }}
          >
            Hiring partners across
          </p>
          <span aria-hidden className="h-px w-12" style={{ backgroundColor: 'rgba(39,100,228,0.55)' }} />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {hiringCategories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[12.5px] font-medium font-sora transition-all"
              style={{
                backgroundColor: '#f5f8ff',
                border: `1px solid ${SPANBIX_BRAND.border}`,
                color: SPANBIX_BRAND.navy,
              }}
            >
              {c}
            </span>
          ))}
        </div>

        <p
          className="mt-5 text-center text-[12px] font-sora italic"
          style={{ color: SPANBIX_BRAND.textMuted }}
        >
          Named partner logos appear here only after MoUs are signed. Until then, honest categories — not stock-image walls.
        </p>
      </div>
    </Section>
  );
}

function StepCard({ step, index }) {
  const { title, icon: Icon, checklist, Visual } = step;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: SPANBIX_BRAND.navy,
        backgroundImage:
          'radial-gradient(circle at 85% 8%, rgba(39,100,228,0.32), transparent 55%)',
        boxShadow: '0 18px 44px -20px rgba(16,44,86,0.5)',
      }}
    >
      {/* Subtle bg grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative p-7 md:p-8 flex-1 flex flex-col">
        {/* Step number + title */}
        <div className="flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] font-sora"
            style={{ color: '#bfd2f4' }}
          >
            <span
              className="font-mono"
              style={{ color: '#bfd2f4' }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span aria-hidden className="h-px w-6" style={{ backgroundColor: 'rgba(191,210,244,0.7)' }} />
            Step
          </span>
          <Icon size={18} style={{ color: '#bfd2f4' }} />
        </div>

        <h3
          className="mt-4 font-serif text-[26px] md:text-[28px] tracking-tight leading-tight"
          style={{ color: '#ffffff' }}
        >
          {title}
        </h3>
        <span
          aria-hidden
          className="mt-3 block h-[3px] w-12 rounded-full"
          style={{ backgroundColor: SPANBIX_BRAND.accent }}
        />

        {/* Checklist */}
        <ul className="mt-6 space-y-3">
          {checklist.map((c) => (
            <li key={c} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(96,165,250,0.25)' }}
              >
                <Check size={11} strokeWidth={3} style={{ color: '#bfd2f4' }} />
              </span>
              <span
                className="text-[13.5px] font-sora leading-snug"
                style={{ color: 'rgba(255,255,255,0.88)' }}
              >
                {c}
              </span>
            </li>
          ))}
        </ul>

        {/* Visual panel at bottom */}
        <div className="mt-7">
          <Visual />
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────── Inline mini-illustrations ─────────────────
   Pure CSS / div compositions — no clip art, no external images.
   Matches Bosscoder's "illustrative bottom panel" pattern but
   keeps the look on-brand for Spanbix. */

function PanelShell({ label, children }) {
  return (
    <div
      className="relative rounded-xl overflow-hidden p-4"
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(147,197,253,0.22)',
      }}
    >
      <p
        className="text-[9.5px] font-semibold uppercase tracking-[0.22em] font-sora mb-3"
        style={{ color: '#bfd2f4' }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function ResumeVisual() {
  return (
    <PanelShell label="ATS-friendly resume that gets shortlisted">
      <div className="flex items-start gap-3">
        {/* Avatar circle */}
        <div
          className="w-9 h-9 rounded-full shrink-0"
          style={{ backgroundColor: 'rgba(191,210,244,0.35)' }}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="h-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.6)', width: '60%' }} />
          <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)', width: '85%' }} />
          <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)', width: '70%' }} />
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: SPANBIX_BRAND.accent }}
        >
          <Check size={14} strokeWidth={3} color="#fff" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '90%' }} />
        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '78%' }} />
        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '95%' }} />
        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: '65%' }} />
      </div>
    </PanelShell>
  );
}

function ReferralVisual() {
  return (
    <PanelShell label="Referrals from working SAP consultants">
      <div className="relative h-[120px]">
        <svg viewBox="0 0 240 120" className="absolute inset-0 w-full h-full" fill="none">
          {/* Connector lines */}
          <line x1="120" y1="60" x2="40" y2="30" stroke="rgba(191,210,244,0.4)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="120" y1="60" x2="200" y2="30" stroke="rgba(191,210,244,0.4)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="120" y1="60" x2="40" y2="95" stroke="rgba(191,210,244,0.4)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="120" y1="60" x2="200" y2="95" stroke="rgba(191,210,244,0.4)" strokeWidth="1" strokeDasharray="3 3" />
          {/* Outer nodes */}
          <circle cx="40" cy="30" r="9" fill="rgba(96,165,250,0.5)" />
          <circle cx="200" cy="30" r="9" fill="rgba(96,165,250,0.5)" />
          <circle cx="40" cy="95" r="9" fill="rgba(96,165,250,0.5)" />
          <circle cx="200" cy="95" r="9" fill="rgba(96,165,250,0.5)" />
          {/* Center node */}
          <circle cx="120" cy="60" r="16" fill={SPANBIX_BRAND.accent} />
          <circle cx="120" cy="60" r="22" fill="none" stroke="rgba(39,100,228,0.4)" strokeWidth="1" />
        </svg>
      </div>
      <div className="flex items-center justify-between text-[10.5px] font-sora" style={{ color: 'rgba(255,255,255,0.72)' }}>
        <span>You</span>
        <span>4 mentor connects</span>
      </div>
    </PanelShell>
  );
}

function TieUpVisual() {
  return (
    <PanelShell label="Openings &amp; interviews connect with learners">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1.5 flex-1">
          <ChipBar width="80%" />
          <ChipBar width="65%" />
          <ChipBar width="90%" />
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'rgba(96,165,250,0.25)',
            border: '1px solid rgba(147,197,253,0.4)',
          }}
        >
          <Handshake size={18} style={{ color: '#bfd2f4' }} />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 items-end">
          <ChipBar width="75%" />
          <ChipBar width="90%" />
          <ChipBar width="60%" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10.5px] font-sora" style={{ color: 'rgba(255,255,255,0.72)' }}>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck size={10} /> Verified roles
        </span>
        <span>Curated openings</span>
      </div>
    </PanelShell>
  );
}

function ChipBar({ width }) {
  return (
    <div
      className="h-2 rounded-full"
      style={{ width, backgroundColor: 'rgba(255,255,255,0.22)' }}
    />
  );
}
