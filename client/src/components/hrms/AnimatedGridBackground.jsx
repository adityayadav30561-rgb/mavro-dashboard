import { cn } from '@/lib/utils';

/**
 * Subtle perspective grid — operational HUD vibe.
 * Pure CSS, no JS animation cost.
 */
export default function AnimatedGridBackground({ className, fade = true }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-0 overflow-hidden',
        className
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.18] dark:opacity-[0.22]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.08) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: fade
            ? 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)'
            : undefined,
          WebkitMaskImage: fade
            ? 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 80%)'
            : undefined,
        }}
      />
    </div>
  );
}
