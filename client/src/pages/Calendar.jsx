import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Kanban, ListFilter, Plus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

import { getWebsites } from '@/api/websites';
import { getBlogs, rescheduleBlog, updateBlogEditorialStatus, getBlogActivity } from '@/api/blogs';
import { getCampaigns } from '@/api/campaigns';
import {
  computeVelocity, detectDeadlines, buildPlanningRecommendations,
  computeEditorialHealth, groupBlogsByTenant,
} from '@/lib/contentCalendarIntel';

import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import CalendarAgendaView from '@/components/calendar/CalendarAgendaView';
import EditorialKanban from '@/components/calendar/EditorialKanban';
import VelocityStrip from '@/components/calendar/VelocityStrip';
import PlanningRecommendations from '@/components/calendar/PlanningRecommendations';
import CampaignPanel from '@/components/calendar/CampaignPanel';
import ActivityFeed from '@/components/calendar/ActivityFeed';

const VIEWS = [
  { id: 'month',   label: 'Month',   Icon: CalendarIcon },
  { id: 'agenda',  label: 'Agenda',  Icon: ListFilter },
  { id: 'kanban',  label: 'Pipeline', Icon: Kanban },
];

export default function Calendar() {
  const navigate = useNavigate();
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [blogs, setBlogs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');
  const [anchor, setAnchor] = useState(new Date());
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Initial tenant load
  useEffect(() => {
    getWebsites({ limit: 100 })
      .then((r) => setWebsites(r.data?.data?.websites || []))
      .catch(() => toast.error('Failed to load tenants'));
  }, []);

  // Load blogs + campaigns whenever scope changes
  const loadData = async () => {
    setLoading(true);
    try {
      const blogParams = { limit: 100 };
      if (selectedWebsite !== 'all') blogParams.targetWebsite = selectedWebsite;
      const campaignParams = {};
      if (selectedWebsite !== 'all') campaignParams.targetWebsite = selectedWebsite;

      const [blogRes, campRes] = await Promise.all([
        getBlogs(blogParams),
        getCampaigns(campaignParams),
      ]);
      setBlogs(blogRes.data?.data?.blogs || []);
      setCampaigns(campRes.data?.data?.campaigns || []);
    } catch (e) {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, [selectedWebsite]);

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const params = {};
      if (selectedWebsite !== 'all') params.targetWebsite = selectedWebsite;
      const r = await getBlogActivity({ ...params, limit: 30 });
      setActivity(r.data?.data?.events || []);
    } catch { /* silent */ }
    finally { setActivityLoading(false); }
  };
  useEffect(() => { loadActivity(); /* eslint-disable-next-line */ }, [selectedWebsite]);

  // Apply campaign + status filters
  const filteredBlogs = useMemo(() => {
    let out = blogs;
    if (selectedCampaign !== 'all') out = out.filter((b) => String(b.campaign?._id || b.campaign) === selectedCampaign);
    if (statusFilter !== 'all') out = out.filter((b) => b.status === statusFilter);
    return out;
  }, [blogs, selectedCampaign, statusFilter]);

  // Velocity / health computations
  const velocity   = useMemo(() => computeVelocity(filteredBlogs), [filteredBlogs]);
  const deadlines  = useMemo(() => detectDeadlines(filteredBlogs), [filteredBlogs]);
  const byTenant   = useMemo(() => groupBlogsByTenant(filteredBlogs), [filteredBlogs]);
  const planning   = useMemo(() => buildPlanningRecommendations(filteredBlogs, { campaigns, byTenant }), [filteredBlogs, campaigns, byTenant]);
  const health     = useMemo(() => computeEditorialHealth({ velocity, deadlines, planning }), [velocity, deadlines, planning]);

  // ── Actions ──
  const handleReschedule = async (blogId, isoDate) => {
    // Optimistic update
    setBlogs((prev) => prev.map((b) => b._id === blogId ? { ...b, scheduledAt: isoDate, status: b.status === 'draft' ? 'scheduled' : b.status, workflowStatus: b.status === 'draft' ? 'scheduled' : b.workflowStatus } : b));
    try {
      await rescheduleBlog(blogId, isoDate);
      toast.success('Rescheduled');
    } catch (e) {
      toast.error('Reschedule failed');
      loadData(); // rollback
    }
  };

  const handleWorkflowChange = async (blogId, newEditorialStatus) => {
    // Optimistic update — set editorialStatus + reasonable publish-status mirror
    setBlogs((prev) => prev.map((b) => {
      if (b._id !== blogId) return b;
      const next = { ...b, editorialStatus: newEditorialStatus };
      if (newEditorialStatus === 'published') next.status = 'published';
      else if (newEditorialStatus === 'scheduled' && b.status !== 'scheduled') next.status = 'scheduled';
      else if (['ideas','drafting','review'].includes(newEditorialStatus) && b.status === 'published') next.status = 'draft';
      return next;
    }));
    try {
      await updateBlogEditorialStatus(blogId, newEditorialStatus);
      toast.success(`Moved to ${newEditorialStatus}`);
      loadActivity();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Workflow update failed');
      loadData();
    }
  };

  const handleCreateAt = (date) => {
    // Send to Blog Editor with pre-filled scheduled date via query param
    const iso = new Date(date);
    iso.setHours(9, 0, 0, 0);
    navigate(`/blogs/new?scheduledAt=${encodeURIComponent(iso.toISOString())}${selectedWebsite !== 'all' ? `&targetWebsite=${selectedWebsite}` : ''}`);
  };
  const handleSelectBlog = (b) => navigate(`/blogs/${b._id}/edit`);

  // Tenant-scoped campaign options
  const campaignOptions = campaigns.filter((c) => selectedWebsite === 'all' || String(c.targetWebsite?._id || c.targetWebsite) === selectedWebsite);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"
      >
        <div>
          <p className="text-caption text-emerald-400/80 mb-2">Editorial Operations</p>
          <h1 className="text-display">Content Calendar</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Plan · schedule · pipeline · campaigns — multi-tenant editorial cockpit
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tenant selector */}
          <SelectChip value={selectedWebsite} onChange={setSelectedWebsite} options={[{ value: 'all', label: 'All tenants' }, ...websites.map((w) => ({ value: w._id, label: w.name }))]} />
          {/* Campaign selector */}
          <SelectChip value={selectedCampaign} onChange={setSelectedCampaign} options={[{ value: 'all', label: 'All campaigns' }, ...campaignOptions.map((c) => ({ value: c._id, label: c.name }))]} />
          {/* Status selector */}
          <SelectChip value={statusFilter} onChange={setStatusFilter} options={[
            { value: 'all',       label: 'All statuses' },
            { value: 'draft',     label: 'Drafts' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'published', label: 'Published' },
            { value: 'archived',  label: 'Archived' },
          ]} />
          <button
            onClick={() => navigate('/blogs/new')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/40 hover:bg-violet-500/25 transition-colors"
          >
            <Plus size={12} /> Quick draft
          </button>
        </div>
      </motion.div>

      {/* Velocity */}
      <VelocityStrip velocity={velocity} deadlines={deadlines} health={health} />

      {/* Planning recs */}
      <PlanningRecommendations recommendations={planning} />

      {/* View toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-[0.14em] border transition-all ${
              view === v.id
                ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
                : 'bg-foreground/[0.03] border-border/60 text-muted-foreground hover:bg-foreground/[0.06]'
            }`}
          >
            <v.Icon size={11} />
            {v.label}
          </button>
        ))}
      </div>

      {/* Main view */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          {loading ? (
            <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-12 text-center text-[12px] text-muted-foreground">
              Loading editorial data…
            </div>
          ) : view === 'month' ? (
            <CalendarMonthView
              anchor={anchor}
              blogs={filteredBlogs}
              onPrev={() => { const d = new Date(anchor); d.setMonth(d.getMonth() - 1); setAnchor(d); }}
              onNext={() => { const d = new Date(anchor); d.setMonth(d.getMonth() + 1); setAnchor(d); }}
              onToday={() => setAnchor(new Date())}
              onReschedule={handleReschedule}
              onSelectBlog={handleSelectBlog}
              onCreateAt={handleCreateAt}
            />
          ) : view === 'agenda' ? (
            <CalendarAgendaView blogs={filteredBlogs} onSelectBlog={handleSelectBlog} />
          ) : (
            <EditorialKanban blogs={filteredBlogs} onEditorialChange={handleWorkflowChange} onSelectBlog={handleSelectBlog} />
          )}
        </div>

        <div className="space-y-6">
          <CampaignPanel
            campaigns={campaignOptions}
            websites={websites}
            selectedWebsiteId={selectedWebsite !== 'all' ? selectedWebsite : ''}
            onChange={loadData}
          />
          <ActivityFeed
            events={activity}
            loading={activityLoading}
            onBlogClick={(b) => navigate(`/blogs/${b._id}/edit`)}
          />
        </div>
      </div>
    </div>
  );
}

function SelectChip({ value, onChange, options }) {
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl bg-card/70 backdrop-blur-xl border border-border/70 pl-3 pr-8 py-2 text-[11.5px] font-semibold focus:border-violet-500/60 outline-none transition-colors cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
