import { motion } from 'framer-motion';
import { TrendingUp, Users, EyeOff, Banknote } from 'lucide-react';
import Section from './Section';
import { SPANBIX_BRAND, SPANBIX_MARKET_SIGNALS } from '@/lib/spanbixSeo';

const icons = [TrendingUp, Users, EyeOff, Banknote];

export default function MarketValidation() {
  return (
    <Section
      id="market"
      tone="white"
      caption="Market Validation"
      title="The numbers nobody is talking about."
      subtitle="India ships millions of commerce and management graduates into the job market every year. The country also runs the global SAP delivery economy. Almost nothing connects the two — which is exactly why this gap exists, and exactly why we built Spanbix."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SPANBIX_MARKET_SIGNALS.map((s, i) => {
          const Icon = icons[i % icons.length];
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="relative rounded-2xl p-7 transition-all hover:-translate-y-0.5 overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${SPANBIX_BRAND.border}`,
                boxShadow: '0 1px 2px rgba(16,44,86,0.04), 0 14px 32px -16px rgba(16,44,86,0.12)',
              }}
            >
              <span
                aria-hidden
                className="absolute top-0 left-0 h-1 w-16 rounded-br-lg"
                style={{ backgroundColor: SPANBIX_BRAND.accent }}
              />
              <div className="flex items-start justify-between">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(39,100,228,0.10)' }}
                >
                  <Icon size={20} style={{ color: SPANBIX_BRAND.accent }} />
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] font-sora"
                  style={{ color: SPANBIX_BRAND.accent }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p
                className="mt-6 font-mono text-[34px] md:text-[36px] font-semibold tracking-tight leading-none"
                style={{ color: SPANBIX_BRAND.navy }}
              >
                {s.value}
              </p>
              <p
                className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] font-sora"
                style={{ color: SPANBIX_BRAND.accent }}
              >
                {s.unit}
              </p>
              <p className="mt-4 text-[13.5px] leading-relaxed font-sora" style={{ color: SPANBIX_BRAND.textDark }}>
                {s.label}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-2 text-[11.5px] font-sora" style={{ color: SPANBIX_BRAND.textMuted }}>
        <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(39,100,228,0.08)', color: SPANBIX_BRAND.accent }}>
          Sources
        </span>
        <span>NASSCOM · Naukri JobSpeak · AISHE 2023-24 · LinkedIn Talent Insights · Spanbix Strategic Proposal 2026</span>
      </div>
    </Section>
  );
}
