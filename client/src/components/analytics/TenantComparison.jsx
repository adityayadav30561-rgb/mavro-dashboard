import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ExternalLink, Globe, Activity } from 'lucide-react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

function Trend({ delta }) {
  if (delta == null) return null;
  const positive = delta >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[10px] font-semibold',
      positive ? 'text-emerald-400' : 'text-rose-400'
    )}>
      <Icon size={10} />
      {positive ? '+' : ''}{delta}%
    </span>
  );
}

export default function TenantComparison({ tenants }) {
  const list = tenants || [];
  if (list.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <Globe size={14} className="text-cyan-400" />
        <h3 className="text-title">Tenant Comparison</h3>
        <InfoPopover infoKey="tenantComparison" />
        <span className="ml-auto text-[10px] text-muted-foreground">{list.length} {list.length === 1 ? 'property' : 'properties'}</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
        {list.map((t, i) => {
          const accent = t.branding?.primaryColor || '#7c3aed';
          return (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-xl bg-foreground/[0.03] border border-border/70 p-4 overflow-hidden hover:border-border transition-all"
            >
              <span className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight truncate">{t.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{t.slug}</p>
                </div>
                <Trend delta={t.sessionsDelta} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <Mini label="Sessions"  value={t.sessions}        />
                <Mini label="Leads"     value={t.leads}           tone="text-amber-400" />
                <Mini label="Conv %"    value={`${t.conversionRate}%`} tone={t.conversionRate >= 2 ? 'text-emerald-400' : 'text-cyan-400'} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                <div>
                  <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">Views</p>
                  <p className="font-mono text-foreground">{t.pageViews}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">CTAs</p>
                  <p className="font-mono text-foreground">{t.ctaClicks}</p>
                </div>
              </div>

              {t.topPage && (
                <p className="mt-3 pt-3 border-t border-border/60 text-[10px] font-mono text-muted-foreground truncate">
                  <Activity size={9} className="inline mr-1" /> top · {t.topPage}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function Mini({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-foreground/[0.03] border border-border/60 px-2.5 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn('text-base font-bold font-mono mt-0.5 tabular-nums', tone || 'text-foreground')}>{value}</p>
    </div>
  );
}
