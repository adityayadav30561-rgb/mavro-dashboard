import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Globe, ExternalLink, FileText, Activity,
  Copy, CheckCheck, Hexagon,
} from 'lucide-react';
import {
  getWebsites, createWebsite, updateWebsite, deleteWebsite,
} from '@/api/websites';
import { getBlogs } from '@/api/blogs';
import { getLeads } from '@/api/leads';
import { GlassCard } from '@/components/cyber/GlassCard';
import { Badge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '', domain: '', description: '', status: 'active', sitemapUrl: '', logo: '',
};

// ===================================
// Domain → public URL resolver
// ===================================
// Domains are stored as either "localhost:5173/hrms" (dev) or
// "hrms.mavro.com" (prod). Build a real clickable URL from either form.
function publicUrlFromDomain(domain) {
  if (!domain) return null;
  const trimmed = domain.trim().replace(/^https?:\/\//, '');
  if (trimmed.startsWith('localhost') || trimmed.startsWith('127.0.0.1')) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

// The sitemap lives at /sitemap.xml on the website's own public domain (the
// Next SSR site proxies the backend sitemap there). Derive it from the stored
// domain so it matches the property in Search Console — e.g. domain
// `spanbix.com` → `https://spanbix.com/sitemap.xml`. www.spanbix.com 301s to
// apex at the Vercel domain layer, so apex is the single canonical. The old
// window.location + :5000 form produced
// https://mavro-dashboard.vercel.app:5000/... on Vercel — broken.
function defaultSitemapUrl(domain) {
  const base = publicUrlFromDomain(domain);
  return base ? `${base}/sitemap.xml` : '';
}

export default function WebsiteList() {
  const [websites, setWebsites] = useState([]);
  const [stats, setStats] = useState({}); // { [websiteId]: { blogs, published, leads } }
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editSlug, setEditSlug] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getWebsites({ limit: 100 });
      const list = res.data.data.websites || [];
      setWebsites(list);

      // Fetch per-website operational stats in parallel
      const statsPromises = list.map(async (w) => {
        const [blogRes, leadRes] = await Promise.all([
          getBlogs({ targetWebsite: w._id, limit: 1 }).catch(() => null),
          getLeads({ website: w._id, limit: 1 }).catch(() => null),
        ]);
        return [
          w._id,
          {
            blogs: blogRes?.data?.pagination?.total ?? 0,
            published: w.cachedStats?.publishedBlogCount ?? 0,
            leads: leadRes?.data?.pagination?.total ?? 0,
          },
        ];
      });
      const settled = await Promise.all(statsPromises);
      setStats(Object.fromEntries(settled));
    } catch (e) { toast.error('Failed to load websites'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setEditSlug(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (w) => {
    setEditId(w._id);
    setEditSlug(w.slug);
    setForm({
      name: w.name,
      domain: w.domain,
      description: w.description || '',
      status: w.status,
      sitemapUrl: w.sitemapUrl || defaultSitemapUrl(w.domain),
      logo: w.logo || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.domain.trim()) return toast.error('Name and domain are required');
    setSaving(true);
    try {
      if (editId) { await updateWebsite(editId, form); toast.success('Website updated'); }
      else { await createWebsite(form); toast.success('Website created'); }
      setModalOpen(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (w) => {
    const yes = window.confirm(
      `Delete "${w.name}"? All associated blogs, leads, and analytics events will also be permanently removed.`
    );
    if (!yes) return;
    try {
      const res = await deleteWebsite(w._id);
      const r = res?.data?.data?.removed;
      const msg = r
        ? `Removed · ${r.blogs} blogs · ${r.leads} leads · ${r.analyticsEvents} events`
        : 'Website deleted';
      toast.success(msg);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Auto-derive sitemap URL when the domain changes — but only while it still
  // equals the default for the previous domain (i.e. the user hasn't hand-edited).
  const onDomainChange = (e) => {
    const domain = e.target.value;
    setForm((f) => {
      const next = { ...f, domain };
      if (!f.sitemapUrl || f.sitemapUrl === defaultSitemapUrl(f.domain)) {
        next.sitemapUrl = defaultSitemapUrl(domain);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <p className="text-caption text-violet-400/80 mb-2">Multi-Tenant Properties</p>
          <h1 className="text-display">Websites</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {websites.length} active {websites.length === 1 ? 'property' : 'properties'} · centralized operational console
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Website
        </button>
      </motion.div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-violet-500 border-b-cyan-500 animate-spin" />
        </div>
      ) : websites.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <Globe size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-base font-semibold">No websites yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first product property to begin.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {websites.map((w, i) => (
            <WebsiteCard
              key={w._id}
              website={w}
              stats={stats[w._id]}
              delay={i * 0.06}
              onEdit={() => openEdit(w)}
              onDelete={() => handleDelete(w)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Edit Website' : 'Add Website'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Website Name <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              className="input-field"
              placeholder="Mavro HRMS"
            />
          </div>

          <div>
            <label className="label">Domain <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={form.domain}
              onChange={onDomainChange}
              className="input-field"
              placeholder="localhost:5173/hrms · or · hrms.mavro.com"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Dev: <code className="font-mono text-foreground/70">localhost:5173/hrms</code> · Prod: <code className="font-mono text-foreground/70">hrms.mavro.com</code>
            </p>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={2}
              className="input-field"
              placeholder="Brief description…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={set('status')} className="input-field">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="label">Logo URL</label>
              <input
                type="text"
                value={form.logo}
                onChange={set('logo')}
                className="input-field"
                placeholder="https://…"
              />
            </div>
          </div>

          <div>
            <label className="label">Sitemap URL</label>
            <input
              type="text"
              value={form.sitemapUrl}
              onChange={set('sitemapUrl')}
              className="input-field font-mono text-[12px]"
              placeholder={form.domain ? defaultSitemapUrl(form.domain) : 'https://<domain>/sitemap.xml'}
            />
            {form.domain && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, sitemapUrl: defaultSitemapUrl(f.domain) }))}
                className="mt-1.5 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Use default sitemap URL ({defaultSitemapUrl(form.domain)})
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-border/60">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ===================================
// WebsiteCard
// ===================================
function WebsiteCard({ website: w, stats, onEdit, onDelete, delay = 0 }) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => publicUrlFromDomain(w.domain), [w.domain]);
  const accent = w.branding?.primaryColor || '#7c3aed';

  const copyUrl = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url || w.domain);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { toast.error('Copy failed'); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl overflow-hidden bg-card/70 backdrop-blur-xl border border-border/70 hover:border-border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] flex flex-col"
    >
      {/* Accent strip */}
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
            style={{ background: `linear-gradient(135deg, ${accent}, ${w.branding?.secondaryColor || accent}cc)` }}
          >
            <Hexagon size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] tracking-tight truncate">{w.name}</h3>
            <p className="text-[11px] font-mono text-muted-foreground truncate">{w.slug}</p>
          </div>
        </div>
        <Badge variant={w.status === 'active' ? 'success' : w.status === 'maintenance' ? 'warning' : 'secondary'} className="text-[10px] uppercase">
          {w.status}
        </Badge>
      </div>

      {/* Domain row with copy */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/[0.03] border border-border/60">
          <Globe size={12} className="text-muted-foreground flex-shrink-0" />
          <span className="text-[12px] font-mono truncate flex-1">{w.domain || '—'}</span>
          {w.domain && (
            <button
              onClick={copyUrl}
              title="Copy URL"
              className="flex-shrink-0 p-1 rounded-md hover:bg-foreground/[0.06] text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {w.description && (
        <p className="px-5 text-[12.5px] text-muted-foreground line-clamp-2 leading-relaxed">
          {w.description}
        </p>
      )}

      {/* Operational metadata */}
      <div className="px-5 mt-4 grid grid-cols-3 gap-2">
        <Stat icon={FileText} label="Blogs"     value={stats?.blogs ?? '—'}     color="text-violet-400" />
        <Stat icon={Activity} label="Leads"     value={stats?.leads ?? '—'}     color="text-amber-400" />
        <Stat icon={Globe}    label="Published" value={stats?.published ?? '—'} color="text-emerald-400" />
      </div>

      {/* Sitemap link */}
      {w.sitemapUrl && (
        <a
          href={w.sitemapUrl}
          target="_blank" rel="noopener noreferrer"
          className="mx-5 mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300 transition-colors truncate"
        >
          <ExternalLink size={10} className="flex-shrink-0" /> {w.sitemapUrl}
        </a>
      )}

      {/* Actions */}
      <div className="mt-auto p-5 pt-4 flex items-center gap-2 border-t border-border/60 mt-4">
        <a
          href={url || '#'}
          target="_blank" rel="noopener noreferrer"
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all',
            'bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_10px_24px_-10px_hsl(263_70%_50%/0.55)] hover:shadow-[0_14px_30px_-10px_hsl(263_70%_50%/0.75)]',
            !url && 'pointer-events-none opacity-50'
          )}
        >
          <ExternalLink size={12} /> Visit Website
        </a>
        <button
          onClick={onEdit}
          title="Edit"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-foreground/[0.04] border border-border/70 hover:bg-foreground/[0.06] hover:border-border text-muted-foreground hover:text-foreground transition-all"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-rose-500/8 border border-rose-500/25 hover:bg-rose-500/15 hover:border-rose-500/50 text-rose-400 transition-all"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg bg-foreground/[0.03] border border-border/60 px-2.5 py-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={10} className={color} />
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-bold font-mono tabular-nums">{value}</p>
    </div>
  );
}
