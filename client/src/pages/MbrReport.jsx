import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Users, UserPlus, Eye, Clock, Activity, TrendingUp, TrendingDown,
  Phone, MessageCircle, MousePointerClick, FileDown, Send, Sparkles,
  Search as SearchIcon, Globe, MonitorSmartphone, MapPin, Loader2,
  AlertTriangle, RefreshCw, BarChart3, Download, Plus, Trash2, Pencil,
  FileText, ClipboardList, FolderKanban, UserSquare2, ChevronRight, ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import {
  getMbrStatus, getMbrGa4, getMbrGsc, getMbrButtons,
  getMbrSections, getMbrItems, createMbrItem, updateMbrItem, deleteMbrItem,
  getMbrBlogs, downloadMbrExport,
} from '@/api/mbr';
import GeoMap from '@/components/mbr/GeoMap';
import { chartSeries } from '@/lib/chartTheme';

// Series palette — validated (dataviz six checks, light + dark surfaces).
// Color follows the entity, fixed assignment, never cycled. Getters resolve
// at render so the active theme's series is used.
const C = {
  get violet() { return chartSeries().a; },
  get cyan() { return chartSeries().b; },
  get green() { return chartSeries().c; },
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const nf = new Intl.NumberFormat('en-IN');
const fmtNum = (n) => nf.format(Math.round(n || 0));

function fmtDuration(sec) {
  if (!sec || sec < 1) return '0s';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

function deltaPct(current, previous) {
  if (previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function fmtGa4Date(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fmtIsoDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function lastMonths(count = 13) {
  const now = new Date();
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ value, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Small primitives
// ---------------------------------------------------------------------------
function Trend({ delta }) {
  if (delta == null || Number.isNaN(delta)) return null;
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

function StatTile({ icon: Icon, label, value, delta, hint, i = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.04 }}
      className="relative rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-4 overflow-hidden hover:border-border transition-all"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="w-8 h-8 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center">
          <Icon size={14} className="text-violet-400" />
        </div>
        <Trend delta={delta} />
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{hint}</p>}
    </motion.div>
  );
}

function Card({ title, caption, icon: Icon, children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden', className)}
    >
      <div className="px-5 py-4 border-b border-border/60">
        <p className="text-caption text-violet-400/70">{caption}</p>
        <h3 className="text-title mt-1 flex items-center gap-2">
          {Icon && <Icon size={14} className="text-violet-400" />}
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function SectionHeading({ children, id }) {
  return (
    <h2 id={id} className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mt-8 mb-3 scroll-mt-24">
      {children}
    </h2>
  );
}

// Sticky jump-bar for the long source report, with scroll-spy highlighting.
const SOURCE_SECTIONS = [
  { id: 'sec-audience', label: 'Audience' },
  { id: 'sec-acquisition', label: 'Acquisition' },
  { id: 'sec-conversions', label: 'Conversions' },
  { id: 'sec-content', label: 'Content' },
  { id: 'sec-search', label: 'Search' },
  { id: 'sec-geography', label: 'Geography' },
];

function SectionNav() {
  const [active, setActive] = useState(SOURCE_SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Topmost visible heading wins
        const visible = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    SOURCE_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const jump = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sticky top-2 z-20 mb-2">
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-card/95 backdrop-blur px-1.5 py-1.5 shadow-sm">
        {SOURCE_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => jump(s.id)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors',
              active === s.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-popover/95 backdrop-blur-xl border border-border px-3 py-2 text-[11px] shadow-xl">
      <p className="font-semibold mb-1.5">{labelFormatter ? labelFormatter(label) : label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-2 font-mono font-semibold text-foreground">{fmtNum(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// Horizontal magnitude rows — identity lives in the row label, single hue fill.
function BarRows({ rows, max }) {
  const top = max || Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="px-5 py-4 space-y-2.5">
      {rows.length === 0 && <EmptyNote />}
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="truncate pr-3">{r.label}</span>
            <span className="font-mono font-semibold">{fmtNum(r.value)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-foreground/[0.05] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (r.value / top) * 100)}%`, background: C.violet }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DataTable({ columns, rows, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border/60">
            {columns.map((c, i) => (
              <th key={c} className={cn('px-5 py-2.5 font-medium whitespace-nowrap', i > 0 && 'text-right')}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-5 py-6 text-center text-muted-foreground">No data in this window</td></tr>
          )}
          {rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}

const Td = ({ children, right, mono, className }) => (
  <td className={cn('px-5 py-2', right && 'text-right', mono && 'font-mono', className)}>{children}</td>
);

function EmptyNote({ text = 'No data in this window' }) {
  return <p className="py-6 text-center text-[11px] text-muted-foreground">{text}</p>;
}

const SECTION_ICONS = {
  ppts_videos: FileText,
  work_log: ClipboardList,
  other_projects: FolderKanban,
  manual_leads: UserSquare2,
};

// Static detail views (/mbr/<view>) → manual section key. Any other view
// value is treated as a GA4/GSC source key (/mbr/spanbix, /mbr/saisatwik…).
const STATIC_VIEWS = {
  blogs: null,
  development: 'work_log',
  ppts: 'ppts_videos',
  projects: 'other_projects',
  leads: 'manual_leads',
};

// Hub tile — one workstream on the overview grid
function HubTile({ icon: Icon, title, description, statusChip, statusTone = 'auto', onClick, i = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: i * 0.04 }}
      onClick={onClick}
      className="text-left rounded-2xl bg-card/70 border border-border/70 p-4 hover:border-violet-500/50 transition-colors group w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] border border-border flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-violet-400" />
        </div>
        <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-violet-400 group-hover:translate-x-0.5 transition mt-2" />
      </div>
      <p className="text-sm font-semibold mt-3">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>
      <span className={cn(
        'inline-block mt-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full',
        statusTone === 'auto' && 'bg-emerald-500/15 text-emerald-500',
        statusTone === 'manual' && 'bg-amber-500/15 text-amber-500',
        statusTone === 'off' && 'bg-foreground/[0.06] text-muted-foreground'
      )}>
        {statusChip}
      </span>
    </motion.button>
  );
}

function HubGroup({ label, children }) {
  return (
    <div>
      <SectionHeading>{label}</SectionHeading>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

// Editable manual-workstream tile — table of rows + inline add/edit form.
function WorkstreamTile({ section, items, period, onChanged }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // item being edited
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const Icon = SECTION_ICONS[section.key] || ClipboardList;

  const openAdd = () => { setEditing(null); setDraft({}); setFormOpen(true); };
  const openEdit = (item) => { setEditing(item); setDraft({ ...(item.data || {}) }); setFormOpen(true); };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (editing) await updateMbrItem(editing._id, { data: draft });
      else await createMbrItem({ section: section.key, period, data: draft });
      toast.success(editing ? 'Entry updated' : 'Entry added');
      setFormOpen(false);
      onChanged();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    try {
      await deleteMbrItem(item._id);
      toast.success('Entry removed');
      onChanged();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <Card caption="Manual workstream" title={section.label} icon={Icon}>
      <p className="px-5 pt-2 text-[10px] text-muted-foreground">{section.description}</p>
      <div className="overflow-x-auto mt-1">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border/60">
              {section.columns.map((c) => (
                <th key={c.key} className="px-4 py-2 font-medium whitespace-nowrap">{c.label}</th>
              ))}
              <th className="px-3 py-2 w-16" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={section.columns.length + 1} className="px-4 py-5 text-center text-muted-foreground">Nothing recorded for this month yet</td></tr>
            )}
            {items.map((item) => (
              <tr key={item._id} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02] group">
                {section.columns.map((c) => (
                  <td key={c.key} className="px-4 py-2 align-top max-w-[280px]">
                    <span className="whitespace-pre-wrap break-words">{item.data?.[c.key] || <span className="text-muted-foreground/40">—</span>}</span>
                  </td>
                ))}
                <td className="px-3 py-2 whitespace-nowrap text-right">
                  <button onClick={() => openEdit(item)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition" title="Edit">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => remove(item)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition" title="Delete">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 pb-4 pt-2">
        {!formOpen ? (
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-400 hover:opacity-80 transition">
            <Plus size={12} /> Add entry
          </button>
        ) : (
          <div className="rounded-lg border border-border/70 bg-foreground/[0.02] p-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {editing ? 'Edit entry' : 'New entry'} · {period}
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {section.columns.map((c) => (
                <label key={c.key} className={cn('block', (c.key === 'work' || c.key === 'risk' || c.key === 'outcome' || c.key === 'notes' || c.key === 'topic') && 'sm:col-span-2')}>
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                  {c.type === 'select' ? (
                    <select
                      value={draft[c.key] || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                      className="mt-0.5 w-full h-8 rounded-lg bg-card border border-border px-2 text-[11px] outline-none focus:border-violet-500/50"
                    >
                      <option value="">—</option>
                      {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={c.type === 'date' ? 'date' : 'text'}
                      value={draft[c.key] || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                      className="mt-0.5 w-full h-8 rounded-lg bg-card border border-border px-2 text-[11px] outline-none focus:border-violet-500/50"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Update' : 'Add'}
              </button>
              <button onClick={() => setFormOpen(false)} className="h-8 px-3 rounded-lg border border-border text-[11px] text-muted-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function NotConfiguredCard({ what, detail }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
      <AlertTriangle size={20} className="mx-auto text-amber-400 mb-2" />
      <p className="text-sm font-semibold">{what} not connected</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{detail}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MbrReport() {
  const months = useMemo(() => lastMonths(13), []);
  const [month, setMonth] = useState(months[0].value);
  // Custom range mode — backend already accepts ?start=&end= (YYYY-MM-DD)
  const [customOpen, setCustomOpen] = useState(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const [customRange, setCustomRange] = useState(null); // { start, end } once applied
  const [status, setStatus] = useState(null);
  const { view, sub } = useParams();
  const navigate = useNavigate();
  const isHub = !view;
  const isStaticView = view ? Object.prototype.hasOwnProperty.call(STATIC_VIEWS, view) : false;
  const isSourceView = Boolean(view) && !isStaticView;
  const isPagesView = isSourceView && sub === 'pages';
  const activeSource = isSourceView ? view : null;
  const [ga4, setGa4] = useState(null);
  const [gsc, setGsc] = useState(null);
  const [buttons, setButtons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [refreshTick, setRefreshTick] = useState(0);

  // Manual workstream tiles + blogs
  const [sections, setSections] = useState([]);
  const [manualItems, setManualItems] = useState([]);
  const [blogsList, setBlogsList] = useState([]);
  const [itemsTick, setItemsTick] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [compare3, setCompare3] = useState(false);

  const rangeParams = customRange ? { start: customRange.start, end: customRange.end } : { month };
  const period = customRange ? customRange.start.slice(0, 7) : month;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const errs = {};

      // Hub + static views need only the light calls; GA4/GSC pulled only
      // inside a source view (avoids burning Google quota on the overview).
      const calls = [getMbrStatus(), getMbrBlogs(rangeParams)];
      if (isSourceView) {
        const params = { ...rangeParams, source: activeSource };
        calls.push(getMbrGa4(params), getMbrGsc(params), getMbrButtons(rangeParams));
      }

      const [st, bl, g4, gs, bt] = await Promise.allSettled(calls);
      if (!alive) return;

      setStatus(st.status === 'fulfilled' ? st.value.data?.data : null);
      setBlogsList(bl.status === 'fulfilled' ? bl.value.data?.data?.blogs || [] : []);

      if (isSourceView) {
        if (g4.status === 'fulfilled') setGa4(g4.value.data?.data || null);
        else { setGa4(null); errs.ga4 = g4.reason?.response?.data?.message || g4.reason?.message; }

        if (gs.status === 'fulfilled') setGsc(gs.value.data?.data || null);
        else { setGsc(null); errs.gsc = gs.reason?.response?.data?.message || gs.reason?.message; }

        if (bt.status === 'fulfilled') setButtons(bt.value.data?.data || null);
        else setButtons(null);
      } else {
        setGa4(null);
        setGsc(null);
        setButtons(null);
      }

      setErrors(errs);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [month, customRange, refreshTick, activeSource, isSourceView]); // eslint-disable-line

  // Section definitions (static) + manual items (per period)
  useEffect(() => {
    getMbrSections().then((r) => setSections(r.data?.data?.sections || [])).catch(() => {});
  }, []);
  useEffect(() => {
    let alive = true;
    getMbrItems({ period })
      .then((r) => { if (alive) setManualItems(r.data?.data?.items || []); })
      .catch(() => { if (alive) setManualItems([]); });
    return () => { alive = false; };
  }, [period, itemsTick]);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    const tid = toast.loading('Building MBR workbook…');
    try {
      const res = await downloadMbrExport(rangeParams);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MBR_${customRange ? `${customRange.start}_${customRange.end}` : month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('MBR downloaded', { id: tid });
    } catch (e) {
      toast.error('Export failed — check backend logs', { id: tid });
    } finally {
      setDownloading(false);
    }
  };

  const ov = ga4?.overview;
  const ai = ga4?.aiReferrals;
  const events = ga4?.events || {};

  const trendData = useMemo(
    () => (ga4?.trend || []).map((r) => ({ date: r.date, Users: r.users, Sessions: r.sessions })),
    [ga4]
  );

  const periodLabels = ga4?.ranges?.labels || { current: 'Current', previous: 'Previous', previous2: 'Previous-2' };

  // 3-period users trend aligned by day-of-period (dates differ across months)
  const compareTrendData = useMemo(() => {
    const tc = ga4?.trendCompare;
    if (!tc) return [];
    const maxLen = Math.max(tc.current.length, tc.previous.length, tc.previous2.length);
    const rows = [];
    for (let i = 0; i < maxLen; i += 1) {
      rows.push({
        day: i + 1,
        [periodLabels.current]: tc.current[i]?.users ?? null,
        [periodLabels.previous]: tc.previous[i]?.users ?? null,
        [periodLabels.previous2]: tc.previous2[i]?.users ?? null,
      });
    }
    return rows;
  }, [ga4]); // eslint-disable-line

  // Pivot the event daily trend into one row per date, fixed entity → color.
  const eventTrendData = useMemo(() => {
    const byDate = new Map();
    (ga4?.eventTrend || []).forEach((r) => {
      if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date, Calls: 0, WhatsApp: 0, Leads: 0 });
      const row = byDate.get(r.date);
      if (r.event === 'call_click') row.Calls += r.count;
      if (r.event === 'whatsapp_click') row.WhatsApp += r.count;
      if (r.event === 'generate_lead' || r.event === 'form_submit') row.Leads += r.count;
    });
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [ga4]);

  const gscTrendData = useMemo(
    () => (gsc?.trend || []).map((r) => ({ date: r.date, Clicks: r.clicks })),
    [gsc]
  );

  const eventTiles = [
    { key: 'call_click', icon: Phone, label: 'Call clicks' },
    { key: 'whatsapp_click', icon: MessageCircle, label: 'WhatsApp clicks' },
    { key: 'cta_click', icon: MousePointerClick, label: 'CTA clicks' },
    { key: 'form_submit', icon: Send, label: 'Form submits' },
    { key: 'generate_lead', icon: Activity, label: 'LP leads' },
    { key: 'file_download', icon: FileDown, label: 'Brochure downloads' },
  ];

  const fmtRangeDate = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const monthLabel = customRange
    ? `${fmtRangeDate(customRange.start)} – ${fmtRangeDate(customRange.end)}`
    : months.find((m) => m.value === month)?.label || month;

  const today = new Date().toISOString().slice(0, 10);
  const customValid = draftStart && draftEnd && draftStart <= draftEnd && draftStart <= today;

  const applyCustom = () => {
    if (!customValid) return;
    setCustomRange({ start: draftStart, end: draftEnd > today ? today : draftEnd });
  };
  const clearCustom = () => {
    setCustomOpen(false);
    setCustomRange(null);
    setDraftStart('');
    setDraftEnd('');
  };

  const sourceLabel = status?.sources?.find((s) => s.key === view)?.label
    || (isSourceView ? view : null);
  const staticTitles = {
    blogs: 'Blogs Published',
    development: 'Development — Work Log',
    ppts: 'PPTs & Videos',
    projects: 'Other Projects',
    leads: 'Leads — Manual / LinkedIn',
  };
  const pageTitle = isHub
    ? 'Work Overview'
    : isPagesView
      ? `${sourceLabel} — Pages`
      : isSourceView
        ? `${sourceLabel} — Traffic, Search & Conversion`
        : staticTitles[view] || 'MBR';

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          {!isHub && (
            <button
              onClick={() => navigate('/mbr')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:opacity-80 transition mb-1"
            >
              <ArrowLeft size={12} /> All workstreams
            </button>
          )}
          <p className="text-caption text-violet-400/70">Monthly Business Review</p>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <BarChart3 size={18} className="text-violet-400" />
            {pageTitle}
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isHub
              ? 'All workstreams & active projects · pick a tile to open its report'
              : `vs ${customRange ? 'preceding period of same length' : 'previous month'} · GSC data lags ~2–3 days`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isHub && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-opacity"
              title="Download the combined MBR workbook (all sheets, auto + manual data)"
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Download MBR
            </button>
          )}
          {isSourceView && !isPagesView && (
            <button
              onClick={() => setCompare3((v) => !v)}
              className={cn(
                'h-9 px-3 rounded-xl border text-xs font-semibold transition-colors',
                compare3
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-violet-500/50'
              )}
              title="Overlay the two preceding periods — comparison table + 3-line chart"
            >
              Compare 3 months
            </button>
          )}
          <select
            value={customOpen ? '__custom' : month}
            onChange={(e) => {
              if (e.target.value === '__custom') {
                setCustomOpen(true);
              } else {
                clearCustom();
                setMonth(e.target.value);
              }
            }}
            className="h-9 rounded-xl bg-card border border-border px-3 text-xs font-medium outline-none focus:border-violet-500/50"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
            <option value="__custom">Custom range…</option>
          </select>

          {customOpen && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={draftStart}
                max={today}
                onChange={(e) => setDraftStart(e.target.value)}
                className="h-9 rounded-xl bg-card border border-border px-2.5 text-xs outline-none focus:border-violet-500/50"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={draftEnd}
                min={draftStart || undefined}
                max={today}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="h-9 rounded-xl bg-card border border-border px-2.5 text-xs outline-none focus:border-violet-500/50"
              />
              <button
                onClick={applyCustom}
                disabled={!customValid}
                className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Apply
              </button>
              <button
                onClick={clearCustom}
                className="h-9 px-2.5 rounded-xl bg-card border border-border text-xs text-muted-foreground hover:border-violet-500/50 transition-colors"
                title="Back to month view"
              >
                ✕
              </button>
            </div>
          )}

          <button
            onClick={() => setRefreshTick((t) => t + 1)}
            className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center hover:border-violet-500/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={cn('text-muted-foreground', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Pulling {monthLabel} from Google…</span>
        </div>
      )}

      {!loading && isSourceView && !ga4 && (
        <NotConfiguredCard
          what={`Google Analytics 4 (${sourceLabel})`}
          detail={errors.ga4 || 'Add this source to MBR_SOURCES on the backend and grant the service account Viewer access on its GA4 property, then refresh.'}
        />
      )}

      {/* ============ PAGES VIEW — every page on the site ============ */}
      {!loading && ga4 && isPagesView && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile i={0} icon={Eye} label="Page views" value={fmtNum(ov.current.pageViews)} delta={deltaPct(ov.current.pageViews, ov.previous.pageViews)} />
            <StatTile i={1} icon={Users} label="Users" value={fmtNum(ov.current.users)} delta={deltaPct(ov.current.users, ov.previous.users)} />
            <StatTile i={2} icon={Activity} label="Pages tracked" value={fmtNum((ga4.topPages || []).length)} hint="pages with ≥1 view this period" />
            <StatTile i={3} icon={Clock} label="Avg time / user" value={fmtDuration(ov.current.avgEngagementSec)} delta={deltaPct(ov.current.avgEngagementSec, ov.previous.avgEngagementSec)} />
          </div>
          <div className="mt-3 pb-8">
            <Card caption="GA4 · current period" title={`All pages — ${monthLabel}`} icon={Eye}>
              <DataTable
                columns={['#', 'Page', 'Views', 'Users', 'Avg time', 'Share']}
                rows={ga4.topPages || []}
                renderRow={(r, idx) => {
                  const totalViews = (ga4.topPages || []).reduce((s, p) => s + p.views, 0) || 1;
                  return (
                    <tr key={r.path} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                      <Td mono className="text-muted-foreground">{idx + 1}</Td>
                      <Td className="max-w-[420px] font-mono text-[10px]">{r.path}</Td>
                      <Td right mono>{fmtNum(r.views)}</Td>
                      <Td right mono>{fmtNum(r.users)}</Td>
                      <Td right mono>{fmtDuration(r.avgEngagementSec)}</Td>
                      <Td right mono>{`${Math.round((r.views / totalViews) * 100)}%`}</Td>
                    </tr>
                  );
                }}
              />
            </Card>
          </div>
        </>
      )}

      {!loading && ga4 && !isPagesView && (
        <>
          <SectionNav />

          {/* ============ AUDIENCE ============ */}
          <SectionHeading id="sec-audience">Audience — {monthLabel}</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatTile i={0} icon={Users} label="Total users" value={fmtNum(ov.current.users)} delta={deltaPct(ov.current.users, ov.previous.users)} />
            <StatTile i={1} icon={UserPlus} label="New users" value={fmtNum(ov.current.newUsers)} delta={deltaPct(ov.current.newUsers, ov.previous.newUsers)} />
            <StatTile i={2} icon={Activity} label="Sessions" value={fmtNum(ov.current.sessions)} delta={deltaPct(ov.current.sessions, ov.previous.sessions)} />
            <StatTile i={3} icon={Eye} label="Page views" value={fmtNum(ov.current.pageViews)} delta={deltaPct(ov.current.pageViews, ov.previous.pageViews)} />
            <StatTile i={4} icon={TrendingUp} label="Engagement rate" value={`${Math.round(ov.current.engagementRate * 100)}%`} delta={deltaPct(ov.current.engagementRate, ov.previous.engagementRate)} />
            <StatTile i={5} icon={Clock} label="Avg time / user" value={fmtDuration(ov.current.avgEngagementSec)} delta={deltaPct(ov.current.avgEngagementSec, ov.previous.avgEngagementSec)} />
          </div>

          {compare3 && (
            <div className="mt-3">
              <Card caption="3-month comparison" title={`${periodLabels.previous2} → ${periodLabels.previous} → ${periodLabels.current}`} icon={BarChart3}>
                <DataTable
                  columns={['Metric', periodLabels.current, periodLabels.previous, periodLabels.previous2, 'MoM %']}
                  rows={[
                    { name: 'Total users', cur: ov.current.users, prev: ov.previousFull?.users, prev2: ov.previous2?.users },
                    { name: 'New users', cur: ov.current.newUsers, prev: ov.previousFull?.newUsers, prev2: ov.previous2?.newUsers },
                    { name: 'Sessions', cur: ov.current.sessions, prev: ov.previousFull?.sessions, prev2: ov.previous2?.sessions },
                    { name: 'Page views', cur: ov.current.pageViews, prev: ov.previousFull?.pageViews, prev2: ov.previous2?.pageViews },
                    { name: 'Engagement rate', cur: `${Math.round(ov.current.engagementRate * 100)}%`, prev: `${Math.round((ov.previousFull?.engagementRate || 0) * 100)}%`, prev2: `${Math.round((ov.previous2?.engagementRate || 0) * 100)}%`, pct: deltaPct(ov.current.engagementRate, ov.previousFull?.engagementRate) },
                    { name: 'AI referral sessions', cur: ai?.currentSessions, prev: ai?.previousFullSessions, prev2: ai?.previous2Sessions },
                    ...eventTiles.map((t) => ({
                      name: t.label, cur: events[t.key]?.current, prev: events[t.key]?.previousFull, prev2: events[t.key]?.previous2,
                    })),
                    ...(gsc ? [
                      { name: 'Search clicks (GSC)', cur: gsc.totals.current.clicks, prev: gsc.totals.previousFull?.clicks, prev2: gsc.totals.previous2?.clicks },
                      { name: 'Search impressions', cur: gsc.totals.current.impressions, prev: gsc.totals.previousFull?.impressions, prev2: gsc.totals.previous2?.impressions },
                    ] : []),
                  ]}
                  renderRow={(r, idx) => {
                    const numeric = typeof r.cur === 'number';
                    const pct = r.pct !== undefined ? r.pct : (numeric ? deltaPct(r.cur, r.prev) : null);
                    return (
                      <tr key={r.name} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                        <Td>{r.name}</Td>
                        <Td right mono className="font-semibold">{numeric ? fmtNum(r.cur) : r.cur}</Td>
                        <Td right mono>{typeof r.prev === 'number' ? fmtNum(r.prev) : r.prev}</Td>
                        <Td right mono>{typeof r.prev2 === 'number' ? fmtNum(r.prev2) : (r.prev2 ?? '—')}</Td>
                        <Td right><Trend delta={pct} /></Td>
                      </tr>
                    );
                  }}
                />
              </Card>
            </div>
          )}

          <div className="mt-3">
            <Card
              caption="Daily"
              title={compare3 ? 'Users — 3-month overlay (by day of period)' : 'Users & Sessions'}
              icon={Activity}
            >
              <div className="px-5 pt-3 flex gap-4">
                {compare3 ? (
                  <>
                    <LegendDot color={C.violet} label={periodLabels.current} />
                    <LegendDot color={C.cyan} label={periodLabels.previous} />
                    <LegendDot color={C.green} label={periodLabels.previous2} />
                  </>
                ) : (
                  <>
                    <LegendDot color={C.violet} label="Users" />
                    <LegendDot color={C.cyan} label="Sessions" />
                  </>
                )}
              </div>
              <div className="px-2 pb-4 pt-1 h-[240px]">
                {compare3 ? (
                  compareTrendData.length === 0 ? <EmptyNote /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={compareTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                        <XAxis dataKey="day" tickFormatter={(d) => `Day ${d}`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                        <Tooltip content={<ChartTip labelFormatter={(d) => `Day ${d} of period`} />} />
                        <Area type="monotone" dataKey={periodLabels.current} stroke={C.violet} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.violet, strokeWidth: 0 }} connectNulls />
                        <Area type="monotone" dataKey={periodLabels.previous} stroke={C.cyan} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.cyan, strokeWidth: 0 }} connectNulls />
                        <Area type="monotone" dataKey={periodLabels.previous2} stroke={C.green} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.green, strokeWidth: 0 }} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                ) : trendData.length === 0 ? <EmptyNote /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mbrUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.violet} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={C.violet} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mbrSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.cyan} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                      <XAxis dataKey="date" tickFormatter={fmtGa4Date} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                      <Tooltip content={<ChartTip labelFormatter={fmtGa4Date} />} />
                      <Area type="monotone" dataKey="Users" stroke={C.violet} strokeWidth={2} fill="url(#mbrUsers)" dot={false} activeDot={{ r: 4, fill: C.violet, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="Sessions" stroke={C.cyan} strokeWidth={2} fill="url(#mbrSessions)" dot={false} activeDot={{ r: 4, fill: C.cyan, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* ============ ACQUISITION ============ */}
          <SectionHeading id="sec-acquisition">Acquisition</SectionHeading>
          <div className="grid lg:grid-cols-3 gap-3">
            <Card caption="Channels" title="Where traffic comes from" icon={Globe}>
              <BarRows rows={(ga4.channels || []).map((c) => ({ label: c.channel, value: c.sessions }))} />
            </Card>
            <Card caption="Sources" title="Top sources" icon={Globe}>
              <DataTable
                columns={['Source', 'Sessions', 'Users']}
                rows={(ga4.sources || []).slice(0, 10)}
                renderRow={(r) => (
                  <tr key={r.source} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                    <Td className="truncate max-w-[160px]">{r.source}</Td>
                    <Td right mono>{fmtNum(r.sessions)}</Td>
                    <Td right mono>{fmtNum(r.users)}</Td>
                  </tr>
                )}
              />
            </Card>
            <Card caption="GEO scoreboard" title="AI assistant traffic" icon={Sparkles}>
              <div className="px-5 py-4">
                <div className="flex items-end gap-3">
                  <p className="text-2xl font-bold">{fmtNum(ai?.currentSessions)}</p>
                  <Trend delta={deltaPct(ai?.currentSessions, ai?.previousSessions)} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                  sessions from ChatGPT, Perplexity, Gemini, Copilot…
                </p>
                {(ai?.sources || []).length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/70">No AI-referred sessions this month yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {ai.sources.slice(0, 8).map((s) => (
                      <div key={s.source} className="flex items-center justify-between text-[11px]">
                        <span className="truncate pr-3">{s.source}</span>
                        <span className="font-mono font-semibold">{fmtNum(s.sessions)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ============ CONVERSIONS ============ */}
          <SectionHeading id="sec-conversions">Conversion actions</SectionHeading>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {eventTiles.map((t, i) => {
              const e = events[t.key] || { current: 0, previous: 0 };
              return (
                <StatTile key={t.key} i={i} icon={t.icon} label={t.label} value={fmtNum(e.current)} delta={deltaPct(e.current, e.previous)} />
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-3 mt-3">
            <Card caption="Daily" title="Contact intent trend" icon={Phone}>
              <div className="px-5 pt-3 flex gap-4">
                <LegendDot color={C.violet} label="Calls" />
                <LegendDot color={C.green} label="WhatsApp" />
                <LegendDot color={C.cyan} label="Leads" />
              </div>
              <div className="px-2 pb-4 pt-1 h-[220px]">
                {eventTrendData.length === 0 ? <EmptyNote /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={eventTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                      <XAxis dataKey="date" tickFormatter={fmtGa4Date} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                      <Tooltip content={<ChartTip labelFormatter={fmtGa4Date} />} />
                      <Area type="monotone" dataKey="Calls" stroke={C.violet} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.violet, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="WhatsApp" stroke={C.green} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.green, strokeWidth: 0 }} />
                      <Area type="monotone" dataKey="Leads" stroke={C.cyan} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4, fill: C.cyan, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card caption="Downloads" title="Brochures by file" icon={FileDown}>
              <BarRows rows={(ga4.fileDownloads || []).slice(0, 8).map((f) => ({ label: f.file, value: f.count }))} />
            </Card>
          </div>

          {buttons && (buttons.byButton?.length > 0 || buttons.byLocation?.length > 0) && (
            <div className="grid lg:grid-cols-2 gap-3 mt-3">
              <Card caption="Mavro events" title="Clicks by button" icon={MousePointerClick}>
                <DataTable
                  columns={['Button', 'Type', 'Clicks']}
                  rows={(buttons.byButton || []).slice(0, 12)}
                  renderRow={(r, idx) => (
                    <tr key={`${r.eventType}-${r.label}-${idx}`} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                      <Td className="truncate max-w-[200px]">{r.label}</Td>
                      <Td right><span className="text-muted-foreground">{r.eventType.replace('_click', '')}</span></Td>
                      <Td right mono>{fmtNum(r.count)}</Td>
                    </tr>
                  )}
                />
              </Card>
              <Card caption="Mavro events" title="Clicks by page location" icon={MapPin}>
                <DataTable
                  columns={['Location', 'Type', 'Clicks']}
                  rows={(buttons.byLocation || []).slice(0, 12)}
                  renderRow={(r, idx) => (
                    <tr key={`${r.eventType}-${r.location}-${idx}`} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                      <Td>{r.location}</Td>
                      <Td right><span className="text-muted-foreground">{r.eventType.replace('_click', '')}</span></Td>
                      <Td right mono>{fmtNum(r.count)}</Td>
                    </tr>
                  )}
                />
              </Card>
            </div>
          )}

          {/* ============ CONTENT ============ */}
          <SectionHeading id="sec-content">Content</SectionHeading>
          <Card caption="Pages" title="Top pages" icon={Eye}>
            <DataTable
              columns={['Page', 'Views', 'Users', 'Avg time']}
              rows={(ga4.topPages || []).slice(0, 12)}
              renderRow={(r) => (
                <tr key={r.path} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                  <Td className="truncate max-w-[280px] font-mono text-[10px]">{r.path}</Td>
                  <Td right mono>{fmtNum(r.views)}</Td>
                  <Td right mono>{fmtNum(r.users)}</Td>
                  <Td right mono>{fmtDuration(r.avgEngagementSec)}</Td>
                </tr>
              )}
            />
          </Card>

          {/* ============ SEARCH ============ */}
          <SectionHeading id="sec-search">Google Search</SectionHeading>
          {!gsc ? (
            <NotConfiguredCard
              what="Search Console"
              detail={errors.gsc || 'Set GSC_SITE_URL on the backend and add the service account under Search Console → Settings → Users and permissions.'}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile i={0} icon={MousePointerClick} label="Clicks from Google" value={fmtNum(gsc.totals.current.clicks)} delta={deltaPct(gsc.totals.current.clicks, gsc.totals.previous.clicks)} />
                <StatTile i={1} icon={Eye} label="Impressions" value={fmtNum(gsc.totals.current.impressions)} delta={deltaPct(gsc.totals.current.impressions, gsc.totals.previous.impressions)} />
                <StatTile i={2} icon={TrendingUp} label="CTR" value={`${(gsc.totals.current.ctr * 100).toFixed(1)}%`} delta={deltaPct(gsc.totals.current.ctr, gsc.totals.previous.ctr)} />
                <StatTile i={3} icon={SearchIcon} label="Avg position" value={gsc.totals.current.position || '—'} delta={gsc.totals.previous.position ? -deltaPct(gsc.totals.current.position, gsc.totals.previous.position) : null} hint="lower is better" />
              </div>

              <div className="grid lg:grid-cols-2 gap-3 mt-3">
                <Card caption="Daily" title="Search clicks" icon={SearchIcon}>
                  <div className="px-2 pb-4 pt-3 h-[220px]">
                    {gscTrendData.length === 0 ? <EmptyNote /> : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={gscTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="mbrGsc" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.violet} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={C.violet} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                          <XAxis dataKey="date" tickFormatter={fmtIsoDate} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} minTickGap={28} />
                          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
                          <Tooltip content={<ChartTip labelFormatter={fmtIsoDate} />} />
                          <Area type="monotone" dataKey="Clicks" stroke={C.violet} strokeWidth={2} fill="url(#mbrGsc)" dot={false} activeDot={{ r: 4, fill: C.violet, strokeWidth: 0 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>

                <Card caption="Queries" title="Top search queries" icon={SearchIcon}>
                  <DataTable
                    columns={['Query', 'Clicks', 'Impr.', 'Pos.']}
                    rows={(gsc.topQueries || []).slice(0, 10)}
                    renderRow={(r) => (
                      <tr key={r.query} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                        <Td className="truncate max-w-[220px]">{r.query}</Td>
                        <Td right mono>{fmtNum(r.clicks)}</Td>
                        <Td right mono>{fmtNum(r.impressions)}</Td>
                        <Td right mono>{r.position}</Td>
                      </tr>
                    )}
                  />
                </Card>
              </div>

              <div className="mt-3">
                <Card caption="Pages" title="Top pages in Google" icon={Globe}>
                  <DataTable
                    columns={['Page', 'Clicks', 'Impr.', 'CTR', 'Pos.']}
                    rows={(gsc.topPages || []).slice(0, 10)}
                    renderRow={(r) => (
                      <tr key={r.page} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                        <Td className="truncate max-w-[300px] font-mono text-[10px]">{r.page.replace(/^https?:\/\/[^/]+/, '') || '/'}</Td>
                        <Td right mono>{fmtNum(r.clicks)}</Td>
                        <Td right mono>{fmtNum(r.impressions)}</Td>
                        <Td right mono>{`${(r.ctr * 100).toFixed(1)}%`}</Td>
                        <Td right mono>{r.position}</Td>
                      </tr>
                    )}
                  />
                </Card>
              </div>
            </>
          )}

          {/* ============ AUDIENCE DETAIL ============ */}
          <SectionHeading id="sec-geography">Geography &amp; devices</SectionHeading>
          <div className="grid lg:grid-cols-3 gap-3">
            <Card caption="Geography" title="Users by country" icon={Globe} className="lg:col-span-2">
              <GeoMap countries={ga4.countries || []} />
            </Card>
            <Card caption="Geography" title="Top cities" icon={MapPin}>
              <DataTable
                columns={['City', 'Users', 'Sessions']}
                rows={(ga4.geo || []).filter((r) => r.city && r.city !== '(not set)').slice(0, 9)}
                renderRow={(r, idx) => (
                  <tr key={`${r.city}-${idx}`} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                    <Td>
                      {r.city}
                      <span className="text-muted-foreground/60 ml-1.5 text-[10px]">{r.country}</span>
                    </Td>
                    <Td right mono>{fmtNum(r.users)}</Td>
                    <Td right mono>{fmtNum(r.sessions)}</Td>
                  </tr>
                )}
              />
            </Card>
          </div>
          <div className="grid lg:grid-cols-3 gap-3 mt-3 pb-8">
            <Card caption="Devices" title="Device split" icon={MonitorSmartphone}>
              <BarRows rows={(ga4.devices || []).map((d) => ({ label: d.device, value: d.users }))} />
            </Card>
            <Card caption="Geography" title="Top countries" icon={Globe} className="lg:col-span-2">
              <DataTable
                columns={['Country', 'Users', 'Sessions', 'Share']}
                rows={(ga4.countries || []).filter((c) => c.country && c.country !== '(not set)').slice(0, 8)}
                renderRow={(r, idx) => {
                  const total = (ga4.countries || []).reduce((s, c) => s + c.users, 0) || 1;
                  return (
                    <tr key={`${r.country}-${idx}`} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                      <Td>{r.country}</Td>
                      <Td right mono>{fmtNum(r.users)}</Td>
                      <Td right mono>{fmtNum(r.sessions)}</Td>
                      <Td right mono>{`${Math.round((r.users / total) * 100)}%`}</Td>
                    </tr>
                  );
                }}
              />
            </Card>
          </div>
        </>
      )}

      {/* ============ HUB — Work Overview grid ============ */}
      {!loading && isHub && (
        <div className="space-y-2 pb-8">
          {(status?.sources || []).map((s, gi) => {
            const tenantBlogs = blogsList.filter((b) => (b.tenant || '').toLowerCase().includes(s.key)).length;
            return (
              <HubGroup key={s.key} label={s.label}>
                <HubTile
                  i={gi * 3}
                  icon={BarChart3}
                  title={`${s.label} MBR`}
                  description="Search & acquisition — clicks, impressions, CTR, position, AI referrals, channel mix, conversions"
                  statusChip={s.ga4 || s.gsc ? '✅ Auto · live' : '⚠️ Not configured'}
                  statusTone={s.ga4 || s.gsc ? 'auto' : 'off'}
                  onClick={() => navigate(`/mbr/${s.key}`)}
                />
                <HubTile
                  i={gi * 3 + 1}
                  icon={Eye}
                  title={`${s.label} Pages`}
                  description="Every page on the site — views, users, time on page"
                  statusChip={s.ga4 ? '✅ Auto · live' : '⚠️ Not configured'}
                  statusTone={s.ga4 ? 'auto' : 'off'}
                  onClick={() => navigate(`/mbr/${s.key}/pages`)}
                />
                <HubTile
                  i={gi * 3 + 2}
                  icon={FileText}
                  title={`${s.label} Blogs`}
                  description="Articles published & their reach"
                  statusChip={`✅ Auto · ${tenantBlogs} this period`}
                  statusTone="auto"
                  onClick={() => navigate('/mbr/blogs')}
                />
              </HubGroup>
            );
          })}

          <HubGroup label="Development">
            <HubTile
              icon={ClipboardList}
              title="Work Log"
              description="SEO / development tasks shipped — with risk & impact analysis (manual input)"
              statusChip={`📝 ${manualItems.filter((i) => i.section === 'work_log').length} entries`}
              statusTone="manual"
              onClick={() => navigate('/mbr/development')}
            />
          </HubGroup>

          <HubGroup label="Other Projects">
            <HubTile
              icon={FileText}
              title="PPTs & Videos"
              description="Decks and videos delivered this period (manual input)"
              statusChip={`📝 ${manualItems.filter((i) => i.section === 'ppts_videos').length} entries`}
              statusTone="manual"
              onClick={() => navigate('/mbr/ppts')}
            />
            <HubTile
              icon={FolderKanban}
              title="Other Projects"
              description="Client sites, tooling, one-offs — status & notes (manual input)"
              statusChip={`📝 ${manualItems.filter((i) => i.section === 'other_projects').length} entries`}
              statusTone="manual"
              onClick={() => navigate('/mbr/projects')}
            />
            <HubTile
              icon={UserSquare2}
              title="Leads Log"
              description="Website leads auto-pulled in the export · add LinkedIn / manual leads here"
              statusChip={`📝 ${manualItems.filter((i) => i.section === 'manual_leads').length} manual entries`}
              statusTone="manual"
              onClick={() => navigate('/mbr/leads')}
            />
          </HubGroup>
        </div>
      )}

      {/* ============ STATIC DETAIL VIEWS ============ */}
      {!loading && view === 'blogs' && (
        <div className="pb-8">
          <Card caption="Content · auto" title={`Blogs published — ${monthLabel}`} icon={FileText}>
            <DataTable
              columns={['Title', 'Tenant', 'Published', 'Views (all-time)']}
              rows={blogsList}
              renderRow={(b) => (
                <tr key={b.slug} className="border-b border-border/40 last:border-0 hover:bg-foreground/[0.02]">
                  <Td className="max-w-[380px]">{b.title}</Td>
                  <Td right>{b.tenant}</Td>
                  <Td right mono>{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'}</Td>
                  <Td right mono>{fmtNum(b.views)}</Td>
                </tr>
              )}
            />
          </Card>
        </div>
      )}

      {!loading && isStaticView && view !== 'blogs' && (() => {
        const sectionKey = STATIC_VIEWS[view];
        const sectionDef = sections.find((s) => s.key === sectionKey);
        if (!sectionDef) return <EmptyNote text="Loading section…" />;
        return (
          <div className="pb-8">
            <WorkstreamTile
              section={sectionDef}
              period={period}
              items={manualItems.filter((i) => i.section === sectionKey)}
              onChanged={() => setItemsTick((t) => t + 1)}
            />
          </div>
        );
      })()}
    </div>
  );
}
