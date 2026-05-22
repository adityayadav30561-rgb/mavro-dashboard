import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, Clock, AlertTriangle, AlertCircle, CheckCircle2, Eye,
  Sparkles, Flame, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dayKey, isSameDay, addDays } from '@/lib/contentCalendarIntel';

const SECTIONS = [
  { id: 'due_today',          label: 'Due today',         Icon: Flame,         tone: 'rose' },
  { id: 'overdue',            label: 'Overdue',           Icon: AlertCircle,   tone: 'rose' },
  { id: 'pending_reviews',    label: 'Pending reviews',   Icon: Eye,           tone: 'amber' },
  { id: 'scheduled_publishes',label: 'Scheduled publishes', Icon: Clock,       tone: 'violet' },
  { id: 'needs_attention',    label: 'Needs attention',   Icon: Sparkles,      tone: 'amber' },
  { id: 'upcoming',           label: 'Upcoming',          Icon: CalendarDays,  tone: 'cyan' },
];

const TONE_CLASSES = {
  rose:    'text-rose-300 bg-rose-500/10 border-rose-500/30',
  amber:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
  violet:  'text-violet-300 bg-violet-500/10 border-violet-500/30',
  cyan:    'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
};

/**
 * Operational Editorial Agenda — surfaces "what requires action right now"
 * across 6 sections derived from real fields on each blog. Each section is
 * collapsible. No fake data — everything pulls from blog.status, blog.dueAt,
 * blog.editorialStatus, blog.priority, blog.seoTitle, blog.featuredImage, etc.
 */
