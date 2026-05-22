import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Send, CheckCircle2, Loader2, FileText, Settings2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getBlog, createBlog, updateBlog } from '../../api/blogs';
import { getWebsites } from '../../api/websites';
import RichTextEditor from '../../components/ui/RichTextEditor';
import DocxImportButton from '../../components/blog-editor/DocxImportButton';
import FaqBlockButton from '../../components/blog-editor/FaqBlockButton';
import SeoAssistantPanel from '../../components/blog-editor/SeoAssistantPanel';
import AiTitleSuggester from '../../components/blog-editor/AiTitleSuggester';
import AiMetaSuggester from '../../components/blog-editor/AiMetaSuggester';
import AiFaqGenerator from '../../components/blog-editor/AiFaqGenerator';
import useTenantBlogCorpus from '../../hooks/useTenantBlogCorpus';
import { trackLinkInsert } from '@/lib/internalLinkTracker';
import { cn } from '@/lib/utils';

const emptyForm = {
  title: '', content: '', targetWebsite: '', status: 'draft',
  excerpt: '', featuredImage: '', seoTitle: '', seoDescription: '',
  keywords: '', tags: '', category: '', canonicalUrl: '',
  scheduledAt: '',
};

const AUTOSAVE_KEY_PREFIX = 'mavro_blog_draft_';

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  // Calendar quick-create deep links — /blogs/new?scheduledAt=ISO&targetWebsite=ID
  const initialQuery = (() => {
    if (typeof window === 'undefined') return {};
    const p = new URLSearchParams(window.location.search);
    return {
      scheduledAt:   p.get('scheduledAt') || '',
      targetWebsite: p.get('targetWebsite') || '',
    };
  })();
  const [form, setForm] = useState(() => {
    if (!initialQuery.scheduledAt && !initialQuery.targetWebsite) return emptyForm;
    return {
      ...emptyForm,
      status: initialQuery.scheduledAt ? 'scheduled' : emptyForm.status,
      scheduledAt: initialQuery.scheduledAt || '',
      targetWebsite: initialQuery.targetWebsite || emptyForm.targetWebsite,
    };
  });
  const [focusKeyword, setFocusKeyword] = useState('');
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autosaveState, setAutosaveState] = useState('idle'); // idle | dirty | saving | saved
  const initializedRef = useRef(false);

  // Load websites + existing blog
  useEffect(() => {
    getWebsites({ limit: 100 })
      .then((r) => setWebsites(r.data.data.websites || []))
      .catch(() => {});

    if (isEdit) {
      setLoading(true);
      getBlog(id)
        .then((r) => {
          const b = r.data.data.blog;
          setForm({
            title: b.title || '',
            content: b.content || '',
            targetWebsite: b.targetWebsite?._id || b.targetWebsite || '',
            status: b.status || 'draft',
            excerpt: b.excerpt || '',
            featuredImage: b.featuredImage || '',
            seoTitle: b.seoTitle || '',
            seoDescription: b.seoDescription || '',
            keywords: (b.keywords || []).join(', '),
            tags: (b.tags || []).join(', '),
            category: b.category || '',
            canonicalUrl: b.canonicalUrl || '',
          });
          initializedRef.current = true;
        })
        .catch(() => toast.error('Failed to load blog'))
        .finally(() => setLoading(false));
    } else {
      // Restore local draft if present (new-blog flow only)
      try {
        const draft = localStorage.getItem(AUTOSAVE_KEY_PREFIX + 'new');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed?.form) {
            setForm(parsed.form);
            if (parsed.focusKeyword) setFocusKeyword(parsed.focusKeyword);
          }
        }
      } catch { /* ignore */ }
      initializedRef.current = true;
    }
  }, [id]);

  // Local autosave to localStorage on form change (debounced)
  useEffect(() => {
    if (!initializedRef.current) return;
    setAutosaveState('dirty');
    const t = setTimeout(() => {
      try {
        setAutosaveState('saving');
        const key = AUTOSAVE_KEY_PREFIX + (isEdit ? id : 'new');
        localStorage.setItem(key, JSON.stringify({ form, focusKeyword, savedAt: Date.now() }));
        setAutosaveState('saved');
      } catch {
        setAutosaveState('idle');
      }
    }, 700);
    return () => clearTimeout(t);
  }, [form, focusKeyword, isEdit, id]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e?.target ? e.target.value : e }));

  // Tenant-scoped corpus for Internal Link Engine. `currentBlogId` excluded so
  // a blog never suggests itself.
  const { corpus, loading: corpusLoading } = useTenantBlogCorpus(form.targetWebsite, id);
  const selectedWebsite = websites.find((w) => w._id === form.targetWebsite);

  // Insert anchor into the rich-text editor. Quill content is HTML — append a
  // sentence with the new anchor so the user can reposition it.
  const handleInsertLink = (href, anchor) => {
    if (!href || !anchor) return;
    const safeAnchor = String(anchor).replace(/[<>"']/g, '');
    const safeHref = String(href).replace(/"/g, '%22');

    // Contextual insertion — wrap the first naturally-occurring instance of
    // the anchor text inside the existing content. Falls back to appended
    // paragraph only when no in-context match exists.
    const escaped = safeAnchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    // Avoid touching text already inside an <a> tag (negative-lookbehind on </a>'s open)
    const inlineRe = new RegExp(`(?<!<a[^>]*>[^<]*?)\\b(${escaped})\\b(?![^<]*<\\/a>)`, 'i');

    setForm((f) => {
      const current = f.content || '';
      let next;
      let inline = false;
      if (inlineRe.test(current)) {
        next = current.replace(inlineRe, `<a href="${safeHref}">$1</a>`);
        inline = true;
      } else {
        next = current + `<p><a href="${safeHref}">${safeAnchor}</a></p>`;
      }
      // Defer toast so we know which branch fired
      setTimeout(() => {
        toast.success(inline ? `Linked "${safeAnchor}" in context` : `Appended link: ${safeAnchor}`);
      }, 0);
      return { ...f, content: next };
    });

    trackLinkInsert({
      websiteSlug: selectedWebsite?.slug || '',
      href: safeHref,
      anchor: safeAnchor,
      sourceBlogId: id || null,
    });
  };

  const handleSubmit = async (publishNow = false) => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.content.trim() || form.content === '<p><br></p>') return toast.error('Content is required');
    if (!form.targetWebsite) return toast.error('Please select a website');

    setSaving(true);
    try {
      const data = {
        ...form,
        status: publishNow ? 'published' : form.status,
        keywords: form.keywords
          ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (isEdit) {
        await updateBlog(id, data);
        toast.success('Blog updated!');
      } else {
        await createBlog(data);
        toast.success(publishNow ? 'Blog published!' : 'Blog saved as draft!');
      }

      // Clear local draft on successful save
      try { localStorage.removeItem(AUTOSAVE_KEY_PREFIX + (isEdit ? id : 'new')); } catch {}
      navigate('/blogs');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/blogs')}
            className="p-2 rounded-lg hover:bg-foreground/[0.05] text-muted-foreground hover:text-foreground transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-caption text-violet-400/80">Editorial Cockpit</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
              {isEdit ? 'Edit Blog' : 'New Blog Post'}
            </h1>
          </div>
        </div>
        <AutosaveIndicator state={autosaveState} />
      </div>

      {/* Layout: 12-col grid, 8 editor, 4 SEO panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor surface (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-6 md:p-7">
            <div className="flex items-start gap-3">
              <input
                type="text"
                value={form.title}
                onChange={set('title')}
                placeholder="Enter your blog title…"
                className="flex-1 min-w-0 bg-transparent text-3xl md:text-4xl font-bold tracking-[-0.02em] leading-tight outline-none placeholder:text-muted-foreground/40"
              />
              <div className="flex-shrink-0 pt-2">
                <AiTitleSuggester
                  focusKeyword={focusKeyword}
                  currentTitle={form.title}
                  contentHtml={form.content}
                  targetWebsite={form.targetWebsite}
                  tags={form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []}
                  category={form.category}
                  onApply={(newTitle) => {
                    setForm((f) => ({ ...f, title: newTitle }));
                    toast.success('Title applied');
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_hsl(160_70%_45%/0.6)]" />
                {form.status === 'published' ? 'Published' : form.status === 'draft' ? 'Draft' : form.status}
              </span>
              {form.targetWebsite && (
                <span>· {websites.find((w) => w._id === form.targetWebsite)?.name || 'Unknown property'}</span>
              )}
            </div>

            <div className="mt-6">
              <div className="mb-3 space-y-3 w-full">
                <div className="flex flex-wrap items-center gap-3">
                  <DocxImportButton
                    onImport={({ html, detectedTitle }) => {
                      setForm((f) => {
                        const current = (f.content && f.content !== '<p><br></p>') ? f.content : '';
                        return {
                          ...f,
                          title: f.title?.trim() ? f.title : (detectedTitle || f.title),
                          content: current + html,
                        };
                      });
                    }}
                  />
                </div>
                {/* FAQ insert + AI FAQ generator share a row so the
                    expanded form panel + suggestion drawer stay inside
                    the editor column. */}
                <div className="flex flex-wrap items-center gap-3">
                  <FaqBlockButton
                    onInsert={(html) => {
                      setForm((f) => {
                        const current = (f.content && f.content !== '<p><br></p>') ? f.content : '';
                        // No \n between blocks — Quill turns stray whitespace
                        // between HTML blocks into delta ops that can swallow
                        // adjacent content. Concatenate cleanly.
                        return { ...f, content: current + html };
                      });
                    }}
                  />
                  <AiFaqGenerator
                    focusKeyword={focusKeyword}
                    blogTitle={form.title}
                    contentHtml={form.content}
                    targetWebsite={form.targetWebsite}
                    tags={form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []}
                    category={form.category}
                    existingQuestions={(() => {
                      // Scan current content for existing Q. patterns so the
                      // backend can dedupe before generating new FAQs.
                      const out = [];
                      const re = /<strong>\s*Q\s*[.:]\s*([^<]{4,200})<\/strong>/gi;
                      let m;
                      while ((m = re.exec(form.content || '')) !== null) {
                        const q = m[1].replace(/\s+/g, ' ').trim();
                        if (q) out.push(q);
                      }
                      return out;
                    })()}
                    onInsertHtml={(html) => {
                      if (!html) return;
                      setForm((f) => {
                        const current = (f.content && f.content !== '<p><br></p>') ? f.content : '';
                        return { ...f, content: current + html };
                      });
                      toast.success('FAQ inserted');
                    }}
                  />
                </div>
              </div>
              <RichTextEditor
                value={form.content}
                onChange={(val) => setForm((f) => ({ ...f, content: val }))}
              />
            </div>

            <div className="mt-5 pt-5 border-t border-border/60">
              <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Excerpt</label>
              <textarea
                value={form.excerpt}
                onChange={set('excerpt')}
                rows={2}
                placeholder="One-line hook that appears in blog cards + OG fallback."
                className="mt-2 w-full px-4 py-3 rounded-xl bg-foreground/[0.03] border border-border/70 focus:border-violet-500/60 focus:bg-foreground/[0.05] outline-none transition-all text-sm placeholder:text-muted-foreground/60 resize-none"
              />
            </div>
          </div>

          {/* Metadata & Publish settings */}
          <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/70 p-6 md:p-7">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={14} className="text-cyan-400" />
              <h3 className="text-sm font-bold tracking-tight">Metadata & Publish</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={`SEO Title (${form.seoTitle.length}/70)`} required>
                <input
                  type="text" value={form.seoTitle} onChange={set('seoTitle')} maxLength={70}
                  className="input-glass" placeholder="SERP-optimized title — 50–60 chars ideal"
                />
              </Field>
              <Field label="Canonical URL">
                <input
                  type="text" value={form.canonicalUrl} onChange={set('canonicalUrl')}
                  className="input-glass" placeholder="https://…"
                />
              </Field>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Meta Description ({form.seoDescription.length}/160)
                  </label>
                  <AiMetaSuggester
                    focusKeyword={focusKeyword}
                    blogTitle={form.title}
                    currentDescription={form.seoDescription}
                    contentHtml={form.content}
                    targetWebsite={form.targetWebsite}
                    tags={form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []}
                    category={form.category}
                    onApply={(newDesc) => {
                      setForm((f) => ({ ...f, seoDescription: newDesc }));
                      toast.success('Meta description applied');
                    }}
                  />
                </div>
                <textarea
                  value={form.seoDescription} onChange={set('seoDescription')} rows={2} maxLength={170}
                  className="input-glass resize-none" placeholder="140–160 chars — what shows in SERPs"
                />
              </div>
              <Field label="Keywords (comma-separated)">
                <input
                  type="text" value={form.keywords} onChange={set('keywords')}
                  className="input-glass" placeholder="hrms, hr software, employee management"
                />
              </Field>
              <Field label="Tags (comma-separated)">
                <input
                  type="text" value={form.tags} onChange={set('tags')}
                  className="input-glass" placeholder="guide, features"
                />
              </Field>
              <Field label="Category">
                <input
                  type="text" value={form.category} onChange={set('category')}
                  className="input-glass" placeholder="e.g. Product Guides"
                />
              </Field>
              <Field label="Featured Image URL">
                <input
                  type="text" value={form.featuredImage} onChange={set('featuredImage')}
                  className="input-glass" placeholder="https://…"
                />
              </Field>
              <Field label="Website" required>
                <select value={form.targetWebsite} onChange={set('targetWebsite')} className="input-glass">
                  <option value="">Select property…</option>
                  {websites.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={set('status')} className="input-glass">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>

            {form.featuredImage && (
              <div className="mt-5 pt-5 border-t border-border/60">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">Featured preview</p>
                <img
                  src={form.featuredImage}
                  alt="Featured preview"
                  className="rounded-xl w-full max-h-48 object-cover border border-border/60"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}

            {/* Action row */}
            <div className="mt-6 pt-5 border-t border-border/60 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-card border border-border hover:bg-foreground/[0.04] disabled:opacity-60 transition-all"
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_14px_30px_-10px_hsl(263_70%_50%/0.55)] hover:shadow-[0_18px_36px_-10px_hsl(263_70%_50%/0.75)] disabled:opacity-60 transition-all"
              >
                <Send size={14} /> {saving ? 'Publishing…' : 'Publish Now'}
              </button>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground">
                <FileText size={11} className="inline mr-1" />
                {form.title ? form.title.slice(0, 40) : 'untitled'}
              </span>
            </div>
          </div>
        </div>

        {/* SEO Cockpit (4 cols, sticky) */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scroll-smooth">
            <SeoAssistantPanel
              form={form}
              focusKeyword={focusKeyword}
              onFocusKeywordChange={setFocusKeyword}
              corpus={corpus}
              corpusLoading={corpusLoading}
              tenantSlug={selectedWebsite?.slug || ''}
              tenantName={selectedWebsite?.name || ''}
              onInsertLink={handleInsertLink}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ===================================
// Helpers
// ===================================
function Field({ label, required, className, children }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function AutosaveIndicator({ state }) {
  const map = {
    idle:   { icon: null, label: '',           tone: 'text-muted-foreground' },
    dirty:  { icon: null, label: 'Unsaved',    tone: 'text-amber-400' },
    saving: { icon: Loader2, label: 'Saving…', tone: 'text-cyan-400' },
    saved:  { icon: CheckCircle2, label: 'Draft saved locally', tone: 'text-emerald-400' },
  };
  const m = map[state] || map.idle;
  if (!m.label) return null;
  const Icon = m.icon;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn('inline-flex items-center gap-1.5 text-[11px] font-mono', m.tone)}
      >
        {Icon && <Icon size={11} className={state === 'saving' ? 'animate-spin' : ''} />}
        {m.label}
      </motion.div>
    </AnimatePresence>
  );
}
