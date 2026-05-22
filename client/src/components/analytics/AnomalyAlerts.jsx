import { motion } from 'framer-motion';
import {
  AlertCircle, AlertTriangle, Info, TrendingUp, TrendingDown,
  ShieldCheck, FileText, Activity, Clock,
} from 'lucide-react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

const KIND_ICON = {
  traffic_spike:    TrendingUp,
  traffic_drop:     TrendingDown,
  conversion_drop:  AlertCircle,
  bounce_spike:     Activity,
  inactive_tenant:  AlertTriangle,
  stale_tenant:     Clock,
  declining_blog:   TrendingDown,
};

const SEV_CLASS = {
  critical: 'text-rose-400 bg-rose-500/10 border-rose-500/40',
  warning:  'text-amber-400 bg-amber-500/10 border-amber-500/40',
  notice:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/40',
};

export default function AnomalyAlerts({ anomalies = [] }) {
  if (anomalies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card/60 backdrop-blur-xl border border-emerald-500/30 p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-emerald-400" />
          <h3 className="text-title">Anomaly Detection</h3>
          <InfoPopover infoKey="anomalies" />
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
            All clear
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground mt-2">
          No traffic spikes, drops, conversion regressions, bounce anomalies, inactive tenants, or declining blogs detected in selected window.
        </p>
      </motion.div>
    );
  }

  const counts = {
    critical: anomalies.filter((a) => a.severity === 'critical').length,
    warning:  anomalies.filter((a) => a.severity === 'warning').length,
    notice:   anomalies.filter((a) => a.severity === 'notice').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <AlertCircle size={14} className="text-rose-400" />
        <h3 className="text-title">Anomaly Detection</h3>
        <div className="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]">
          {counts.critical > 0 && <span className="text-rose-400">{counts.critical} critical</span>}
          {counts.warning > 0 && <span className="text-amber-400">{counts.warning} warning</span>}
          {counts.notice > 0 && <span className="text-cyan-400">{counts.notice} notice</span>}
        </div>
      </div>
      <ul className="divide-y divide-border/60">
        {anomalies.map((a, i) => {
          const Icon = KIND_ICON[a.kind] || Info;
          return (
            <motion.li
              key={`${a.kind}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="px-5 py-3 flex items-start gap-3"
            >
              <span className={cn('flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border', SEV_CLASS[a.severity])}>
                <Icon size={14} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <span className={cn('text-[9px] uppercase tracking-[0.18em] font-bold px-1.5 py-0.5 rounded', SEV_CLASS[a.severity])}>
                    {a.severity}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">{a.kind}</span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{a.message}</p>
                <p className="text-[11px] text-foreground/70 mt-1.5 leading-snug">→ {a.recommendation}</p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
