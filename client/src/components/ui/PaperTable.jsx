import { cn } from '@/lib/utils';
import EmptyState from './EmptyState';

/**
 * Ledger-style table — hairline rules, caps header, right-aligned tabular
 * numerals. Two usage modes:
 *
 *  1) Declarative cells:
 *     <PaperTable
 *       columns={[{ key: 'title', label: 'Title' },
 *                 { key: 'views', label: 'Views', align: 'right', mono: true }]}
 *       rows={rows} rowKey={(r) => r.id} />
 *
 *  2) Custom rows (full control):
 *     <PaperTable columns={[…]} rows={rows} renderRow={(r, i) => <tr>…</tr>} />
 *
 * Column: { key, label, align: 'left'|'right', mono: bool, render?: (row) => node }
 */
export default function PaperTable({ columns, rows, renderRow, rowKey, empty = 'No data in this window', className }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-[11px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border/60">
            {columns.map((c) => (
              <th
                key={c.key || c.label}
                className={cn('px-5 py-2.5 font-medium whitespace-nowrap', (c.align === 'right') && 'text-right')}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-4">
                <EmptyState note={empty} compact />
              </td>
            </tr>
          )}
          {renderRow
            ? rows.map(renderRow)
            : rows.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key || c.label}
                      className={cn('px-5 py-2 align-top', c.align === 'right' && 'text-right', c.mono && 'font-mono')}
                    >
                      {c.render ? c.render(row) : row[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
