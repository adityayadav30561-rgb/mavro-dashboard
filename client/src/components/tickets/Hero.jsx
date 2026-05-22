import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Timer, Eye, Workflow, ShieldCheck } from 'lucide-react';
import AnimatedGridBackground from '@/components/hrms/AnimatedGridBackground';
import SLATimerPanel from './SLATimerPanel';
import FloatingIncidentFeed from './FloatingIncidentFeed';
import TicketMetricOrb from './TicketMetricOrb';
import { trackCtaClick } from '@/lib/analytics';

const supportPoints = [
  { icon: Timer,       label: 'SLA-driven workflows' },
  { icon: Eye,         label: 'Real-time operational visibility' },
  { icon: Workflow,    label: 'Intelligent ticket routing' },
  { icon: ShieldCheck, label: 'Enterprise-grade reliability' },
];

export default function Hero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  const headlineY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const panelY    = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -90]);
  const feedY     = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -50]);
  const metricY   = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const fadeOut   = useTransform(scrollYProgress, [0, 0.9], [1, 0.3]);

  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    if (reduce) return;
    const onMove = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce]);

  return (
    <section ref={ref} className="relative pt-32 md:pt-40 pb-28 md:pb-36 overflow-hidden">
      <AnimatedGridBackground />

      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute w-[640px] h-[640px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, hsl(192 85% 55% / 0.18), transparent 65%)',
            left: `calc(${mouse.x * 100}% - 320px)`,
            top: `calc(${mouse.y * 100}% - 320px)`,
            transition: 'left 0.6s ease-out, top 0.6s ease-out',
          }}
        />
      )}

      <motion.div style={{ opacity: fadeOut }} className="relative max-w-7xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-xl text-[11px] font-semibold tracking-wider uppercase text-cyan-300"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-500" />
          </span>
          Operations Live · 462 tickets in flight
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 mt-8 items-start">
          {/* Left */}
          <motion.div style={{ y: headlineY }} className="lg:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="text-[2.65rem] sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.5rem] font-bold leading-[1.02] tracking-[-0.035em]"
            >
              Every IT Issue{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  Tracked
                </span>
                <span aria-hidden className="absolute -inset-x-4 -bottom-2 h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 blur-sm" />
              </span>.
              {' '}<span className="text-foreground/90">Prioritised</span>.
              {' '}<span className="text-foreground/90">Assigned</span>.
              {' '}<span className="text-foreground/70">Resolved</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl"
            >
              Mavro Ticket Management centralizes IT support operations into one intelligent system
              where every request becomes a tracked, prioritised, assigned ticket with defined ownership,
              SLA visibility, and operational accountability.
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
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-cyan-500 to-teal-700 text-white shadow-[0_18px_40px_-12px_hsl(192_85%_50%/0.6)] hover:shadow-[0_22px_55px_-10px_hsl(192_85%_50%/0.85)] transition-all"
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
                    <p.icon size={13} className="text-cyan-400" />
                  </span>
                  {p.label}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right — telemetry stack */}
          <div className="lg:col-span-5 relative min-h-[540px]">
            <motion.div style={{ y: panelY }} className="absolute top-0 right-0 w-full max-w-[440px]">
              <SLATimerPanel delay={0.3} />
            </motion.div>

            <motion.div style={{ y: feedY }} className="absolute bottom-0 -left-2 lg:left-[-30px] w-[270px]">
              <FloatingIncidentFeed delay={0.5} />
            </motion.div>

            <motion.div style={{ y: metricY }} className="absolute -top-6 right-[-12px] lg:right-[-30px] flex flex-col gap-3 z-10">
              <TicketMetricOrb label="MTTR" value="42m" sublabel="−18% week" color="emerald" delay={0.55} className="w-[160px]" />
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20 pt-8 border-t border-border/40 flex flex-wrap items-center justify-between gap-y-4 gap-x-8 text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 font-semibold"
        >
          <span>ISO 27001-aware</span>
          <span className="hidden sm:inline">·</span>
          <span>99.99% SLA</span>
          <span className="hidden sm:inline">·</span>
          <span>RBAC + audit trail</span>
          <span className="hidden sm:inline">·</span>
          <span>Multi-team ready</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
