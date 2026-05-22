import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildMonthGrid, bucketBlogsByDay, dayKey, isSameDay, addDays } from '@/lib/contentCalendarIntel';

const STATUS_TONE = {
  draft:     'bg-foreground/[0.06] text-foreground/80 border-border/60',
  scheduled: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  published: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  archived:  'bg-zinc-500/15 text-zinc-400 border-zinc-500/40',
};

/**
 * Month grid view — 6×7 cells, week-aligned. Each cell shows up to 3 blog
 * pills with overflow indicator. Supports HTML5 drag-and-drop reschedule
 * (drag a blog onto another date → fires onReschedule).
 */
export default function CalendarMonthView({
  anchor,
  blogs,
  onPrev,
  onNext,
  onToday,
  onReschedule,
  onSelectBlog,
  onCreateAt,
}) {
  const grid = buildMonthGrid(anchor);
  const byDay = bucketBlogsByDay(blogs);
  const monthLabel = new Date(anchor).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const today = new Date();
  const weekHeads = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const currentMonth = new Date(anchor).getMonth();

  const onDrop = (date, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/blog-id');
    if (!id) return;
    const dt = new Date(date);
    dt.setHours(9, 0, 0, 0); // default to 9am local
    onReschedule?.(id, dt.toISOString());
  };

  return (
    <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden">
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <button onClick={onPrev} className="p-1.5 rounded-md hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors" title="Previous month"><ChevronLeft size={14} /></button>
        <button onClick={onToday} className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-[0.16em] bg-foreground/[0.04] border border-border/60 hover:bg-foreground/[0.08] transition-colors">Today</button>
        <button onClick={onNext} className="p-1.5 rounded-md hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors" title="Next month"><ChevronRight size={14} /></button>
        <h3 className="ml-3 text-sm font-bold tracking-tight">{monthLabel}</h3>
      </div>

      <div className="grid grid-cols-7 border-b border-border/60 bg-foreground/[0.02]">
        {weekHeads.map((w) => (
          <div key={w} className="px-2 py-2 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground text-center">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6">
        {grid.map((d, i) => {
          const isToday = isSameDay(d, today);
          const isCurrMonth = d.getMonth() === currentMonth;
          const cellBlogs = byDay.get(dayKey(d)) || [];
          return (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(d, e)}
              className={cn(
                'group min-h-[100px] border-r border-b border-border/40 p-1.5 flex flex-col gap-1 transition-colors',
                !isCurrMonth && 'bg-foreground/[0.015] opacity-60',
                isToday && 'bg-violet-500/[0.04] ring-1 ring-violet-500/30 ring-inset',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-[11px] font-mono tabular-nums',
                  isToday ? 'text-violet-300 font-bold' : 'text-muted-foreground',
                )}>
                  {d.getDate()}
                </span>
                {isCurrMonth && (
                  <button
                    onClick={() => onCreateAt?.(d)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-violet-300 hover:bg-violet-500/15 transition-all"
                    title="Schedule blog on this day"
                  >
                    <Plus size={10} />
                  </button>
                )}
              </div>

              {cellBlogs.slice(0, 3).map((b) => (
                <motion.button
                  layout
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/blog-id', b._id)}
                  onClick={() => onSelectBlog?.(b)}
                  key={b._id}
                  className={cn(
                    'text-left rounded px-1.5 py-1 text-[10.5px] leading-tight border truncate cursor-grab active:cursor-grabbing hover:translate-x-0.5 transition-transform',
                    STATUS_TONE[b.status] || STATUS_TONE.draft,
                  )}
                  title={`${b.title}\n${b.status}`}
                >
                  <span className="block truncate font-medium">{b.title}</span>
                </motion.button>
              ))}
              {cellBlogs.length > 3 && (
                <span className="text-[9.5px] text-muted-foreground font-mono pl-1">+{cellBlogs.length - 3} more</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