export default function CalendarAgendaView({ blogs, onSelectBlog }) {
  const sections = useMemo(() => classifyBlogs(blogs || []), [blogs]);
  const [openSection, setOpenSection] = useState({
    due_today: true, overdue: true, pending_reviews: true,
    scheduled_publishes: true, needs_attention: true, upcoming: false,
  });

  const empty = SECTIONS.every((s) => (sections[s.id] || []).length === 0);
  if (empty) {
    return (
      <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-10 text-center">
        <CheckCircle2 size={22} className="mx-auto text-emerald-400 mb-2" />
        <p className="text-[12px] font-semibold">Editorial agenda clear.</p>
        <p className="mt-1 text-[11px] text-muted-foreground">No overdue, scheduled, review-pending, or attention-needing items.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden">
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <CalendarDays size={14} className="text-violet-400" />
        <h3 className="text-sm font-bold tracking-tight">Editorial Agenda</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">
          {SECTIONS.reduce((s, sec) => s + (sections[sec.id] || []).length, 0)} actions
        </span>
      </div>

      <ul>
        {SECTIONS.map((s) => {
          const items = sections[s.id] || [];
          if (!items.length) return null;
          const isOpen = openSection[s.id];
          return (
            <li key={s.id} className="border-b border-border/40 last:border-b-0">
              <button
                onClick={() => setOpenSection({ ...openSection, [s.id]: !isOpen })}
                className="w-full px-5 py-2.5 flex items-center gap-2 hover:bg-foreground/[0.025] transition-colors"
              >
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] border', TONE_CLASSES[s.tone])}>
                  <s.Icon size={9} />
                  {s.label}
                </span>
                <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">{items.length}</span>
                <ChevronDown size={11} className={cn('text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden divide-y divide-border/30 bg-foreground/[0.012]"
                  >
                    {items.slice(0, 30).map((b) => (
                      <AgendaRow key={`${s.id}-${b._id}`} blog={b} sectionId={s.id} onSelect={() => onSelectBlog?.(b)} />
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ===== Classifier =====
function classifyBlogs(blogs) {
  const now = Date.now();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);
  const next7End = addDays(today, 8);

  const out = {
    due_today: [], overdue: [], pending_reviews: [], scheduled_publishes: [],
    needs_attention: [], upcoming: [],
  };

  for (const b of blogs) {
    // Skip archived from active agenda
    if (b.status === 'archived') continue;

    const due = b.dueAt ? new Date(b.dueAt) : null;
    const sched = b.scheduledAt ? new Date(b.scheduledAt) : null;
    const isReview = b.editorialStatus === 'review' || b.workflowStatus === 'review';

    // Due today
    if (due && isSameDay(due, today)) out.due_today.push(b);
    // Overdue — dueAt past + still not published
    if (due && due.getTime() < now && b.status !== 'published') out.overdue.push(b);
    // Pending reviews
    if (isReview) out.pending_reviews.push(b);
    // Scheduled publishes — future scheduledAt
    if (b.status === 'scheduled' && sched && sched.getTime() >= now) {
      out.scheduled_publishes.push(b);
    }
    // Upcoming — anything else with a forward date in next 7
    const rel = sched || due;
    if (rel && rel.getTime() >= tomorrow.getTime() && rel.getTime() < next7End.getTime()) {
      out.upcoming.push(b);
    }
    // Needs attention — heuristic flags on draft/review/scheduled blogs
    const flags = needsAttentionFlags(b);
    if (flags.length) out.needs_attention.push({ ...b, _flags: flags });
  }

  // Sort each bucket
  out.due_today.sort(byDueAsc);
  out.overdue.sort(byDueAsc);
  out.pending_reviews.sort(byUpdatedDesc);
  out.scheduled_publishes.sort(byScheduledAsc);
  out.upcoming.sort(byScheduledAsc);
  out.needs_attention.sort((a, b) => (b._flags.length - a._flags.length));

  return out;
}

function needsAttentionFlags(b) {
  const flags = [];
  if (!b.seoTitle?.trim()) flags.push('No SEO title');
  if (!b.seoDescription?.trim()) flags.push('No meta description');
  if (!b.featuredImage?.trim() && !b.ogImage?.trim()) flags.push('No featured image');
  if ((b.readingTime || 0) > 0 && (b.readingTime || 0) < 3) flags.push('Thin content');
  if (!b.reviewer && b.editorialStatus === 'review') flags.push('No reviewer assigned');
  if (b.status === 'draft' && b.updatedAt) {
    const daysStale = Math.floor((Date.now() - new Date(b.updatedAt).getTime()) / 86400000);
    if (daysStale > 14) flags.push(`Stale draft ${daysStale}d`);
  }
  return flags;
}

function byDueAsc(a, b) {
  return (new Date(a.dueAt).getTime() || 0) - (new Date(b.dueAt).getTime() || 0);
}
function byUpdatedDesc(a, b) {
  return (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0);
}
function byScheduledAsc(a, b) {
  return (new Date(a.scheduledAt).getTime() || 0) - (new Date(b.scheduledAt).getTime() || 0);
}

// ===== Row =====
function AgendaRow({ blog, sectionId, onSelect }) {
  const meta = relevantTimestamp(blog, sectionId);
  const priorityTone = {
    urgent: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    high:   'text-orange-300 bg-orange-500/10 border-orange-500/30',
    medium: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
    low:    'text-foreground/70 bg-foreground/[0.04] border-border/60',
  }[blog.priority || 'medium'];

  return (
    <li>
      <button onClick={onSelect} className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-foreground/[0.04] transition-colors text-left">
        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.14em] border flex-shrink-0', priorityTone)}>
          {blog.priority || 'medium'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold truncate">{blog.title}</p>
          <div className="text-[10.5px] text-muted-foreground truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
            {blog.targetWebsite?.name && <span>{blog.targetWebsite.name}</span>}
            {meta && (
              <span className="inline-flex items-center gap-0.5">
                <Clock size={9} /> {meta}
              </span>
            )}
            {blog.completionPercentage > 0 && <span className="font-mono">{blog.completionPercentage}%</span>}
            {blog._flags && blog._flags.length > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <AlertTriangle size={9} />
                {blog._flags.slice(0, 2).join(' · ')}
                {blog._flags.length > 2 && ` +${blog._flags.length - 2}`}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function relevantTimestamp(b, sectionId) {
  let d;
  if (sectionId === 'due_today' || sectionId === 'overdue') d = b.dueAt;
  else if (sectionId === 'scheduled_publishes' || sectionId === 'upcoming') d = b.scheduledAt || b.dueAt;
  else d = b.updatedAt;
  if (!d) return null;
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
