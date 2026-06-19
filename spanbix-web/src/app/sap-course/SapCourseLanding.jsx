'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, TrendingUp, Globe2, IndianRupee, Boxes, UserCheck, FlaskConical,
  Radio, Briefcase, BadgeCheck, GraduationCap, Users, ArrowRight, ArrowLeft,
  CheckCircle2, Clock, MonitorPlay, CalendarClock, Star, Quote, Plus,
  Layers, Workflow, Database, BarChart3, MessagesSquare, Lightbulb,
  BookOpen, Repeat, LineChart, Cpu,
} from 'lucide-react';
import LpLeadForm from './LpLeadForm';
import { trackCta, trackWhatsApp, trackCall } from '@/lib/track';

const PHONE_DISPLAY = '+91 93107 93790';
const PHONE_TEL = '+919310793790';
const WA_LINK = 'https://wa.me/919310793790?text=' + encodeURIComponent('I want to enquire about the SAP course');

const reveal = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

// ── Content ────────────────────────────────────────────────────────────────
const WHY_SAP = [
  { icon: TrendingUp, t: 'Fast career growth', d: 'Move into specialist, high-responsibility SAP roles within a few years.' },
  { icon: Globe2, t: 'Global demand', d: 'SAP runs the back office of most large enterprises — skills travel across industries and borders.' },
  { icon: IndianRupee, t: 'Strong salaries', d: 'Certified consultants earn well above the average fresher package in India.' },
  { icon: Boxes, t: 'Real ERP skills', d: 'Learn how finance, supply chain, and sales actually run inside a live S/4HANA system.' },
];

const WHY_SPANBIX = [
  { icon: UserCheck, t: 'Industry-expert trainers', d: 'Taught by working SAP consultants with real implementation experience.' },
  { icon: FlaskConical, t: 'Hands-on learning', d: 'Configure and work inside a live SAP sandbox — not slides.' },
  { icon: Radio, t: 'Live interactive sessions', d: 'Real-time classes with doubt-solving; every session recorded.' },
  { icon: Briefcase, t: 'Placement support', d: 'Resume building, mock interviews, and hiring connects when you finish.' },
  { icon: BadgeCheck, t: 'Certification guidance', d: 'A mentor-signed, verifiable Spanbix credential after assessment + capstone.' },
];

const HIGHLIGHTS = [
  { icon: Layers, t: 'SAP Fundamentals', d: 'Core navigation, modules, and how the system fits together.' },
  { icon: Workflow, t: 'Business Processes', d: 'End-to-end finance, procurement, and sales flows.' },
  { icon: Database, t: 'ERP Concepts', d: 'How enterprises run on integrated, real-time data.' },
  { icon: BarChart3, t: 'Reporting & Analytics', d: 'Pull decision-ready insight out of SAP data.' },
  { icon: MessagesSquare, t: 'Communication Skills', d: 'Present and defend your work like a consultant.' },
  { icon: Lightbulb, t: 'Problem Solving', d: 'Tackle real implementation scenarios end-to-end.' },
];

const WHO = [
  { icon: BookOpen, t: 'Students', d: 'Final-year? Get a head start before campus placements begin.', track: 'Any track' },
  { icon: GraduationCap, t: 'Fresh Graduates', d: 'B.Com, BBA, or MBA — functional SAP is built for you.', track: 'FICO · MM · SD' },
  { icon: Briefcase, t: 'Working Professionals', d: 'Upskill into higher-paying SAP consulting roles.', track: 'Any track' },
  { icon: Repeat, t: 'Career Switchers', d: 'Pivot into SAP from any field — we map your route.', track: 'Guided choice' },
  { icon: LineChart, t: 'MBA Candidates', d: 'Finance & operations grads thrive in functional SAP.', track: 'FICO · MM' },
  { icon: Cpu, t: 'Engineering Graduates', d: 'B.Tech, CS, or BCA → technical & techno-functional.', track: 'ABAP' },
];

const PROCESS = [
  { t: 'Enroll', d: 'Reserve your seat in the next cohort.' },
  { t: 'Live Classes', d: 'Attend interactive mentor-led sessions.' },
  { t: 'Practical Learning', d: 'Work hands-on in a live SAP sandbox.' },
  { t: 'Assessments', d: 'Capstone + mock interviews validate skills.' },
  { t: 'Career Support', d: 'Resume, LinkedIn, and interview prep.' },
  { t: 'Job Opportunities', d: 'Hiring partner introductions on completion.' },
];

