import { motion, AnimatePresence } from 'framer-motion';
import { Kanban, Clock, AlertCircle, User, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

// New 5-column operational pipeline
const COLUMNS = [
  { id: 'ideas',     label: 'Ideas',     tone: 'zinc',    accent: 'bg-zinc-500' },
  { id: 'drafting',  label: 'Drafting',  tone: 'amber',   accent: 'bg-amber-500' },
  { id: 'review',    label: 'Review',    tone: 'orange',  accent: 'bg-orange-500' },
  { id: 'scheduled', label: 'Scheduled', tone: 'violet',  accent: 'bg-violet-500' },
  { id: 'published', label: 'Published', tone: 'emerald', accent: 'bg-emerald-500' },
];

const COL_TONES = {
  zinc:    'text-zinc-300 bg-zinc-500/10 border-zinc-500/30',
  amber:   'text-amber-300 bg-amber-500/10 border-amber-500/30',
  orange:  'text-orange-300 bg-orange-500/10 border-orange-500/30',
  violet:  'text-violet-300 bg-violet-500/10 border-violet-500/30',
  emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
};

const PRIORITY_TONES = {
  urgent: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
  high:   'text-orange-300 bg-orange-500/10 border-orange-500/30',
  medium: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  low:    'text-foreground/70 bg-foreground/[0.04] border-border/60',
};

/**
 * Editorial Kanban — 5 operational columns. Drag a card across to fire
 * onEditorialChange(blogId, newEditorialStatus). Backend bridges to
 * publish-state status automatically so the public site reflects reality.
 */
export default function EditorialKanban({ blogs, onEditorialChange, onSelectBlog }) {
  // Bucket blogs by editorialStatus. Fall back to publish-status mapping
  // for blogs still using the legacy field.
  const byCol = {};
  for (const c of COLUMNS) byCol[c.id] = [];
  for (const b of blogs || []) {
    if (b.status === 'archived') continue; // archived = hidden
    let col = b.editorialStatus || mapPublishToEditorial(b);
    if (!byCol[col]) col = 'drafting';
    byCol[col].push(b);
  }

  const handleDrop = (colId, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/blog-id');
    if (!id) return;
    onEditorialChange?.(id, colId);
  };

  return (
    <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden">
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <Kanban size={14} className="text-violet-400" />
        <h3 className="text-sm font-bold tracking-tight">Editorial Pipeline</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">drag cards between columns</span>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-flow-col auto-cols-[minmax(260px,1fr)] gap-3 p-4 min-w-full">
          {COLUMNS.map((c) => (
            <div
              key={c.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(c.id, e)}
              className="rounded-xl bg-foreground/[0.02] border border-border/60 flex flex-col min-h-[480px]"
            >
              <div className="px-3 py-2 border-b border-border/60 flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', c.accent)} />
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] flex-1">{c.label}</p>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{byCol[c.id].length}</span>
              </div>
              <ul className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[560px]">
                <AnimatePresence initial={false}>
                  {byCol[c.id].map((b) => (
                    <KanbanCard key={b._id} blog={b} tone={c.tone} onSelect={() => onSelectBlog?.(b)} />
                  ))}
                </AnimatePresence>
                {byCol[c.id].length === 0 && (
                  <li className="text-[10.5px] text-muted-foreground/70 text-center py-4 italic">drop here</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function mapPublishToEditorial(b) {
  if (b.status === 'published') return 'published';
  if (b.status === 'scheduled') return 'scheduled';
  // Use workflowStatus signal if present
  if (b.workflowStatus === 'idea' || b.workflowStatus === 'outline') return 'ideas';
  if (b.workflowStatus === 'review') return 'review';
  return 'drafting';
}

function KanbanCard({ blog, tone, onSelect }) {
  const t = COL_TONES[tone] || COL_TONES.zinc;
  const due = blog.dueAt ? new Date(blog.dueAt) : null;
  const overdue = due && due.getTime() < Date.now() && blog.status !== 'published';
  const priority = blog.priority || 'medium';
  const completion = Math.max(0, Math.min(100, blog.completionPercentage || 0));
  const assignee = blog.assignedTo?.name || blog.assignedTo?.email || null;
  const campaign = blog.campaign?.name || null;
  const campaignColor = blog.campaign?.color || 'violet';
  const seoScore = blog.seoScore ?? null; // optional — present when caller hydrates

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22 }}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/blog-id', blog._id)}
      onClick={onSelect}
      className={cn(
        'rounded-lg border p-2.5 cursor-grab active:cursor-grabbing hover:translate-x-0.5 transition-transform space-y-1.5',
        t,
      )}
    >
      {/* Top row — priority + isUpdating flag */}
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em] font-bold">
        <span className={cn('px-1.5 py-0.5 rounded border', PRIORITY_TONES[priority])}>{priority}</span>
        {blog.isUpdating && <span className="px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300">updating</span>}
        {campaign && (
          <span className={cn('px-1.5 py-0.5 rounded border truncate max-w-[120px]', `border-${campaignColor}-500/40 bg-${campaignColor}-500/10 text-${campaignColor}-300`)}>
            {campaign}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-[11.5px] font-semibold leading-tight line-clamp-2">{blog.title}</p>

      {/* Meta row */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground tabular-nums">
        {blog.targetWebsite?.name && <span className="truncate flex-1">{blog.targetWebsite.name}</span>}
        {seoScore != null && <span className={seoScoreTone(seoScore)}>SEO {seoScore}</span>}
        {blog.readingTime > 0 && <span>{blog.readingTime}m</span>}
      </div>

      {/* Bottom row — assignee + due + progress */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {assignee && (
          <span className="inline-flex items-center gap-0.5 truncate">
            <User size={9} /> {assignee}
          </span>
        )}
        {due && (
          <span className={cn('inline-flex items-center gap-0.5', overdue && 'text-rose-400')}>
            {overdue ? <AlertCircle size={9} /> : <CalendarClock size={9} />}
            {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Completion bar */}
      {completion > 0 && (
        <div className="h-1 rounded-full bg-foreground/[0.06] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 0.4 }}
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
          />
        </div>
      )}
    </motion.li>
  );
}

function seoScoreTone(s) {
  if (s >= 80) return 'text-emerald-400';
  if (s >= 60) return 'text-cyan-400';
  if (s >= 40) return 'text-amber-400';
  return 'text-rose-400';
}
