import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Section wrapper with editorial caption + headline rhythm.
 * Centralizes spacing, typography hierarchy, and reveal animation.
 */
export default function EditorialSection({
  id,
  caption,
  title,
  subtitle,
  align = 'left',
  className,
  containerClassName,
  children,
}) {
  return (
    <section
      id={id}
      className={cn('relative py-24 md:py-32', className)}
    >
      <div className={cn('max-w-7xl mx-auto px-6 md:px-8', containerClassName)}>
        {(caption || title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className={cn(
              'mb-14 md:mb-20 max-w-3xl',
              align === 'center' && 'mx-auto text-center'
            )}
          >
            {caption && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-400 mb-4">
                {caption}
              </p>
            )}
            {title && (
              <h2 className="text-[2.25rem] md:text-5xl font-bold tracking-[-0.02em] leading-[1.05]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
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
