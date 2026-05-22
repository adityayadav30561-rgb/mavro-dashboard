import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPANBIX_BRAND } from '@/lib/spanbixSeo';

/**
 * Spanbix section wrapper — editorial caption + DM Serif headline + Sora body.
 * Three tones drive the alternating rhythm of the homepage:
 *   - 'white'  pure #ffffff (clean, premium, primary surface for stat-heavy sections)
 *   - 'cream'  #f5f8ff       (soft blue-cream, used for editorial / quote-heavy sections)
 *   - 'navy'   #102c56       (deep enterprise, used for hero-like statement sections)
 * Backgrounds drive readable foreground colors automatically.
 */
const TONE_STYLES = {
  white: {
    bg: '#ffffff',
    caption: SPANBIX_BRAND.accent,
    title: SPANBIX_BRAND.navy,
    subtitle: SPANBIX_BRAND.textMuted,
    rule: 'rgba(39,100,228,0.55)',
    divider: '#f5f8ff',
  },
  cream: {
    bg: '#f5f8ff',
    caption: SPANBIX_BRAND.accent,
    title: SPANBIX_BRAND.navy,
    subtitle: SPANBIX_BRAND.textMuted,
    rule: 'rgba(39,100,228,0.55)',
    divider: '#ffffff',
  },
  navy: {
    bg: SPANBIX_BRAND.navy,
    caption: '#bfd2f4',
    title: '#ffffff',
    subtitle: 'rgba(255,255,255,0.86)',
    rule: 'rgba(191,210,244,0.7)',
    divider: 'rgba(255,255,255,0.10)',
  },
};

export default function Section({
  id,
  caption,
  title,
  subtitle,
  align = 'left',
  tone = 'white',
  className,
  containerClassName,
  children,
}) {
  const t = TONE_STYLES[tone] || TONE_STYLES.white;
  const isNavy = tone === 'navy';

  return (
    <section
      id={id}
      className={cn('relative py-14 sm:py-20 md:py-28 overflow-hidden', className)}
      style={{ backgroundColor: t.bg, color: isNavy ? '#fff' : SPANBIX_BRAND.textDark }}
    >
      {/* Subtle decorative bg pattern — different per tone, no motion */}
      {tone === 'cream' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 15%, rgba(39,100,228,0.05), transparent 38%), radial-gradient(circle at 88% 85%, rgba(16,44,86,0.04), transparent 42%)',
          }}
        />
      )}
      {tone === 'navy' && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      )}

      <div className={cn('relative max-w-7xl mx-auto px-5 sm:px-6 md:px-8', containerClassName)}>
        {(caption || title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'mb-9 sm:mb-12 md:mb-16 max-w-3xl',
              align === 'center' && 'mx-auto text-center'
            )}
          >
            {caption && (
              <div
                className={cn(
                  'flex items-center gap-3 mb-5',
                  align === 'center' && 'justify-center'
                )}
              >
                <span
                  aria-hidden
                  className="h-px w-10"
                  style={{ backgroundColor: t.rule }}
                />
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.28em] font-sora"
                  style={{ color: t.caption }}
                >
                  {caption}
                </p>
              </div>
            )}
            {title && (
              <h2
                className="font-serif text-[1.7rem] sm:text-[2.25rem] md:text-[3rem] tracking-[-0.015em] leading-[1.1] sm:leading-[1.08]"
                style={{ color: t.title }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="mt-4 sm:mt-5 text-[14.5px] sm:text-[15.5px] md:text-[17px] leading-relaxed font-sora"
                style={{ color: t.subtitle }}
              >
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  );
}
