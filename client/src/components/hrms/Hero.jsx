import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Cpu, Activity } from 'lucide-react';
import AnimatedGridBackground from './AnimatedGridBackground';
import WorkforceMetricCard from './WorkforceMetricCard';
import FloatingAnalyticsPanel from './FloatingAnalyticsPanel';
import ActivityTimeline from './ActivityTimeline';
import { cn } from '@/lib/utils';
import { trackCtaClick } from '@/lib/analytics';

const supportPoints = [
  { icon: Sparkles, label: 'AI-ready workforce ops' },
  { icon: Activity, label: 'Real-time employee insights' },
  { icon: Shield,   label: 'Enterprise-grade security' },
  { icon: Cpu,      label: 'Built for scale' },
];

const timelineItems = [
  { text: 'Payroll cycle finalized · 462 employees', time: 'Just now',   color: 'emerald' },
  { text: 'Leave approval batch processed',          time: '2 min ago',  color: 'cyan' },
  { text: 'Shift roster auto-rebalanced',            time: '14 min ago', color: 'violet' },
  { text: 'Compliance audit log generated',          time: '38 min ago', color: 'amber' },
];

export default function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  // Subtle parallax — disabled if user prefers reduced motion
  const headlineY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const panelY    = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90]);
  const feedY     = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -50]);
  const metricY   = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const fadeOut   = useTransform(scrollYProgress, [0, 0.9], [1, 0.3]);

  // Mouse-driven ambient glow follow
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const onMove = (e) => {
      setMouse({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <section ref={ref} className="relative pt-32 md:pt-40 pb-28 md:pb-36 overflow-hidden">
      <AnimatedGridBackground />

      {/* Mouse-following ambient glow */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute w-[640px] h-[640px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, hsl(263 75% 60% / 0.18), transparent 65%)',
            left: `calc(${mouse.x * 100}% - 320px)`,
            top: `calc(${mouse.y * 100}% - 320px)`,
            transition: 'left 0.6s ease-out, top 0.6s ease-out',
          }}
        />
      )}

      <motion.div style={{ opacity: fadeOut }} className="relative max-w-7xl mx-auto px-6 md:px-8">
        {/* Pill */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 backdrop-blur-xl text-[11px] font-semibold tracking-wider uppercase text-violet-300"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
          </span>
          Workforce Operations · Live
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 mt-8 items-start">
          {/* Left — headline copy */}
          <motion.div style={{ y: headlineY }} className="lg:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="text-[2.65rem] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.5rem] font-bold leading-[1.02] tracking-[-0.035em]"
            >
              Run Your Entire{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                  Workforce
                </span>
                <span aria-hidden className="absolute -inset-x-4 -bottom-2 h-1 bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0 blur-sm" />
              </span>{' '}
              From One{' '}
              <span className="text-foreground/90">Intelligent</span>{' '}
              Command Center
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl"
            >
              Mavro HRMS unifies attendance, payroll, employee lifecycle, leave, compliance,
              performance, and workforce analytics into one powerful operational platform
              built for modern organizations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <a
                href="#contact"
                onClick={() => trackCtaClick('Book Live Demo', { location: 'hero' })}
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_18px_40px_-12px_hsl(263_70%_50%/0.6)] hover:shadow-[0_22px_55px_-10px_hsl(263_70%_50%/0.85)] transition-all"
              >
                <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative">Book Live Demo</span>
                <ArrowRight size={15} className="relative group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="#modules"
                onClick={() => trackCtaClick('Explore Platform', { location: 'hero' })}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-card/70 backdrop-blur-xl border border-border hover:bg-card hover:border-border transition-all"
              >
                Explore Platform
              </a>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 grid grid-cols-2 gap-x-6 gap-y-3 max-w-xl"
            >
              {supportPoints.map((p, i) => (
                <motion.li
                  key={p.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.07 }}
                  className="flex items-center gap-2.5 text-[13px] text-muted-foreground"
                >
                  <span className="w-7 h-7 rounded-lg bg-foreground/[0.04] border border-border flex items-center justify-center">
                    <p.icon size={13} className="text-violet-400" />
                  </span>
                  {p.label}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right — floating visual stack */}
          <div className="lg:col-span-5 relative min-h-[500px]">
            <motion.div style={{ y: panelY }} className="absolute top-0 right-0 w-full max-w-[420px]">
              <FloatingAnalyticsPanel delay={0.3} />
            </motion.div>

            <motion.div
              style={{ y: feedY }}
              initial={{ opacity: 0, x: -16, y: 18 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 -left-2 lg:left-[-30px] w-[260px] rounded-2xl bg-card/85 backdrop-blur-2xl border border-border/70 shadow-[0_30px_70px_-25px_hsl(192_85%_45%/0.4)] p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-400">Operations Feed</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_hsl(160_70%_45%/0.8)]" />
              </div>
              <ActivityTimeline items={timelineItems} />
            </motion.div>

            <motion.div style={{ y: metricY }} className="absolute -top-6 right-[-12px] lg:right-[-30px] flex flex-col gap-3 z-10">
              <WorkforceMetricCard
                label="Active"
                value="462"
                trend="+3.2%"
                color="emerald"
                delay={0.55}
                className="w-[160px]"
              />
            </motion.div>
          </div>
        </div>

        {/* Logo strip / micro-trust signal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 pt-8 border-t border-border/40 flex flex-wrap items-center justify-between gap-y-4 gap-x-8 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 font-semibold"
        >
          <span>SOC 2-aware architecture</span>
          <span className="hidden sm:inline">·</span>
          <span>99.95% uptime</span>
          <span className="hidden sm:inline">·</span>
          <span>Multi-tenant ready</span>
          <span className="hidden sm:inline">·</span>
          <span>India-stack compatible</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
