import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, Eye, Users, Flame, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

export default function ContentPerformance({ blogs }) {
  const [sortKey, setSortKey] = useState('views');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    const arr = [...(blogs || [])];
    arr.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case 'title':       av = a.title?.toLowerCase() || ''; bv = b.title?.toLowerCase() || ''; break;
        case 'tenant':      av = a.tenant || ''; bv = b.tenant || ''; break;
        case 'sessions':    av = a.sessions || 0; bv = b.sessions || 0; break;
        case 'reading':     av = a.readingTime || 0; bv = b.readingTime || 0; break;
        case 'age':         av = a.ageDays ?? 99999; bv = b.ageDays ?? 99999; break;
        case 'views':
        default:            av = a.views || 0; bv = b.views || 0; break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
    return arr;
  }, [blogs, sortKey, sortDir]);

  const totalViews = rows.reduce((s, r) => s + (r.views || 0), 0);

  const setSort = (k) => {
    if (k === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const Th = ({ k, children, align = 'left' }) => (
    <th
      onClick={() => setSort(k)}
      className={cn(
        'cursor-pointer select-none px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition-colors',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortKey === k && <span className="text-violet-400">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <FileText size={14} className="text-emerald-400" />
        <h3 className="text-title">Content Performance</h3>
        <InfoPopover infoKey="contentPerformance" />
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">{rows.length} posts · {totalViews} views</span>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center">
          <FileText size={28} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold">No published blogs in scope</p>
          <p className="mt-1 text-xs text-muted-foreground">Publish content to start tracking blog-level performance.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-foreground/[0.025] border-b border-border/60">
              <tr>
                <Th k="title">Title</Th>
                <Th k="tenant">Tenant</Th>
                <Th k="views"    align="right">Views</Th>
                <Th k="sessions" align="right">Sessions</Th>
                <Th k="reading"  align="right">Read</Th>
                <Th k="age"      align="right">Age</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.slice(0, 20).map((b) => {
                const isHot = b.views >= 10;
                return (
                  <tr key={b._id} className="hover:bg-foreground/[0.025] transition-colors">
                    <td className="px-3 py-3 max-w-[320px]">
                      <p className="text-sm font-medium truncate">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">/{b.slug}</p>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground truncate max-w-[140px]">{b.tenant}</td>
                    <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums">
                      <span className={cn('inline-flex items-center gap-1', isHot ? 'text-amber-400' : '')}>
                        {isHot && <Flame size={10} />}
                        {b.views}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums">
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><Users size={10} /> {b.sessions}</span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-[12px] tabular-nums">
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock size={10} /> {b.readingTime || '—'}m</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-mono',
                        b.isStale ? 'text-rose-400' : 'text-muted-foreground'
                      )}>
                        {b.isStale && <AlertTriangle size={10} />}
                        {b.ageDays != null ? `${b.ageDays}d` : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
