import { motion } from 'framer-motion';
import {
  Users, Eye, MousePointerClick, Send, Activity,
  TrendingUp, TrendingDown, Clock, Layers,
} from 'lucide-react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

function Trend({ delta, unit = '%' }) {
  if (delta == null || Number.isNaN(delta)) return null;
  const positive = delta >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-semibold',
      positive ? 'text-emerald-400' : 'text-rose-400'
    )}>
      <Icon size={10} />
      {positive ? '+' : ''}{delta}{unit}
    </span>
  );
}

function formatDuration(sec) {
  if (!sec || sec < 1) return '0s';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

const TILES = [
  { key: 'visitors',    icon: Users,              label: 'Visitors',     accent: 'violet',  infoKey: 'visitors' },
  { key: 'pageViews',   icon: Eye,                label: 'Page Views',   accent: 'cyan',    infoKey: 'pageViews' },
  { key: 'ctaClicks',   icon: MousePointerClick,  label: 'CTA Clicks',   accent: 'amber',   infoKey: 'ctaClicks' },
  { key: 'formSubmits', icon: Send,               label: 'Form Submits', accent: 'emerald', infoKey: 'formSubmits' },
  { key: 'leads',       icon: Activity,           label: 'Leads',        accent: 'rose',    infoKey: 'leads' },
];

const accentClass = {
  violet:  { icon: 'text-violet-400',  ring: 'shadow-[0_0_18px_-2px_hsl(263_70%_58%/0.5)]' },
  cyan:    { icon: 'text-cyan-400',    ring: 'shadow-[0_0_18px_-2px_hsl(192_85%_55%/0.5)]' },
  emerald: { icon: 'text-emerald-400', ring: 'shadow-[0_0_18px_-2px_hsl(160_70%_45%/0.5)]' },
  amber:   { icon: 'text-amber-400',   ring: 'shadow-[0_0_18px_-2px_hsl(38_85%_55%/0.5)]' },
  rose:    { icon: 'text-rose-400',    ring: 'shadow-[0_0_18px_-2px_hsl(347_75%_60%/0.5)]' },
};

export default function AnalyticsOverview({ overview, engagement, returning }) {
  const m = overview?.metrics || {};

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {TILES.map((t, i) => {
        const acc = accentClass[t.accent];
        const data = m[t.key] || { value: 0, delta: 0 };
        return (
          <motion.div
            key={t.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="relative rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-5 overflow-hidden hover:border-border hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center', acc.ring)}>
                <t.icon size={15} className={acc.icon} />
              </div>
              <Trend delta={data.delta} />
            </div>
            <div className="flex items-center gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.label}</p>
              <InfoPopover infoKey={t.infoKey} size={11} />
            </div>
            <p className="text-2xl font-bold font-mono mt-1 tabular-nums">{data.value ?? 0}</p>
          </motion.div>
        );
      })}

      {/* Engagement row */}
      {engagement && (
        <>
          <Tile icon={Clock}    label="Avg Session"     value={formatDuration(engagement.avgSessionDurationSec)} accent="cyan"    infoKey="avgSession" />
          <Tile icon={Layers}   label="Pages / Session" value={engagement.avgPagesPerSession || 0}                accent="violet"  infoKey="pagesPerSession" />
          <Tile icon={Activity} label="Bounce Rate"     value={`${engagement.bouncePct || 0}%`}                   accent={engagement.bouncePct > 60 ? 'rose' : 'emerald'} infoKey="bounceRate" />
          {returning && (
            <Tile
              icon={Users}
              label="Returning %"
              value={`${returning.returningPct || 0}%`}
              accent={returning.returningPct > 20 ? 'emerald' : 'amber'}
              infoKey="returningPct"
            />
          )}
        </>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, accent, infoKey }) {
  const acc = accentClass[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/60 backdrop-blur-xl border border-border/70 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center', acc?.ring)}>
          <Icon size={15} className={acc?.icon} />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        {infoKey && <InfoPopover infoKey={infoKey} size={11} />}
      </div>
      <p className="text-2xl font-bold font-mono mt-1 tabular-nums">{value}</p>
    </motion.div>
  );
}