// Curated, real student outcomes already published on the main site. Merged with
// live Google reviews (passed as props) in the carousel below.
const CURATED = [
  { name: 'Tushar Aggarwal', track: 'SAP SD', rating: 5, image: '/spanbix/tushar.jpeg', source: 'student', text: 'I came in straight out of a B.Com with zero SAP background. The SD track + mock interviews got me an offer at EY.' },
  { name: 'Priya Sharma', track: 'SAP FICO', rating: 5, image: '/spanbix/priya.png', source: 'student', text: "Spanbix's structured FICO path got me into a consulting role with a real implementation team within five months." },
  { name: 'Rahul Verma', track: 'SAP MM', rating: 5, image: '/spanbix/rahul.png', source: 'student', text: 'The mentor reviews were the difference. Working consultants walked me through every realistic interview scenario.' },
  { name: 'Anjali Iyer', track: 'SAP ABAP', rating: 5, image: '/spanbix/anjali.png', source: 'student', text: 'The capstone projects gave me a portfolio recruiters could verify — that closed the offer.' },
  // Real Google reviews (provided by the business). No profile photos via paste,
  // so the carousel renders an initial-avatar fallback for these.
  { name: 'Aditya Yadav', rating: 5, source: 'google', text: "I'd tried two free SAP courses before this and bounced off both. The Spanbix FICO track was the first time the configuration actually clicked — going from GL setup to a period-end close in a real S/4HANA sandbox made the interviews feel like revision, not a test." },
  { name: 'Sonu Singh', rating: 5, source: 'google', time: 'early 2026', text: 'Completed SAP MM from Spanbix in early 2026. The faculty explained procurement, inventory and vendor management in great detail, with examples from real consulting projects. Batch size was small, so individual doubts were addressed personally. Their placement support is genuine — I was placed in a manufacturing company in Ghaziabad within 5 weeks of finishing.' },
  { name: 'Ruchikas Singh', rating: 5, source: 'google', time: '6 months ago', text: 'Did SAP FICO from Spanbix around 6 months back after my B.Com. Fees were far more reasonable than the other places I checked in Noida, and the trainer actually sat with us whenever we had doubts. Got placed in 2 months. Recommend it 100%.' },
];

