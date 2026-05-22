import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { importBlogDocx } from '@/api/blogs';

/**
 * DOCX → HTML import button. Uploads a .docx file to the backend, where
 * mammoth converts it to clean HTML preserving heading hierarchy, lists,
 * blockquotes, tables, and emphasis. On success, fires `onImport({ html,
 * detectedTitle, wordCount, readingTime, warnings })`.
 *
 * Formatting only — no AI rewriting, no content generation.
 */
export default function DocxImportButton({ onImport }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [lastFile, setLastFile] = useState(null);

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) {
      toast.error('Only .docx files are supported');
      e.target.value = '';
      return;
    }
    setBusy(true);
    try {
      const r = await importBlogDocx(file);
      const data = r?.data?.data || {};
      onImport?.(data);
      setLastFile({
        name: file.name,
        words: data.wordCount,
        readingTime: data.readingTime,
        structure: data.structure || null,
      });
      const wc = data.wordCount || 0;
      const s = data.structure || {};
      const promotedTotal = (s.promoted?.promotedH2 || 0) + (s.promoted?.promotedH3 || 0) + (s.promoted?.promotedH1 || 0);
      const summary = [];
      summary.push(`${wc} words`);
      if (s.h2 || s.h3) summary.push(`${s.h2 || 0} H2 · ${s.h3 || 0} H3`);
      if (promotedTotal) summary.push(`promoted ${promotedTotal}`);
      toast.success(`Imported · ${summary.join(' · ')}`);
      if (data.warnings?.length) {
        console.warn('[DOCX import warnings]', data.warnings);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="mb-3 flex items-center gap-3">
      <motion.button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11.5px] font-bold uppercase tracking-[0.16em] border transition-colors',
          busy
            ? 'bg-foreground/[0.04] text-muted-foreground border-border/60 cursor-not-allowed'
            : 'bg-violet-500/15 text-violet-300 border-violet-500/40 hover:bg-violet-500/25',
        )}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        {busy ? 'Parsing…' : 'Import DOCX'}
      </motion.button>

      {lastFile && !busy && (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 flex-wrap">
          <CheckCircle2 size={11} />
          <FileText size={11} />
          <span className="truncate max-w-[200px]">{lastFile.name}</span>
          <span className="text-muted-foreground">· {lastFile.words}w · {lastFile.readingTime}m</span>
          {lastFile.structure && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.12em] border border-violet-500/40 bg-violet-500/10 text-violet-300">
              {lastFile.structure.h1 || 0} H1 · {lastFile.structure.h2 || 0} H2 · {lastFile.structure.h3 || 0} H3
            </span>
          )}
          {lastFile.structure?.promoted?.scanned > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {(lastFile.structure.promoted.promotedH2 || 0) + (lastFile.structure.promoted.promotedH3 || 0) + (lastFile.structure.promoted.promotedH1 || 0)} promoted from bold
            </span>
          )}
        </span>
      )}

      <span className="ml-auto text-[10px] text-muted-foreground italic">
        formatting only — no AI rewriting
      </span>

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
