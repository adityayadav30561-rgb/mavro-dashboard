import { motion } from 'framer-motion';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

/**
 * Compact navy hero for non-homepage routes (Courses, Career Paths, etc.).
 * Provides consistent eyebrow + headline + subtitle rhythm without the
 * full dashboard preview composition reserved for the marketing homepage.
 */
export default function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundColor: SPANBIX_BRAND.navy,
        color: '#fff',
        backgroundImage:
          'radial-gradient(circle at 18% 12%, rgba(39,100,228,0.18), transparent 55%), radial-gradient(circle at 82% 88%, rgba(39,100,228,0.12), transparent 55%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="relative max-w-7xl mx-auto w-full min-w-0 px-6 sm:px-6 md:px-8 pt-10 sm:pt-16 md:pt-24 lg:pt-28 pb-10 sm:pb-14 md:pb-20">
        {eyebrow && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span aria-hidden className="h-px w-10" style={{ backgroundColor: 'rgba(191,210,244,0.7)' }} />
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.28em] font-sora"
              style={{ color: '#bfd2f4' }}
            >
              {eyebrow}
            </p>
          </motion.div>
        )}
        {title && (
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-3 sm:mt-4 font-serif text-[1.9rem] sm:text-[2.4rem] md:text-[2.8rem] lg:text-[3.5rem] leading-[1.08] sm:leading-[1.07] tracking-[-0.012em] max-w-4xl text-white"
          >
            {title}
          </motion.h1>
        )}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-4 sm:mt-5 max-w-2xl text-[14.5px] sm:text-[16px] md:text-[17.5px] leading-relaxed font-sora"
            style={{ color: 'rgba(255,255,255,0.9)' }}
          >
            {subtitle}
          </motion.p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
