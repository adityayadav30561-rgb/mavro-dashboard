import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Users } from 'lucide-react';
import { getLeads, updateLeadStatus, deleteLead } from '../../api/leads';
import { getWebsites } from '../../api/websites';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', website: '', status: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.website) params.website = filters.website;
      if (filters.status) params.status = filters.status;
      const res = await getLeads(params);
      setLeads(res.data.data.leads || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (e) { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    getWebsites({ limit: 100 }).then(r => setWebsites(r.data.data.websites || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filters.page, filters.website, filters.status]);

  const handleSearch = (e) => { e.preventDefault(); setFilters(f => ({ ...f, page: 1 })); load(); };

  const handleStatusChange = async (id, status) => {
    try { await updateLeadStatus(id, { status }); toast.success(`Lead marked as ${status}`); load(); if (selected?._id === id) setSelected(null); }
    catch (e) { toast.error('Update failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try { await deleteLead(id); toast.success('Lead deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        ink="madder"
        icon={Users}
        eyebrow="Intelligence"
        title="Lead Capture"
        subtitle="Form submissions from all websites"
      />

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by name, email, company..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="input-field pl-9" />
          </div>
          <select value={filters.website} onChange={e => setFilters(f => ({ ...f, website: e.target.value, page: 1 }))}
            className="input-field sm:w-48">
            <option value="">All Websites</option>
            {websites.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            className="input-field sm:w-40">
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="closed">Closed</option>
          </select>
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Contact</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Website</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Company</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Date</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center">
                  <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-500">No leads found</td></tr>
              ) : leads.map(lead => (
                <tr key={lead._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900 dark:text-white">{lead.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{lead.email}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-slate-600 dark:text-slate-400">{lead.website?.name || '—'}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-600 dark:text-slate-400">{lead.company || '—'}</td>
                  <td className="px-5 py-3.5"><Badge variant={lead.status}>{lead.status}</Badge></td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 dark:text-slate-400">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(lead)} title="View details"
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDelete(lead._id)} title="Delete"
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
            onPageChange={p => setFilters(f => ({ ...f, page: p }))} />
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Lead Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Name</p><p className="mt-0.5 text-sm font-medium text-slate-900 dark:text-white">{selected.name}</p></div>
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Email</p><p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{selected.email}</p></div>
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Phone</p><p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{selected.phone || '—'}</p></div>
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Company</p><p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{selected.company || '—'}</p></div>
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Website</p><p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{selected.website?.name || '—'}</p></div>
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Source Page</p><p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300 truncate">{selected.sourcePage || '—'}</p></div>
              {selected.formId && (
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Form</p><p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{selected.formId}</p></div>
              )}
            </div>

            {selected.customFields && Object.keys(selected.customFields).length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Form Responses</p>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 grid grid-cols-2 gap-3">
                  {Object.entries(selected.customFields).map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</p>
                      <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200 break-words">
                        {Array.isArray(v) ? v.join(', ') : (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.message && (
              <div><p className="text-xs text-slate-500 uppercase font-semibold">Message</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 whitespace-pre-wrap">{selected.message}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {['new', 'contacted', 'qualified', 'converted', 'closed'].map(s => (
                  <button key={s} onClick={() => handleStatusChange(selected._id, s)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                      selected.status === s ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
