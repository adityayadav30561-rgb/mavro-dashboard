import { cn } from '@/lib/utils';

/**
 * Section header with title, description, and optional action.
 * Used inside pages to separate content sections.
 */
export default function SectionHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
