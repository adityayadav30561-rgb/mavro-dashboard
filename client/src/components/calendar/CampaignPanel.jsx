import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { createCampaign, deleteCampaign, updateCampaign } from '@/api/campaigns';

const CAMPAIGN_STATUS_TONES = {
  planned:   'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
  active:    'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  completed: 'text-violet-300 bg-violet-500/10 border-violet-500/30',
  paused:    'text-amber-300 bg-amber-500/10 border-amber-500/30',
};

/**
 * Campaign Panel — list + create + delete + show progress for campaigns
 * scoped to the selected tenant.
 */
export default function CampaignPanel({ campaigns = [], onChange, websites = [], selectedWebsiteId = '' }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', targetWebsite: selectedWebsiteId || (websites[0]?._id || ''),
    color: 'violet', startDate: '', endDate: '', targetBlogCount: '',
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Name required');
    if (!form.targetWebsite) return toast.error('Tenant required');
    setBusy(true);
    try {
      const payload = {
        ...form,
        targetBlogCount: form.targetBlogCount ? Number(form.targetBlogCount) : null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      await createCampaign(payload);
      toast.success('Campaign created');
      setCreating(false);
      setForm({ ...form, name: '', description: '', startDate: '', endDate: '', targetBlogCount: '' });
      onChange?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create campaign');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete campaign? Blogs will be detached.')) return;
    try {
      await deleteCampaign(id);
      toast.success('Campaign removed');
      onChange?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Delete failed');
    }
  };

  const toggleStatus = async (c) => {
    const next = c.status === 'active' ? 'paused' : 'active';
    try {
      await updateCampaign(c._id, { status: next });
      toast.success(`Campaign ${next}`);
      onChange?.();
    } catch (e) { toast.error('Update failed'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 overflow-hidden"
    >
      <div className="px-5 py-3.5 flex items-center gap-2 border-b border-border/60">
        <Megaphone size={14} className="text-violet-400" />
        <h3 className="text-sm font-bold tracking-tight">Campaigns</h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground tabular-nums">{campaigns.length}</span>
        <button
          onClick={() => setCreating((c) => !c)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.14em] bg-violet-500/15 text-violet-300 border border-violet-500/40 hover:bg-violet-500/25 transition-colors"
        >
          {creating ? <X size={10} /> : <Plus size={10} />}
          {creating ? 'Cancel' : 'New'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {creating && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-b border-border/60"
          >
            <div className="p-4 space-y-2 bg-foreground/[0.02]">
              <Input placeholder="Campaign name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Input placeholder="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.targetWebsite}
                  onChange={(e) => setForm({ ...form, targetWebsite: e.target.value })}
                  className="rounded-md bg-foreground/[0.04] border border-border/60 px-2 py-1.5 text-[11px]"
                >
                  <option value="">Select tenant</option>
                  {websites.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
                <Input type="number" placeholder="Target blog count" value={form.targetBlogCount} onChange={(v) => setForm({ ...form, targetBlogCount: v })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
                <Input type="date" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
              </div>
              <button
                disabled={busy}
                onClick={submit}
                className="w-full px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-[0.16em] bg-violet-500 text-white hover:bg-violet-400 transition-colors disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Create campaign'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {campaigns.length === 0 ? (
        <p className="p-5 text-[11.5px] text-muted-foreground text-center">No campaigns yet. Click <strong>New</strong> to plan one.</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {campaigns.map((c) => {
            const completed = c.progress?.published || 0;
            const total = c.targetBlogCount || c.progress?.total || 0;
            const pct = total ? Math.round((completed / total) * 100) : 0;
            return (
              <li key={c._id} className="px-5 py-3">
                <div className="flex items-start gap-2 mb-1.5">
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] border', CAMPAIGN_STATUS_TONES[c.status])}>
                    {c.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate">{c.name}</p>
                    {c.description && <p className="text-[10.5px] text-muted-foreground truncate">{c.description}</p>}
                  </div>
                  <button onClick={() => toggleStatus(c)} className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">
                    {c.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => remove(c._id)} title="Delete" className="p-1 rounded text-muted-foreground hover:text-rose-400">
                    <Trash2 size={11} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-foreground/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.45 }}
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {completed}{total ? `/${total}` : ''} · {pct}%
                  </span>
                </div>
                {(c.startDate || c.endDate) && (
                  <p className="mt-1 text-[9.5px] font-mono text-muted-foreground tabular-nums">
                    {c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'} → {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}
                  </p>
                )}
                {c.velocity && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[9.5px] font-mono text-muted-foreground tabular-nums">
                    <span>velocity {c.velocity.publishedPerWeek}/wk</span>
                    {c.velocity.daysRemaining != null && (
                      <span>· {c.velocity.daysRemaining}d left</span>
                    )}
                    {c.velocity.overdueDrafts > 0 && (
                      <span className="text-rose-400">· {c.velocity.overdueDrafts} overdue</span>
                    )}
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-[0.14em] border',
                      c.velocity.risk === 'high'   && 'text-rose-300 bg-rose-500/10 border-rose-500/30',
                      c.velocity.risk === 'medium' && 'text-amber-300 bg-amber-500/10 border-amber-500/30',
                      c.velocity.risk === 'low'    && 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
                    )}>
                      risk · {c.velocity.risk}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md bg-foreground/[0.04] border border-border/60 px-2 py-1.5 text-[11px] outline-none focus:border-violet-500/60"
    />
  );
}
