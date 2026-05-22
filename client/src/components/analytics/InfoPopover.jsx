import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { getMetricInfo } from '@/lib/analyticsCopy';
import { cn } from '@/lib/utils';

// ===================================
// InfoPopover
// ===================================
// Reusable contextual help primitive for Analytics Intelligence.
// - Hover-to-open on pointer devices
// - Tap-to-open on touch devices (mobile-safe)
// - Escape + outside-click close
// - Portaled to <body> so it never gets clipped by overflow: hidden parents
// - Auto-flips above the trigger if there's not enough room below
//
// Two usage patterns:
//   <InfoPopover infoKey="visitors" />                       // pulls from analyticsCopy
//   <InfoPopover title="..." text="..." />                   // custom inline

export default function InfoPopover({ infoKey, title, text, size = 12, className }) {
  const meta = infoKey ? getMetricInfo(infoKey) : { title, text };
  if (!meta?.text) return null;

  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'bottom' });
  const id = useId();

  // Detect touch capability — controls hover vs tap behavior
  const isTouchRef = useRef(false);
  useEffect(() => {
    isTouchRef.current = typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
  }, []);

  // Compute portal position relative to the trigger button
  const computePosition = () => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const POPOVER_W = 280;
    const POPOVER_H_EST = 100;
    const MARGIN = 8;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer below the trigger; flip if not enough room
    const spaceBelow = vh - rect.bottom;
    const placeAbove = spaceBelow < POPOVER_H_EST + MARGIN;

    let left = rect.left + rect.width / 2 - POPOVER_W / 2;
    left = Math.max(MARGIN, Math.min(vw - POPOVER_W - MARGIN, left));

    const top = placeAbove
      ? rect.top - POPOVER_H_EST - MARGIN
      : rect.bottom + MARGIN;

    setPosition({ top, left, placement: placeAbove ? 'top' : 'bottom' });
  };

  // Outside click + escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (
        buttonRef.current?.contains(e.target) ||
        popoverRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', computePosition);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', computePosition);
    };
  }, [open]);

  const openPopover = () => {
    computePosition();
    setOpen(true);
  };

  const handlePointerEnter = () => {
    if (isTouchRef.current) return;
    openPopover();
  };
  const handlePointerLeave = (e) => {
    if (isTouchRef.current) return;
    // Allow movement onto the popover itself before closing
    const next = e.relatedTarget;
    if (next instanceof Node && popoverRef.current?.contains(next)) return;
    setOpen(false);
  };
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) setOpen(false);
    else openPopover();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Explain ${meta.title || 'metric'}`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onFocus={handlePointerEnter}
        onBlur={() => !isTouchRef.current && setOpen(false)}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-foreground/[0.06] transition-all',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40',
          className
        )}
        style={{ width: size + 8, height: size + 8 }}
      >
        <Info size={size} aria-hidden />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={popoverRef}
              id={id}
              role="tooltip"
              initial={{ opacity: 0, scale: 0.94, y: position.placement === 'top' ? 4 : -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: position.placement === 'top' ? 4 : -4 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              onMouseLeave={() => !isTouchRef.current && setOpen(false)}
              className="fixed z-[80] w-[280px] rounded-xl bg-popover/95 backdrop-blur-xl border border-violet-500/30 shadow-[0_20px_50px_-12px_hsl(263_70%_50%/0.35)] p-4 pointer-events-auto"
              style={{ top: position.top, left: position.left }}
            >
              {/* Accent strip */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent rounded-t-xl"
              />
              {meta.title && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400 mb-1.5">
                  {meta.title}
                </p>
              )}
              <p className="text-[12.5px] text-foreground/85 leading-relaxed">
                {meta.text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
