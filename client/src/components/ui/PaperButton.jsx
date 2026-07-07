import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The one button. Variants: primary (vermilion), secondary (paper + border),
 * ghost, danger. Sizes: sm (h-8), md (h-9), lg (h-10).
 *
 * <PaperButton icon={Download} loading={busy}>Download MBR</PaperButton>
 */
const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90 border border-primary',
  secondary: 'bg-card text-foreground border border-border hover:border-violet-500/50',
  ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] border border-transparent',
  danger: 'bg-destructive text-destructive-foreground hover:opacity-90 border border-destructive',
};

const SIZES = {
  sm: 'h-8 px-2.5 text-[11px] gap-1',
  md: 'h-9 px-3 text-xs gap-1.5',
  lg: 'h-10 px-4 text-sm gap-2',
};

const PaperButton = forwardRef(function PaperButton(
  { variant = 'primary', size = 'md', icon: Icon, loading = false, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : Icon && <Icon size={13} />}
      {children}
    </button>
  );
});

export default PaperButton;
