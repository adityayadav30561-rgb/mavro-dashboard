import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { LineChart, Activity } from 'lucide-react';
import InfoPopover from './InfoPopover';

function formatTick(ts, range) {
  const d = new Date(ts);
  if (range === 'day')   return d.toLocaleTimeString(undefined, { hour: '2-digit', hour12: false });
  if (range === 'year')  return d.toLocaleDateString(undefined, { month: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function CustomTip({ active, payload, label, range }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-popover/95 backdrop-blur-xl border border-border px-3 py-2 text-[11px] shadow-xl">
      <p className="font-semibold mb-1.5">{formatTick(label, range)}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-2 font-mono font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function TrafficTimeline({ series, range }) {
  const data = (series || []).map((s) => ({
    ts: s.ts,
    views: s.views,
    sessions: s.sessions,
    formSubmits: s.formSubmits,
  }));

  const empty = data.every((p) => p.views === 0 && p.sessions === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-border/60">
        <div>
          <p className="text-caption text-violet-400/70">Performance</p>
          <h3 className="text-title mt-1 flex items-center gap-2">
            <LineChart size={14} className="text-violet-400" />
            Traffic & Sessions
            <InfoPopover infoKey="trafficSessions" />
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <Legend color="hsl(263 70% 58%)" label="Views" />
          <Legend color="hsl(192 91% 56%)" label="Sessions" />
          <Legend color="hsl(160 70% 45%)" label="Submits" />
        </div>
      </div>
      <div className="px-2 pb-4 pt-2 h-[280px]">
        {empty ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Activity size={28} className="text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold">No events in selected window</p>
            <p className="mt-1 text-xs text-muted-foreground">Visit one of your public sites to start populating the timeline.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(263, 70%, 58%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(263, 70%, 58%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(192, 91%, 56%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(192, 91%, 56%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSubmits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
              <XAxis
                dataKey="ts"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => formatTick(v, range)}
                minTickGap={28}
              />
              <YAxis hide />
              <Tooltip content={<CustomTip range={range} />} />
              <Area type="monotone" dataKey="views"       stroke="hsl(263, 70%, 58%)" strokeWidth={2} fill="url(#gViews)"    dot={false} activeDot={{ r: 4, fill: 'hsl(263, 70%, 58%)', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="sessions"    stroke="hsl(192, 91%, 56%)" strokeWidth={2} fill="url(#gSessions)" dot={false} activeDot={{ r: 4, fill: 'hsl(192, 91%, 56%)', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="formSubmits" stroke="hsl(160, 70%, 45%)" strokeWidth={2} fill="url(#gSubmits)"  dot={false} activeDot={{ r: 4, fill: 'hsl(160, 70%, 45%)', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
