import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Briefcase, Plus, Mail, ExternalLink } from 'lucide-react';
import {
  getLeads, updateLeadStatus, updateLead, deleteLead,
  addEmailLogEntry, getFollowUps, getLead,
} from '../../api/leads';
import { getWebsites } from '../../api/websites';
import Chip from '../../components/leads/Chip';
import AddLeadModal from '../../components/leads/AddLeadModal';
import FollowUpPanel from '../../components/leads/FollowUpPanel';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { CHANNEL, TEMPERATURE, MAIL_STATUS, fmtDate, fmtDateTime } from '@/lib/leadMeta';
import toast from 'react-hot-toast';

// SaiSatwik services CRM — B2B enquiries for SAP, Salesforce, app development,
// cloud and the Mavro product. Structurally different from Spanbix's Lead
// Capture: these come from LinkedIn outreach and the saisatwik.com quote form,
// and are tracked by service line rather than by course.
//
// Column set mirrors the spreadsheet this replaces (Service, Hot/Cold, L1/L2,
// Point of Contact, Pending on, Action, Country) so nothing the team relied on
// was dropped in the move.
const TENANT_SLUG = 'saisatwik';

// Their own pipeline wording. `follow_up` exists because the sheet used it as
// a real working state, distinct from "contacted".
const STATUSES = ['new', 'contacted', 'follow_up', 'qualified', 'converted', 'closed'];
// Leads harvested from LinkedIn posts often have no email — the author asked
// for DMs. Rather than guessing an address, link out to an Apollo people
// search pre-filled with the name and company so whoever works the dashboard
// can look it up and paste it back. Requires an Apollo account; we hold no
// API key, so nothing is fetched automatically.
const APOLLO_SEARCH = 'https://app.apollo.io/#/people?finderViewId=5b6dfc5a73f47568b2e5f11c&qKeywords=';
const apolloUrl = (lead) =>
  APOLLO_SEARCH + encodeURIComponent([lead.name, lead.company].filter(Boolean).join(' '));
// Null-safe: this also runs on mount, before any lead is selected.
const missingEmail = (lead) => !lead?.email || lead.email.endsWith('@import.invalid');

const STATUS_LABEL = {
  new: 'Not contacted', contacted: 'Contacted', follow_up: 'Follow up',
  qualified: 'Qualified', converted: 'Converted', closed: 'Closed',
};

