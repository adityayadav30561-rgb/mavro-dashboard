import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, MousePointerClick, FileText, Send, Activity, ExternalLink,
} from 'lucide-react';
import InfoPopover from './InfoPopover';
import { cn } from '@/lib/utils';

const eventMeta = {
  page_view:   { icon: Eye,              tone: 'violet',  label: 'page view' },
  blog_view:   { icon: FileText,         tone: 'cyan',    label: 'blog view' },
  cta_click:   { icon: MousePointerClick,tone: 'amber',   label: 'CTA click' },
  form_submit: { icon: Send,             tone: 'emerald', label: 'form submit' },
};

const toneClass = {
  violet:  'text-violet-400 bg-violet-500/10 border-violet-500/30',
  cyan:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  amber:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function RealtimeEventFeed({ realtime }) {
  const events = realtime?.events || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden flex flex-col"
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <Activity size={14} className="text-emerald-400" />
        <h3 className="text-title">Live Event Stream</h3>
        <InfoPopover infoKey="realtime" />
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          last {realtime?.sinceMinutes || 30}m
        </span>
      </div>

      {events.length === 0 ? (
        <div className="p-10 text-center">
          <Activity size={24} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm font-semibold">No live events yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Visit a public site to populate the stream.</p>
        </div>
      ) : (
        <ul className="max-h-[440px] overflow-y-auto divide-y divide-border/40">
          <AnimatePresence initial={false}>
            {events.map((e, i) => {
              const meta = eventMeta[e.eventType] || { icon: Activity, tone: 'violet', label: e.eventType };
              const Icon = meta.icon;
              return (
                <motion.li
                  key={e._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="px-5 py-3 flex items-start gap-3 hover:bg-foreground/[0.025] transition-colors"
                >
                  <span className={cn('flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border', toneClass[meta.tone])}>
                    <Icon size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium leading-snug">
                      <span className="text-foreground capitalize">{meta.label}</span>
                      <span className="text-muted-foreground"> · </span>
                      <span className="font-mono text-foreground/80 truncate">{e.page || '/'}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-mono">{e.websiteSlug}</span>
                      {e.meta?.ctaName && <> · CTA <span className="text-amber-400">{e.meta.ctaName}</span></>}
                      {e.meta?.blogSlug && <> · blog <span className="text-cyan-400">{e.meta.blogSlug}</span></>}
                      {e.meta?.formId && <> · form <span className="text-emerald-400">{e.meta.formId}</span></>}
                      {e.deviceType && <> · {e.deviceType}</>}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{timeAgo(e.timestamp)}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
}
