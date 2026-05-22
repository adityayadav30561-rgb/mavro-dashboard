import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowUpFromLine, Activity, BookOpen, ExternalLink } from 'lucide-react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

function PageList({ items, label, icon: Icon, accent, keyName, infoKey }) {
  const accentClass = {
    violet:  'text-violet-400',
    cyan:    'text-cyan-400',
    emerald: 'text-emerald-400',
    rose:    'text-rose-400',
    amber:   'text-amber-400',
  }[accent];

  const max = items.reduce((m, r) => Math.max(m, r[keyName] || 0), 0) || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <Icon size={13} className={accentClass} />
        <h3 className="text-title">{label}</h3>
        {infoKey && <InfoPopover infoKey={infoKey} />}
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-xs text-muted-foreground">No data in window</p>
        </div>
      ) : (
        <ul className="p-2">
          {items.map((it, i) => {
            const pct = (it[keyName] / max) * 100;
            return (
              <motion.li
                key={it.page + i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative px-3 py-2 rounded-lg hover:bg-foreground/[0.025] transition-colors overflow-hidden"
              >
                <div
                  className={cn('absolute inset-y-0 left-0 transition-all', accent === 'violet' ? 'bg-violet-500/[0.07]' : accent === 'cyan' ? 'bg-cyan-500/[0.07]' : accent === 'rose' ? 'bg-rose-500/[0.07]' : 'bg-emerald-500/[0.07]')}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground w-5">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-medium truncate flex-1">{it.page}</span>
                  <span className="text-sm font-mono font-semibold tabular-nums w-12 text-right">{it[keyName]}</span>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

export default function TrafficIntelligence({ landingPages = [], exitPages = [], topBlogs = [] }) {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <PageList items={landingPages} label="Top Landing Pages" icon={ArrowDownToLine} accent="emerald" keyName="landings" infoKey="topLanding" />
      <PageList items={exitPages}    label="Top Exit Pages"    icon={ArrowUpFromLine} accent="rose"    keyName="exits"    infoKey="topExit" />

      {/* Top blogs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
          <BookOpen size={13} className="text-cyan-400" />
          <h3 className="text-title">Top Blogs</h3>
          <InfoPopover infoKey="topBlogs" />
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">{topBlogs.length}</span>
        </div>
        {topBlogs.length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen size={20} className="mx-auto text-muted-foreground/40 mb-1" />
            <p className="text-xs text-muted-foreground">No blog views yet</p>
          </div>
        ) : (
          <ul className="p-2">
            {topBlogs.map((b, i) => (
              <motion.li
                key={b.blogSlug + i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="px-3 py-2 rounded-lg hover:bg-foreground/[0.025] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground w-5">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{b.blog?.title || b.blogSlug}</p>
                    <p className="text-[10px] text-muted-foreground truncate">/{b.blogSlug}</p>
                  </div>
                  <span className="text-sm font-mono font-semibold tabular-nums w-12 text-right">{b.views}</span>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
