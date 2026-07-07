import { cn } from '@/lib/utils';

/**
 * File-folder index tabs — the physical-tab control for switching views.
 * Active tab rises and fuses with the content below it, like the labeled
 * tab on a manila folder. Styling lives in index.css (.index-tabs).
 *
 * <IndexTabs tabs={[{ value: 'day', label: 'Day' }, …]} value={range} onChange={setRange} />
 */
export default function IndexTabs({ tabs, value, onChange, size = 'md', className }) {
  return (
    <div className={cn('index-tabs', size === 'sm' && 'index-tabs-sm', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn('index-tab', value === t.value && 'index-tab-active')}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
