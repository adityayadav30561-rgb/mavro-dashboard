import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Thin operational progress bar at the very top of the page.
 * Tracks scroll-y with spring smoothing.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 22,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 shadow-[0_0_12px_hsl(263_70%_60%/0.6)]"
      style={{ scaleX }}
    />
  );
}