const FAQS = [
  { q: 'Who is eligible to join?', a: 'Any graduate or final-year student — commerce, management, or engineering. Functional tracks (FICO, MM, SD) suit commerce/MBA backgrounds; ABAP suits engineering/CS. No prior SAP experience needed.' },
  { q: 'What are the course fees?', a: 'Fees depend on the track and batch. We share exact pricing and instalment options on your counselling call — book a callback and we will walk you through it.' },
  { q: 'Is the training practical?', a: 'Yes. You work hands-on inside a live SAP S/4HANA sandbox, build a capstone project, and get mentor reviews — not just theory.' },
  { q: 'Do you provide placement support?', a: 'Yes — resume and LinkedIn work, mock interviews tuned to real hiring panels, and hiring-partner introductions when you complete the program.' },
  { q: 'Are classes online?', a: 'Yes, classes are fully online and live. Every session is recorded and added to your library so you can revise anytime.' },
  { q: 'Will I get a certificate?', a: 'You receive a verifiable, mentor-signed Spanbix certificate, issued after you finish assessments and the capstone.' },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SapCourseLanding({ googleReviews = [], googleRating = null, googleTotal = null }) {
  const reviews = [...CURATED, ...googleReviews];

  return (
    <div className="spanbix-scope" style={{ background: '#fff', color: 'var(--sx-ink, #0f172a)', overflowX: 'hidden' }}>
      <LpHeader />

      {/* ── HERO (video background) ── */}
      <section className="relative" style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'var(--sx-navy)' }} id="top">
        <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline preload="auto" aria-hidden style={{ zIndex: 0 }}>
          <source src="/spanbix/herosection-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0" aria-hidden style={{ zIndex: 1, background: [
          'linear-gradient(90deg, rgba(5,13,31,0.9) 0%, rgba(16,44,86,0.74) 42%, rgba(16,44,86,0.34) 100%)',
          'linear-gradient(180deg, rgba(16,44,86,0.4) 0%, rgba(16,44,86,0.5) 60%, rgba(5,13,31,0.92) 100%)',
        ].join(', ') }} />
        <div className="sx-grid-bg" style={{ zIndex: 2 }} />

        <div className="sx-container relative" style={{ zIndex: 3, paddingTop: 96, paddingBottom: 56 }}>
          <div className="grid gap-10 items-center grid-cols-1 lg:[grid-template-columns:minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div>
              <div className="inline-flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 999, padding: '7px 14px', marginBottom: 20 }}>
                <Stars n={googleRating || 5} size={14} />
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
                  {googleRating ? `${googleRating.toFixed(1)} on Google${googleTotal ? ` · ${googleTotal} reviews` : ''}` : 'Rated 5★ by our students'}
                </span>
              </div>
              <h1 className="sx-display" style={{ color: '#fff', fontSize: 'clamp(36px, 5.4vw, 64px)', lineHeight: 1.04, fontWeight: 400, textShadow: '0 2px 24px rgba(5,13,31,0.45)' }}>
                Become a <em>job-ready</em><br />SAP professional.
              </h1>
              <p className="sx-lead" style={{ maxWidth: 540, marginTop: 20, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 12px rgba(5,13,31,0.35)' }}>
                Live, mentor-led SAP training built for graduates and working professionals — hands-on practice, real projects, and placement support.
              </p>
              <ul className="grid gap-2.5" style={{ margin: '24px 0 28px', maxWidth: 520 }}>
                {['Taught by working SAP consultants', 'Hands-on live S/4HANA sandbox', 'Placement + interview support', 'Verifiable certification'].map((b) => (
                  <li key={b} className="flex items-center gap-2.5" style={{ color: 'rgba(255,255,255,0.94)', fontSize: 15.5 }}>
                    <CheckCircle2 size={18} style={{ color: 'var(--sx-citron)', flexShrink: 0 }} /> {b}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <a href="#enroll" onClick={() => trackCta('hero_enroll')} className="sx-btn" style={{ background: 'var(--sx-citron)', color: 'var(--sx-navy)', fontWeight: 700, boxShadow: '0 12px 34px -10px rgba(212,240,74,0.5)' }}>
                  Enroll Now <ArrowRight size={16} />
                </a>
                <a href={`tel:${PHONE_TEL}`} onClick={() => trackCall('hero')} className="sx-btn" style={{ border: '1px solid rgba(255,255,255,0.32)', color: '#fff', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
                  <Phone size={16} /> Call now
                </a>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} id="lead"
              style={{ background: '#fff', borderRadius: 20, padding: 'clamp(22px, 3vw, 32px)', boxShadow: '0 50px 110px -40px rgba(0,0,0,0.6)' }}>
              <div style={{ display: 'inline-block', background: 'var(--sx-citron)', color: 'var(--sx-navy)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', padding: '5px 10px', borderRadius: 6, marginBottom: 12 }}>
                LIMITED SEATS · NEXT COHORT
              </div>
              <h2 style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(21px,2.6vw,27px)', color: 'var(--sx-navy)', margin: '0 0 18px', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                Book your free callback
              </h2>
              <LpLeadForm location="hero" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── WHY LEARN SAP ── */}
      <Section title={<>A skill the enterprise world <em>keeps hiring for</em>.</>} subtitle="SAP powers the world's biggest companies — and the talent gap is widening.">
        <div className="grid gap-6 items-stretch grid-cols-1 lg:[grid-template-columns:0.92fr_1.08fr]">
          {/* Feature image + hiring proof */}
          <div className="flex flex-col gap-5">
            <motion.div {...reveal} className="relative overflow-hidden" style={{ borderRadius: 20, minHeight: 340, flex: 1, boxShadow: '0 40px 80px -50px rgba(16,44,86,0.6)' }}>
              <img src="/spanbix/f500-boardroom.jpg" alt="SAP in the enterprise" loading="lazy"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(16,44,86,0.2) 0%, rgba(5,13,31,0.84) 100%)' }} />
              <div className="sx-grid-bg" />
              <div className="absolute" style={{ top: 18, left: 18 }}>
                <div className="inline-flex flex-col" style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 14, padding: '12px 16px' }}>
                  <span style={{ color: 'var(--sx-citron)', fontFamily: 'var(--sx-serif)', fontSize: 30, lineHeight: 1 }}>50,000+</span>
                  <span className="sx-mono" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 5 }}>ERP ROLES OPEN / YEAR</span>
                </div>
              </div>
              <div className="absolute" style={{ left: 24, right: 24, bottom: 22 }}>
                <p style={{ color: '#fff', fontFamily: 'var(--sx-serif)', fontSize: 'clamp(18px,2.1vw,23px)', lineHeight: 1.28, margin: 0, textShadow: '0 2px 14px rgba(0,0,0,0.45)' }}>
                  SAP runs the back office of the Fortune 500 — and the people who configure it are in short supply.
                </p>
              </div>
            </motion.div>
            <motion.div {...reveal} style={{ background: '#fff', border: '1px solid var(--sx-hairline)', borderRadius: 16, padding: '16px 20px' }}>
              <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', fontSize: 11, marginBottom: 12 }}>OUR STUDENTS GET HIRED AT</div>
              <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
                {['tcs.png', 'infosys.png', 'ACCENTURE.png', 'deloitte.png', 'ibm.png'].map((f) => (
                  <img key={f} src={`/spanbix/partners/${f}`} alt="" loading="lazy" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Benefit cards */}
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {WHY_SAP.map((c, i) => <IconCard key={c.t} {...c} i={i} />)}
          </div>
        </div>
      </Section>

      {/* ── WHY CHOOSE SPANBIX ── */}
      <Section tone="cream" title={<>Training built to get you <em>hired</em>.</>} subtitle="Everything is engineered around one outcome — a real job offer.">
        <div className="grid gap-6 items-stretch grid-cols-1 lg:[grid-template-columns:0.9fr_1.1fr]">
          {/* Feature image with credibility stat */}
          <motion.div {...reveal} className="relative overflow-hidden" style={{ borderRadius: 22, minHeight: 460, boxShadow: '0 50px 90px -55px rgba(16,44,86,0.65)' }}>
            <img src="/spanbix/CONSULTANT_15YR.png" alt="Working SAP consultant mentoring learners" loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(16,44,86,0.15) 0%, rgba(5,13,31,0.6) 55%, rgba(5,13,31,0.92) 100%)' }} />
            <div className="sx-grid-bg" />
            <div className="absolute" style={{ top: 20, left: 20 }}>
              <div className="inline-flex flex-col" style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 14, padding: '12px 16px' }}>
                <span style={{ color: 'var(--sx-citron)', fontFamily: 'var(--sx-serif)', fontSize: 30, lineHeight: 1 }}>15+ yrs</span>
                <span className="sx-mono" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 5 }}>SENIOR MENTOR EXPERIENCE</span>
              </div>
            </div>
            <div className="absolute" style={{ left: 26, right: 26, bottom: 26 }}>
              <p style={{ color: '#fff', fontFamily: 'var(--sx-serif)', fontSize: 'clamp(19px,2.2vw,25px)', lineHeight: 1.25, margin: 0, textShadow: '0 2px 14px rgba(0,0,0,0.5)' }}>
                Taught by people who actually ship SAP — working consultants, not career instructors.
              </p>
              <div className="flex flex-wrap gap-2" style={{ marginTop: 16 }}>
                {['Live S/4HANA sandbox', 'Small batches', 'Placement support'].map((t) => (
                  <span key={t} className="sx-mono" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 999, padding: '6px 12px', fontSize: 11 }}>{t}</span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Differentiators as a refined list */}
          <motion.div {...reveal} style={{ background: '#fff', border: '1px solid var(--sx-hairline)', borderRadius: 22, padding: 'clamp(12px, 2vw, 22px)', boxShadow: '0 30px 60px -50px rgba(16,44,86,0.5)' }}>
            {WHY_SPANBIX.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={c.t} className="group flex items-start gap-4 transition-colors rounded-2xl hover:bg-slate-50"
                  style={{ padding: '18px 16px', borderBottom: i < WHY_SPANBIX.length - 1 ? '1px solid var(--sx-hairline)' : 'none' }}>
                  <span className="inline-grid place-items-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ width: 48, height: 48, borderRadius: 13, background: 'linear-gradient(135deg, var(--sx-navy), #2764e4)', color: 'var(--sx-citron)' }}>
                    <Icon size={21} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--sx-navy)', fontSize: 17, marginBottom: 4 }}>{c.t}</div>
                    <div style={{ color: 'var(--sx-ink-2)', fontSize: 14.5, lineHeight: 1.5 }}>{c.d}</div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </Section>

      {/* ── CTA STRIP 1 ── */}
      <CtaStrip heading={<>Ready to start? Talk to a counsellor today.</>} sub="Free callback within one business day — no fees to enquire." />

      {/* ── COURSE HIGHLIGHTS ── */}
      <Section title={<>What you'll <em>master</em>.</>} subtitle="A complete, job-focused curriculum — technical depth plus the soft skills recruiters test for.">
        <div className="relative">
          <div aria-hidden className="absolute inset-x-0" style={{ top: -40, height: 320, background: 'radial-gradient(60% 100% at 50% 0%, rgba(39,100,228,0.07), transparent 70%)', pointerEvents: 'none' }} />
          <div className="relative grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((h, i) => {
              const Icon = h.icon;
              return (
                <motion.div key={h.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.04 }}
                  className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                  style={{ background: '#fff', border: '1px solid var(--sx-hairline)', borderRadius: 18, padding: 26, boxShadow: '0 22px 46px -36px rgba(16,44,86,0.5)' }}>
                  {/* corner gradient flourish */}
                  <span aria-hidden className="absolute transition-opacity duration-300" style={{ top: -45, right: -45, width: 140, height: 140, borderRadius: 999, background: 'radial-gradient(circle, rgba(212,240,74,0.28), transparent 70%)', opacity: 0.7 }} />
                  <div className="relative flex items-center justify-between" style={{ marginBottom: 16 }}>
                    <span className="inline-grid place-items-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                      style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--sx-navy), #2764e4)', color: 'var(--sx-citron)' }}>
                      <Icon size={23} />
                    </span>
                    <span style={{ fontFamily: 'var(--sx-serif)', fontSize: 44, lineHeight: 1, color: 'var(--sx-navy)', opacity: 0.1 }}>{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="relative" style={{ fontWeight: 700, color: 'var(--sx-navy)', fontSize: 18.5, marginBottom: 7 }}>{h.t}</div>
                  <p className="relative" style={{ color: 'var(--sx-ink-2)', fontSize: 14.5, lineHeight: 1.52, margin: 0 }}>{h.d}</p>
                  <span aria-hidden className="absolute w-0 transition-all duration-300 group-hover:w-14" style={{ left: 26, bottom: 0, height: 3, borderRadius: 2, background: 'var(--sx-citron)' }} />
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── WHO CAN JOIN ── */}
      <Section tone="navy" title={<>Built for <em>your background</em>.</>} subtitle="No coding degree required. If you're driven, there's a track for you." dark>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {WHO.map((w, i) => {
            const Icon = w.icon;
            return (
              <motion.div key={w.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.04 }}
                className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24, backdropFilter: 'blur(6px)' }}>
                <div className="relative flex items-center gap-3.5" style={{ marginBottom: 14 }}>
                  <span className="inline-grid place-items-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ width: 50, height: 50, borderRadius: 13, background: 'rgba(212,240,74,0.14)', border: '1px solid rgba(212,240,74,0.35)', color: 'var(--sx-citron)' }}>
                    <Icon size={22} />
                  </span>
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: 17.5 }}>{w.t}</span>
                </div>
                <p className="relative" style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 1.5, margin: '0 0 16px' }}>{w.d}</p>
                <div className="relative flex items-center gap-2">
                  <span className="sx-mono" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10.5 }}>BEST FIT</span>
                  <span className="sx-mono" style={{ background: 'rgba(212,240,74,0.12)', border: '1px solid rgba(212,240,74,0.3)', color: 'var(--sx-citron)', borderRadius: 999, padding: '4px 10px', fontSize: 11 }}>{w.track}</span>
                </div>
                <span aria-hidden className="absolute w-0 transition-all duration-300 group-hover:w-14" style={{ left: 24, bottom: 0, height: 3, borderRadius: 2, background: 'var(--sx-citron)' }} />
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── STUDENT SUCCESS (carousel) ── */}
      <Section tone="cream" title={<>Real students. Real <em>offers</em>.</>}
        subtitle={googleRating ? `Rated ${googleRating.toFixed(1)}★ on Google${googleTotal ? ` across ${googleTotal} reviews` : ''}.` : 'Verified outcomes from students who started where you are now.'}>
        <ReviewCarousel reviews={reviews} />
      </Section>

      {/* ── CTA STRIP 2 ── */}
      <CtaStrip heading={<>Join students already working in SAP.</>} sub="Book your seat in the next cohort before it fills." />

      {/* ── TRAINING PROCESS (alternating horizontal timeline) ── */}
      <Section title={<>From enrolment to <em>job offer</em>.</>} subtitle="A clear, structured path — you always know what's next.">
        {/* MOBILE / TABLET — vertical timeline */}
        <div className="lg:hidden relative">
          <div aria-hidden className="absolute" style={{ left: 27, top: 28, bottom: 28, width: 2, background: 'var(--sx-hairline)' }} />
          <div className="grid gap-9 grid-cols-1">
            {PROCESS.map((p, i) => (
              <motion.div key={p.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="relative flex gap-4">
                <TimelineNode i={i} />
                <div className="pt-1"><TimelineContent p={p} i={i} /></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* DESKTOP — zigzag: step 1 above the rail, step 2 below, step 3 above… */}
        <div className="hidden lg:block relative">
          <div aria-hidden className="absolute" style={{ left: '8.33%', right: '8.33%', top: 157, height: 3, borderRadius: 2, background: 'linear-gradient(90deg, var(--sx-citron), rgba(16,44,86,0.18))' }} />
          <div className="grid grid-cols-6 gap-5">
            {PROCESS.map((p, i) => {
              const above = i % 2 === 0;
              return (
                <motion.div key={p.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.07 }}
                  className="relative text-center" style={{ display: 'grid', gridTemplateRows: '130px 56px 130px' }}>
                  <div style={{ gridRow: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 18 }}>
                    {above && <TimelineContent p={p} i={i} center />}
                  </div>
                  <div style={{ gridRow: 2 }} className="grid place-items-center"><TimelineNode i={i} /></div>
                  <div style={{ gridRow: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 18 }}>
                    {!above && <TimelineContent p={p} i={i} center />}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── BATCH DETAILS ── */}
      <Section tone="cream" title={<>The next cohort is <em>filling up</em>.</>} subtitle="Small batches mean more attention — and seats go fast.">
        <div className="grid gap-6 items-stretch grid-cols-1 lg:[grid-template-columns:1.05fr_0.95fr]">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {[
                { icon: MonitorPlay, t: 'Mode', v: 'Online · Live + recorded' },
                { icon: Clock, t: 'Duration', v: '3 months per track' },
                { icon: CalendarClock, t: 'Timings', v: 'Weekday & weekend' },
                { icon: Users, t: 'Batch size', v: 'Small cohorts' },
              ].map((d, i) => {
                const Icon = d.icon;
                return (
                  <motion.div key={d.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.05 }}
                    className="transition-all duration-300 hover:-translate-y-1"
                    style={{ background: '#fff', border: '1px solid var(--sx-hairline)', borderRadius: 16, padding: '20px 22px', boxShadow: '0 18px 38px -34px rgba(16,44,86,0.45)' }}>
                    <span className="inline-grid place-items-center" style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg, var(--sx-navy), #2764e4)', color: 'var(--sx-citron)', marginBottom: 14 }}><Icon size={21} /></span>
                    <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', fontSize: 11, marginBottom: 4 }}>{d.t.toUpperCase()}</div>
                    <div style={{ color: 'var(--sx-navy)', fontWeight: 700, fontSize: 16.5 }}>{d.v}</div>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex items-center gap-3" style={{ background: '#fff', border: '1px solid var(--sx-hairline)', borderLeft: '3px solid var(--sx-citron)', borderRadius: 12, padding: '15px 18px' }}>
              <span className="relative inline-flex shrink-0" style={{ width: 10, height: 10 }}>
                <span className="absolute inline-flex animate-ping" style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--sx-citron)', opacity: 0.75 }} />
                <span className="relative inline-flex" style={{ width: 10, height: 10, borderRadius: 999, background: '#d9b400' }} />
              </span>
              <span style={{ color: 'var(--sx-ink-2)', fontSize: 14.5 }}><b style={{ color: 'var(--sx-navy)' }}>Seats are limited.</b> Small cohorts fill fast each intake.</span>
            </div>
          </div>

          <motion.div {...reveal} className="relative overflow-hidden" style={{ background: 'var(--sx-navy)', borderRadius: 20, padding: 'clamp(28px,3.4vw,40px)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 40px 80px -50px rgba(16,44,86,0.7)' }}>
            <div className="sx-grid-bg" />
            <div className="relative">
              <span className="sx-mono" style={{ display: 'inline-block', background: 'rgba(212,240,74,0.14)', border: '1px solid rgba(212,240,74,0.35)', color: 'var(--sx-citron)', borderRadius: 999, padding: '5px 12px', fontSize: 11, marginBottom: 16 }}>ENROLLING NOW</span>
              <h3 style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(25px,3vw,32px)', marginBottom: 12, fontWeight: 400, lineHeight: 1.1 }}>Reserve your seat</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 20, fontSize: 15.5, lineHeight: 1.55 }}>Book a free callback — our team helps you pick the right track. No fees to enquire.</p>
              <ul className="grid gap-2.5" style={{ marginBottom: 24 }}>
                {['Live + recorded sessions', '1:1 mentor doubt-solving', 'Placement support included'].map((t) => (
                  <li key={t} className="flex items-center gap-2.5" style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14.5 }}>
                    <CheckCircle2 size={17} style={{ color: 'var(--sx-citron)', flexShrink: 0 }} /> {t}
                  </li>
                ))}
              </ul>
              <a href="#enroll" onClick={() => trackCta('batch_reserve')} className="sx-btn" style={{ background: 'var(--sx-citron)', color: 'var(--sx-navy)', fontWeight: 700 }}>
                Reserve Your Seat <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section title={<>Answers before you <em>enroll</em>.</>} subtitle="Everything students ask us before booking a call.">
        <div className="grid gap-6 lg:gap-8 grid-cols-1 lg:[grid-template-columns:0.82fr_1.18fr] items-start">
          {/* Support card */}
          <motion.div {...reveal} className="relative overflow-hidden" style={{ background: 'var(--sx-navy)', borderRadius: 20, padding: 'clamp(26px,3vw,34px)', color: '#fff', boxShadow: '0 40px 80px -55px rgba(16,44,86,0.7)' }}>
            <div className="sx-grid-bg" />
            <div className="relative">
              <span className="inline-grid place-items-center" style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(212,240,74,0.14)', border: '1px solid rgba(212,240,74,0.35)', color: 'var(--sx-citron)', marginBottom: 18 }}><Phone size={22} /></span>
              <h3 style={{ fontFamily: 'var(--sx-serif)', fontSize: 'clamp(22px,2.6vw,28px)', fontWeight: 400, marginBottom: 10, lineHeight: 1.15 }}>Prefer to just ask?</h3>
              <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 1.55, marginBottom: 22 }}>Get every question answered on a quick, no-pressure call with a career counsellor.</p>
              <div className="flex flex-wrap gap-3">
                <a href={`tel:${PHONE_TEL}`} onClick={() => trackCall('faq')} className="sx-btn" style={{ background: 'var(--sx-citron)', color: 'var(--sx-navy)', fontWeight: 700 }}><Phone size={15} /> Call now</a>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp('faq')} className="sx-btn" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}>WhatsApp</a>
              </div>
            </div>
          </motion.div>

          {/* Accordion */}
          <div className="grid gap-3">
            {FAQS.map((f) => (
              <details key={f.q} className="group" style={{ background: '#fff', border: '1px solid var(--sx-hairline)', borderRadius: 14, padding: '2px 22px', boxShadow: '0 1px 0 rgba(16,44,86,0.03)' }}>
                <summary className="flex items-center justify-between gap-4" style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--sx-navy)', padding: '18px 0', listStyle: 'none', fontSize: 16 }}>
                  {f.q}
                  <Plus size={18} className="shrink-0 transition-transform duration-300 group-open:rotate-45" style={{ color: 'var(--sx-citron-ink, #b9a400)' }} />
                </summary>
                <p style={{ color: 'var(--sx-ink-2)', lineHeight: 1.6, padding: '0 0 18px', margin: 0, fontSize: 15 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FINAL LEAD CAPTURE ── */}
      <section className="relative overflow-hidden" id="enroll" style={{ background: 'var(--sx-navy)', padding: 'clamp(60px,8vw,104px) 0' }}>
        <div className="sx-grid-bg" />
        <div aria-hidden className="absolute" style={{ top: -90, left: -70, width: 360, height: 360, borderRadius: 999, background: 'radial-gradient(circle, rgba(39,100,228,0.35), transparent 70%)', pointerEvents: 'none' }} />
        <div aria-hidden className="absolute" style={{ bottom: -110, right: -50, width: 340, height: 340, borderRadius: 999, background: 'radial-gradient(circle, rgba(212,240,74,0.13), transparent 70%)', pointerEvents: 'none' }} />
        <div className="sx-container relative">
          <div className="grid gap-10 items-center grid-cols-1 lg:[grid-template-columns:1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2" style={{ background: 'rgba(212,240,74,0.14)', border: '1px solid rgba(212,240,74,0.35)', color: 'var(--sx-citron)', borderRadius: 999, padding: '6px 14px', marginBottom: 18 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--sx-citron)' }} />
                <span className="sx-mono" style={{ fontSize: 11 }}>LIMITED SEATS · NEXT COHORT</span>
              </span>
              <h2 className="sx-display" style={{ color: '#fff', fontSize: 'clamp(32px,4.6vw,54px)', margin: '0 0 16px', fontWeight: 400, lineHeight: 1.04 }}>
                Start your SAP career <em>this cohort</em>.
              </h2>
              <p className="sx-lead" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 470 }}>
                Fill the form and a counsellor calls you within one business day — no fees to enquire, no pressure.
              </p>
              <div className="flex items-center gap-3" style={{ marginTop: 20 }}>
                <Stars n={5} size={17} />
                <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, fontWeight: 600 }}>Rated 5★ by our students</span>
              </div>
              <ul className="grid gap-2.5" style={{ margin: '20px 0 26px', maxWidth: 460 }}>
                {['No fees to enquire', 'One call — no pressure, no spam', 'We help you pick the right track'].map((b) => (
                  <li key={b} className="flex items-center gap-2.5" style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15 }}>
                    <CheckCircle2 size={17} style={{ color: 'var(--sx-citron)', flexShrink: 0 }} /> {b}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <a href={`tel:${PHONE_TEL}`} onClick={() => trackCall('final_cta')} className="sx-btn" style={{ background: 'var(--sx-citron)', color: 'var(--sx-navy)', fontWeight: 700 }}>
                  <Phone size={16} /> Call {PHONE_DISPLAY}
                </a>
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp('final_cta')} className="sx-btn" style={{ background: '#25D366', color: '#fff', fontWeight: 600 }}>
                  <WaGlyph size={17} /> WhatsApp
                </a>
              </div>
            </div>
            <motion.div {...reveal} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 20, padding: 'clamp(22px,3vw,32px)' }}>
              <div className="sx-mono" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginBottom: 6 }}>BOOK YOUR FREE CALLBACK</div>
              <h3 style={{ fontFamily: 'var(--sx-serif)', color: '#fff', fontSize: 'clamp(20px,2.4vw,26px)', fontWeight: 400, margin: '0 0 18px', letterSpacing: '-0.01em' }}>Talk to a career counsellor</h3>
              <LpLeadForm location="final" dark />
            </motion.div>
          </div>
        </div>
      </section>

      <LpFooter />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  const two = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return (two || parts[0]?.[0] || 'S').toUpperCase();
}

