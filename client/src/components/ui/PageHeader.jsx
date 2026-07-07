import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inkColor } from '@/lib/inks';

/**
 * Standard page header — eyebrow caption, Fraunces display title, subtitle,
 * right-aligned actions slot. `ink` picks the section's domain accent.
 *
 * <PageHeader ink="teal" eyebrow="Operational Telemetry" icon={BarChart3}
 *   title="Analytics Intelligence" subtitle="…" actions={<…/>} backTo="/mbr" />
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  ink = 'vermilion',
  actions,
  backTo,
  backLabel = 'Back',
  className,
}) {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5', className)}>
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-[11px] font-semibold hover:opacity-75 transition mb-1"
            style={{ color: inkColor(ink) }}
          >
            <ArrowLeft size={12} /> {backLabel}
          </Link>
        )}
        {eyebrow && (
          <p className="text-caption mb-1.5" style={{ color: inkColor(ink, 0.85) }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-headline flex items-center gap-2.5">
          {Icon && <Icon size={20} style={{ color: inkColor(ink) }} className="flex-shrink-0" />}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