export default function SaisatwikLeads() {
  const [leads, setLeads] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [tenantId, setTenantId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', status: '', channel: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [mail, setMail] = useState({ subject: '', snippet: '' });
  const [followUps, setFollowUps] = useState(null);
  const [followLoading, setFollowLoading] = useState(true);
  const [crm, setCrm] = useState({});
  const [busy, setBusy] = useState('');

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 15, website: tenantId };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.channel) params.channel = filters.channel;
      const res = await getLeads(params);
      setLeads(res.data.data.leads || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  };

  const loadFollowUps = async () => {
    setFollowLoading(true);
    try {
      const res = await getFollowUps();
      setFollowUps(res.data.data);
    } catch { /* panel stays empty */ }
    finally { setFollowLoading(false); }
  };

  // The follow-up panel carries only a summary, so open the full record.
  const openLeadById = async (id) => {
    const inList = leads.find((l) => l._id === id);
    if (inList) { setSelected(inList); return; }
    try {
      const res = await getLead(id);
      setSelected(res.data.data.lead);
    } catch { toast.error('Could not open that lead'); }
  };

  useEffect(() => {
    getWebsites({ limit: 100 })
      .then((r) => {
        const all = r.data.data.websites || [];
        setWebsites(all);
        setTenantId(all.find((w) => w.slug === TENANT_SLUG)?._id || null);
      })
      .catch(() => {});
    loadFollowUps();
  }, []);

  useEffect(() => { load(); }, [tenantId, filters.page, filters.status, filters.channel]);

  // Load the open lead's CRM columns into an editable draft.
  useEffect(() => {
    setMail({ subject: '', snippet: '' });
    setCrm({
      service: selected?.service || '',
      l1Category: selected?.l1Category || '',
      l2Category: selected?.l2Category || '',
      country: selected?.country || '',
      pointOfContact: selected?.pointOfContact || '',
      nextAction: selected?.nextAction || '',
      pendingOn: selected?.pendingOn || '',
      temperature: selected?.temperature || '',
      mailStatus: selected?.mailStatus || 'unknown',
      // Blank when the record only holds the @import.invalid placeholder, so
      // the operator sees an empty box to paste the real address into.
      email: missingEmail(selected) ? '' : (selected?.email || ''),
    });
  }, [selected?._id]);

  const saveCrm = async () => {
    if (!selected) return;
    setBusy('crm');
    try {
      const payload = { ...crm };
      // Never overwrite a good address with a blank, and never write the
      // placeholder back as if it were real.
      if (!payload.email?.trim()) delete payload.email;
      const res = await updateLead(selected._id, payload);
      toast.success('Saved');
      setSelected(res.data.data.lead);
      load();
    } catch (e) { toast.error(e?.response?.data?.message || 'Save failed'); }
    finally { setBusy(''); }
  };

  const logEmail = async () => {
    if (!selected) return;
    setBusy('mail');
    try {
      const res = await addEmailLogEntry(selected._id, { subject: mail.subject.trim(), snippet: mail.snippet.trim() });
      toast.success('Email logged');
      setSelected(res.data.data.lead);
      setMail({ subject: '', snippet: '' });
      load();
      loadFollowUps();
    } catch (e) { toast.error(e?.response?.data?.message || 'Could not log email'); }
    finally { setBusy(''); }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateLeadStatus(id, { status });
      toast.success(`Marked ${STATUS_LABEL[status] || status}`);
      load();
      if (selected?._id === id) setSelected((s) => ({ ...s, status }));
    } catch { toast.error('Update failed'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try { await deleteLead(id); toast.success('Deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const set = (k) => (e) => setCrm((c) => ({ ...c, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <PageHeader
        ink="teal"
        icon={Briefcase}
        eyebrow="Intelligence"
        title="SaiSatwik Leads"
        subtitle="Services pipeline — SAP, Salesforce, app development, cloud, Mavro"
        actions={
          <button onClick={() => setAddOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Lead
          </button>
        }
      />

      <FollowUpPanel data={followUps} loading={followLoading} onOpenLead={openLeadById} />

      <div className="card p-4">
        <form onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, page: 1 })); load(); }}
          className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search name, email, company…" value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="input-field pl-9" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
            className="input-field sm:w-44">
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select value={filters.channel} onChange={(e) => setFilters((f) => ({ ...f, channel: e.target.value, page: 1 }))}
            className="input-field sm:w-44">
            <option value="">All Sources</option>
            {['linkedin', 'direct', 'manual', 'referral', 'google_organic'].map((c) => (
              <option key={c} value={c}>{CHANNEL[c]?.label || c}</option>
            ))}
          </select>
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Contact</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Service</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden xl:table-cell">Country</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Source</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">Temp</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden xl:table-cell">Owner</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-slate-500">No leads found</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900 dark:text-white">{lead.name}</p>
                    {missingEmail(lead) ? (
                      <a href={apolloUrl(lead)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                        Find email on Apollo <ExternalLink size={11} />
                      </a>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{lead.email}</p>
                    )}
                    {lead.company && <p className="text-[11px] text-slate-400">{lead.company}</p>}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-600 dark:text-slate-400">
                    <p className="line-clamp-2 max-w-[220px]">{lead.service || '—'}</p>
                    {lead.l2Category && <p className="text-[11px] text-slate-400">{lead.l2Category}</p>}
                  </td>
                  <td className="px-5 py-3.5 hidden xl:table-cell text-slate-600 dark:text-slate-400">{lead.country || '—'}</td>
                  <td className="px-5 py-3.5"><Chip map={CHANNEL} value={lead.channel} /></td>
                  <td className="px-5 py-3.5 hidden sm:table-cell"><Chip map={TEMPERATURE} value={lead.temperature} /></td>
                  <td className="px-5 py-3.5"><Badge variant={lead.status}>{STATUS_LABEL[lead.status] || lead.status}</Badge></td>
                  <td className="px-5 py-3.5 hidden xl:table-cell text-slate-600 dark:text-slate-400">{lead.pointOfContact || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(lead)} title="View details"
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => remove(lead._id)} title="Delete"
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <Pagination page={pagination.page} totalPages={pagination.totalPages}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Lead Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Info label="Name">{selected.name}</Info>
              <Info label="Email">
                {missingEmail(selected) ? (
                  <a href={apolloUrl(selected)} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold hover:underline">
                    Find on Apollo <ExternalLink size={12} />
                  </a>
                ) : selected.email}
              </Info>
              <Info label="Phone">{selected.phone || '—'}</Info>
              <Info label="Company">{selected.company || '—'}</Info>
              <Info label="Source"><Chip map={CHANNEL} value={selected.channel} /></Info>
              <Info label="Form source">{selected.formSource || '—'}</Info>
              <Info label="Received">{fmtDate(selected.submittedAt || selected.createdAt)}</Info>
              <Info label="Last update">{fmtDate(selected.lastContactedAt)}</Info>
            </div>

            {selected.message && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Message / Notes</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selected.message}
                </p>
              </div>
            )}

            {/* Editable CRM columns — the ones the spreadsheet carried. */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Qualification</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Service" value={crm.service} onChange={set('service')} placeholder="SAP Implementation" />
                <Field label="Country" value={crm.country} onChange={set('country')} placeholder="India" />
                <Field label="L1 (SAP / Mavro / Others)" value={crm.l1Category} onChange={set('l1Category')} placeholder="SAP" />
                <Field label="L2 (SAP-Imp, HRMS, CRM, ERP)" value={crm.l2Category} onChange={set('l2Category')} placeholder="HRMS" />
                <Field label="Point of contact" value={crm.pointOfContact} onChange={set('pointOfContact')} placeholder="Aditya" />
                <Field label="Email" type="email" value={crm.email} onChange={set('email')} placeholder="Paste the address found on Apollo" />
                <Select label="Hot / Cold" value={crm.temperature} onChange={set('temperature')}>
                  <option value="">Not set</option>
                  {Object.entries(TEMPERATURE).map(([v, t]) => <option key={v} value={v}>{t.label}</option>)}
                </Select>
                <Field label="Pending on" value={crm.pendingOn} onChange={set('pendingOn')} placeholder="Budget approval" />
                <Select label="Email history" value={crm.mailStatus} onChange={set('mailStatus')}>
                  <option value="unknown">Unknown</option>
                  <option value="not_sent">Not emailed yet</option>
                  <option value="sent">Already emailed</option>
                </Select>
              </div>
              <label className="block mt-3">
                <span className="text-[11px] text-slate-500 font-semibold">Next action</span>
                <textarea rows={2} value={crm.nextAction} onChange={set('nextAction')} maxLength={1000}
                  placeholder="Send the revised proposal, review with Abhishek…"
                  className="input-field mt-1 resize-y" />
              </label>
              <button onClick={saveCrm} disabled={busy === 'crm'} className="btn-primary mt-2 disabled:opacity-60">
                {busy === 'crm' ? 'Saving…' : 'Save details'}
              </button>
            </div>

            {/* Email outreach — drives the 3/6/10 follow-up sequence. */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Email Outreach</p>
                <Chip map={MAIL_STATUS} value={selected.mailStatus} />
              </div>
              {selected.emailLog?.length > 0 ? (
                <div className="space-y-2 mb-3 max-h-44 overflow-y-auto">
                  {[...selected.emailLog].reverse().map((e, i) => (
                    <div key={e._id || i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {e.sequenceStep === 0 ? 'First mail' : `Reminder ${e.sequenceStep}`}
                        </p>
                        <p className="text-[10px] text-slate-500 whitespace-nowrap">{fmtDateTime(e.sentAt)}</p>
                      </div>
                      {e.subject && <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{e.subject}</p>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500 mb-3">No emails logged yet.</p>}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2">
                <input value={mail.subject} onChange={(e) => setMail((m) => ({ ...m, subject: e.target.value }))}
                  placeholder="Subject" maxLength={300} className="input-field" />
                <button onClick={logEmail} disabled={busy === 'mail'} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  <Mail size={14} /> {busy === 'mail' ? 'Logging…' : 'Log email sent'}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => changeStatus(selected._id, s)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      selected.status === s
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}>{STATUS_LABEL[s]}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        websites={websites.filter((w) => w.slug === TENANT_SLUG)}
        onCreated={load}
      />
    </div>
  );
}

const Info = ({ label, children }) => (
  <div>
    <p className="text-xs text-slate-500 uppercase font-semibold">{label}</p>
    <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300 break-words">{children}</p>
  </div>
);

const Field = ({ label, ...props }) => (
  <label className="block">
    <span className="text-[11px] text-slate-500 font-semibold">{label}</span>
    <input className="input-field mt-1" {...props} />
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label className="block">
    <span className="text-[11px] text-slate-500 font-semibold">{label}</span>
    <select className="input-field mt-1" {...props}>{children}</select>
  </label>
);