function Stars({ n = 5, size = 16 }) {
  const r = Math.round(n);
  return (
    <span className="inline-flex" style={{ gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} fill={i < r ? '#f5b301' : 'none'} stroke={i < r ? '#f5b301' : '#cbd5e1'} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function GoogleGlyph({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

function ReviewCarousel({ reviews }) {
  const trackRef = useRef(null);
  const scrollBy = (dir) => trackRef.current?.scrollBy({ left: dir * 380, behavior: 'smooth' });
  return (
    <div>
      <div ref={trackRef} className="flex gap-5 overflow-x-auto pb-4" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {reviews.map((r, i) => (
          <article key={`${r.name}-${i}`}
            className="shrink-0"
            style={{ flex: '0 0 clamp(290px, 84vw, 400px)', scrollSnapAlign: 'start', background: '#fff', border: '1px solid var(--sx-hairline)', borderRadius: 18, padding: 26, boxShadow: '0 24px 50px -36px rgba(16,44,86,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <Stars n={r.rating} size={16} />
              {r.source === 'google' ? <GoogleGlyph size={18} /> : <Quote size={20} style={{ color: 'var(--sx-citron-ink, #b9a400)' }} />}
            </div>
            <p style={{ color: 'var(--sx-ink-2)', fontSize: 14.5, lineHeight: 1.55, margin: 0, minHeight: 96 }}>
              {r.text}
            </p>
            <div className="flex items-center gap-3" style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--sx-hairline)' }}>
              {r.image
                ? <img src={r.image} alt={r.name} width={44} height={44} loading="lazy" referrerPolicy="no-referrer" style={{ width: 44, height: 44, borderRadius: 999, objectFit: 'cover', flexShrink: 0, background: 'var(--sx-navy)' }} />
                : <span className="inline-grid place-items-center" style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, var(--sx-navy), #2764e4)', color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em', flexShrink: 0 }}>{initials(r.name)}</span>}
              <div className="min-w-0">
                <div style={{ fontWeight: 700, color: 'var(--sx-navy)' }}>{r.name}</div>
                <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', fontSize: 12 }}>
                  {r.source === 'google' ? 'Google review' : r.track || 'Verified student'}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="flex justify-end gap-2" style={{ marginTop: 14 }}>
        <CarBtn dir={-1} onClick={() => scrollBy(-1)} icon={ArrowLeft} />
        <CarBtn dir={1} onClick={() => scrollBy(1)} icon={ArrowRight} />
      </div>
    </div>
  );
}

function CarBtn({ onClick, icon: Icon }) {
  return (
    <button onClick={onClick} aria-label="Scroll reviews" className="transition-colors"
      style={{ width: 44, height: 44, borderRadius: 999, border: '1px solid var(--sx-hairline)', background: '#fff', color: 'var(--sx-navy)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
      <Icon size={18} />
    </button>
  );
}

function LpHeader() {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--sx-hairline)' }}>
      <div className="sx-container flex items-center justify-between" style={{ height: 64 }}>
        <a href="#top" className="inline-flex items-center" aria-label="Spanbix">
          <img src="/spanbix/spanbix-blue.png" alt="Spanbix" style={{ height: 40, width: 'auto', display: 'block' }} />
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href={`tel:${PHONE_TEL}`} onClick={() => trackCall('header')} className="hidden sm:inline-flex items-center gap-1.5" style={{ color: 'var(--sx-navy)', fontWeight: 600, fontSize: 14 }}>
            <Phone size={15} /> {PHONE_DISPLAY}
          </a>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp('header')} aria-label="WhatsApp"
            className="inline-flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 8, background: '#25D366', color: '#fff' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.001 0C5.376 0 0 5.373 0 12c0 2.629.838 5.066 2.265 7.052L.79 23.452l4.555-1.456A11.95 11.95 0 0012.001 24C18.628 24 24 18.627 24 12S18.628 0 12.001 0z" /></svg>
          </a>
          <a href="#enroll" onClick={() => trackCta('header_enroll')} className="sx-btn sx-btn-dark" style={{ padding: '9px 16px', fontSize: 14 }}>
            Enroll Now
          </a>
        </div>
      </div>
    </header>
  );
}

function Section({ title, subtitle, tone = 'paper', dark = false, children }) {
  const bg = tone === 'navy' ? 'var(--sx-navy)' : tone === 'cream' ? 'var(--sx-cream, #f3ede0)' : '#fff';
  return (
    <section className="relative overflow-hidden" style={{ background: bg, padding: 'clamp(56px, 8vw, 100px) 0' }}>
      {tone === 'navy' && <div className="sx-grid-bg" />}
      <div className="sx-container relative">
        <motion.div {...reveal} style={{ maxWidth: 720, marginBottom: 'clamp(32px, 5vw, 52px)' }}>
          <h2 className="sx-display" style={{ fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1.08, fontWeight: 400, color: dark ? '#fff' : 'var(--sx-navy)' }}>
            {title}
          </h2>
          <span style={{ display: 'block', width: 56, height: 3, borderRadius: 2, background: 'var(--sx-citron)', margin: '18px 0 0' }} />
          {subtitle && <p className="sx-lead" style={{ marginTop: 18, color: dark ? 'rgba(255,255,255,0.78)' : 'var(--sx-ink-2)' }}>{subtitle}</p>}
        </motion.div>
        {children}
      </div>
    </section>
  );
}

function IconCard({ icon: Icon, t, d, i = 0 }) {
  return (
    <motion.div {...reveal} transition={{ ...reveal.transition, delay: i * 0.05 }}
      className="group transition-all duration-300 hover:-translate-y-1.5"
      style={{ background: '#fff', border: '1px solid var(--sx-hairline)', borderRadius: 18, padding: 26, boxShadow: '0 20px 44px -34px rgba(16,44,86,0.45)' }}>
      <span className="inline-grid place-items-center transition-transform duration-300 group-hover:scale-110"
        style={{ width: 50, height: 50, borderRadius: 13, background: 'linear-gradient(135deg, var(--sx-navy), #1c4a8a)', color: 'var(--sx-citron)', marginBottom: 16 }}>
        <Icon size={22} />
      </span>
      <div style={{ fontWeight: 700, color: 'var(--sx-navy)', fontSize: 17.5, marginBottom: 7 }}>{t}</div>
      <div style={{ color: 'var(--sx-ink-2)', fontSize: 14.5, lineHeight: 1.52 }}>{d}</div>
    </motion.div>
  );
}

function WaGlyph({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.001 0C5.376 0 0 5.373 0 12c0 2.629.838 5.066 2.265 7.052L.79 23.452l4.555-1.456A11.95 11.95 0 0012.001 24C18.628 24 24 18.627 24 12S18.628 0 12.001 0z" />
    </svg>
  );
}

// Reusable conversion band — bright citron so it breaks the page rhythm and
// reads as "act now". Never adjacent-tone-clashes (citron sits between any
// navy/cream/white sections). Three routes: form (Enroll), call, WhatsApp.
function CtaStrip({ heading, sub }) {
  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--sx-citron)' }}>
      <div className="sx-container flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left"
        style={{ paddingTop: 'clamp(32px,4.5vw,46px)', paddingBottom: 'clamp(32px,4.5vw,46px)' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--sx-serif)', color: 'var(--sx-navy)', fontSize: 'clamp(22px,2.8vw,32px)', fontWeight: 400, lineHeight: 1.1 }}>{heading}</h3>
          {sub && <p style={{ color: 'rgba(16,44,86,0.75)', marginTop: 8, fontSize: 15, fontWeight: 500 }}>{sub}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <a href="#enroll" onClick={() => trackCta('strip_enroll')} className="sx-btn" style={{ background: 'var(--sx-navy)', color: '#fff', fontWeight: 700 }}>Enroll Now <ArrowRight size={16} /></a>
          <a href={`tel:${PHONE_TEL}`} onClick={() => trackCall('strip')} className="sx-btn" style={{ border: '1.5px solid var(--sx-navy)', color: 'var(--sx-navy)', fontWeight: 600 }}><Phone size={16} /> Call now</a>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp('strip')} className="sx-btn" style={{ background: '#0a1428', color: '#fff', fontWeight: 600 }}><WaGlyph size={17} /> WhatsApp</a>
        </div>
      </div>
    </section>
  );
}

function TimelineNode({ i }) {
  return (
    <span className="relative z-10 inline-grid place-items-center shrink-0"
      style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--sx-navy)', color: 'var(--sx-citron)', fontFamily: 'var(--sx-serif)', fontSize: 23, lineHeight: 1, border: '3px solid var(--sx-citron)', boxShadow: '0 10px 22px -10px rgba(16,44,86,0.55)' }}>
      {i + 1}
    </span>
  );
}

function TimelineContent({ p, i, center }) {
  return (
    <div style={center ? { maxWidth: 210, margin: '0 auto' } : undefined}>
      <div className="sx-mono" style={{ color: 'var(--sx-ink-4)', fontSize: 10.5, marginBottom: 4 }}>STEP {i + 1}</div>
      <div style={{ color: 'var(--sx-navy)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.t}</div>
      <div style={{ color: 'var(--sx-ink-2)', fontSize: 13.5, lineHeight: 1.45 }}>{p.d}</div>
    </div>
  );
}

function LpFooter() {
  return (
    <footer style={{ background: '#0a1428', color: 'rgba(255,255,255,0.75)', padding: '40px 0' }}>
      <div className="sx-container flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', display: 'inline-flex' }}>
            <img src="/spanbix/spanbix-blue.png" alt="Spanbix" style={{ height: 30, width: 'auto', display: 'block' }} />
          </span>
          <span style={{ fontSize: 13.5 }}>SAP Training · Greater Noida · Online across India</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2" style={{ fontSize: 13.5 }}>
          <a href={`tel:${PHONE_TEL}`} onClick={() => trackCall('footer')} style={{ color: '#fff' }}>{PHONE_DISPLAY}</a>
          <a href="mailto:contact@spanbix.com" style={{ color: '#fff' }}>contact@spanbix.com</a>
          <a href="https://www.spanbix.com" style={{ color: 'rgba(255,255,255,0.75)' }}>www.spanbix.com</a>
        </div>
      </div>
      <div className="sx-container" style={{ marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
        © 2026 Spanbix. All rights reserved.
      </div>
    </footer>
  );
}
