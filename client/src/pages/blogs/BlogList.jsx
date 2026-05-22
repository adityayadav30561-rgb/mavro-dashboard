import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Eye, Pencil, FileEdit } from 'lucide-react';
import { getBlogs, deleteBlog, publishBlog, unpublishBlog } from '../../api/blogs';
import { getWebsites } from '../../api/websites';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: '', targetWebsite: '', statusFilter: '', page: 1 });

  // statusFilter values map to either editorialStatus (pipeline) or status (legacy publish state).
  // Pipeline values come from the 5-col kanban on /calendar.
  const PIPELINE_VALUES = ['ideas', 'drafting', 'review', 'scheduled', 'published'];
  const LEGACY_VALUES = ['draft', 'archived'];
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.targetWebsite) params.targetWebsite = filters.targetWebsite;
      if (filters.statusFilter) {
        if (PIPELINE_VALUES.includes(filters.statusFilter)) {
          params.editorialStatus = filters.statusFilter;
        } else {
          params.status = filters.statusFilter;
        }
      }
      const res = await getBlogs(params);
      setBlogs(res.data.data.blogs || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1 });
    } catch (e) { toast.error('Failed to load blogs'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    getWebsites({ limit: 100 }).then(r => setWebsites(r.data.data.websites || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filters.page, filters.targetWebsite, filters.statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, page: 1 }));
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog post?')) return;
    try { await deleteBlog(id); toast.success('Blog deleted'); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const handleMoveToDraft = async (blog) => {
    if (pendingId === blog._id) return;
    if (blog.status === 'draft') return;
    setPendingId(blog._id);
    const prevStatus = blog.status;
    // Optimistic flip
    setBlogs((prev) => prev.map((b) => b._id === blog._id ? { ...b, status: 'draft' } : b));
    try {
      await unpublishBlog(blog._id);
      toast.success('Moved to draft');
      await load();
    } catch (e) {
      setBlogs((prev) => prev.map((b) => b._id === blog._id ? { ...b, status: prevStatus } : b));
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setPendingId(null);
    }
  };

  const handleTogglePublish = async (blog) => {
    // Guard: ignore clicks while a toggle is already in-flight for this row
    if (pendingId === blog._id) return;
    setPendingId(blog._id);
    const willPublish = blog.status !== 'published';
    // Optimistic update — flip status in local list immediately so subsequent
    // renders read the new state before the server roundtrip completes.
    setBlogs((prev) => prev.map((b) => b._id === blog._id
      ? { ...b, status: willPublish ? 'published' : 'draft', publishedAt: willPublish ? new Date().toISOString() : b.publishedAt }
      : b));
    try {
      if (willPublish) {
        await publishBlog(blog._id);
        toast.success('Blog published!');
      } else {
        await unpublishBlog(blog._id);
        toast.success('Blog unpublished');
      }
      await load();
    } catch (e) {
      // Rollback optimistic update on failure
      setBlogs((prev) => prev.map((b) => b._id === blog._id ? { ...b, status: blog.status, publishedAt: blog.publishedAt } : b));
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Blogs</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage blog posts across all websites</p>
        </div>
        <Link to="/blogs/new" className="btn-primary"><Plus size={16} /> New Blog</Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search blogs..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="input-field pl-9" />
          </div>
          <select value={filters.targetWebsite} onChange={e => setFilters(f => ({ ...f, targetWebsite: e.target.value, page: 1 }))}
            className="input-field sm:w-48">
            <option value="">All Websites</option>
            {websites.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <select value={filters.statusFilter} onChange={e => setFilters(f => ({ ...f, statusFilter: e.target.value, page: 1 }))}
            className="input-field sm:w-44">
            <option value="">All Status</option>
            <optgroup label="Pipeline">
              <option value="ideas">Ideas</option>
              <option value="drafting">Drafting</option>
              <option value="review">Review</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </optgroup>
            <optgroup label="Publish State">
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </optgroup>
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
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Title</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">Website</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">Date</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center">
                  <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : blogs.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-500">No blogs found</td></tr>
              ) : blogs.map(blog => (
                <tr key={blog._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900 dark:text-white truncate max-w-xs">{blog.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{blog.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-slate-600 dark:text-slate-400">{blog.targetWebsite?.name || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={blog.status}>{blog.status}</Badge>
                    {blog.editorialStatus && blog.editorialStatus !== blog.status && (
                      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 mt-1 font-semibold">{blog.editorialStatus}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-slate-500 dark:text-slate-400">
                    {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleTogglePublish(blog)}
                        disabled={pendingId === blog._id}
                        title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                      >
                        <Eye size={16} />
                      </button>
                      <Link to={`/blogs/${blog._id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-400 hover:text-blue-600 transition-colors">
                        <Pencil size={16} />
                      </Link>
                      {blog.status === 'draft' ? (
                        <button
                          onClick={() => handleDelete(blog._id)}
                          title="Delete draft"
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMoveToDraft(blog)}
                          disabled={pendingId === blog._id}
                          title="Move to draft"
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-400 hover:text-amber-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                          <FileEdit size={16} />
                        </button>
                      )}
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
    </div>
  );
}
