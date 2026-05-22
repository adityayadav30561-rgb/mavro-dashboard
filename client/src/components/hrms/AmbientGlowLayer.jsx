import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Fixed ambient lighting layer — cinematic gradient orbs floating in the background.
 * Sits behind all content. Both themes use it, intensity tuned per theme via CSS opacity.
 */
export default function AmbientGlowLayer({ className }) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 z-0 overflow-hidden', className)}>
      {/* Violet — top left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
        className="absolute -top-40 -left-40 w-[680px] h-[680px] rounded-full blur-[160px]"
        style={{
          background:
            'radial-gradient(circle, hsl(263 75% 60% / 0.32) 0%, transparent 65%)',
        }}
      />
      {/* Cyan — center right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.2 }}
        className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full blur-[160px]"
        style={{
          background:
            'radial-gradient(circle, hsl(192 85% 55% / 0.22) 0%, transparent 65%)',
        }}
      />
      {/* Rose — bottom left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.4 }}
        className="absolute bottom-0 left-1/4 w-[520px] h-[520px] rounded-full blur-[160px]"
        style={{
          background:
            'radial-gradient(circle, hsl(347 80% 60% / 0.18) 0%, transparent 65%)',
        }}
      />
    </div>
  );
}
