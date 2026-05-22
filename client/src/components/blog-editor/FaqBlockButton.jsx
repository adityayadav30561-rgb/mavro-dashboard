import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FAQ Block Insert — adds a clean Q/A pair to the editor content.
 *
 * Layout: button on the toolbar row. When clicked, a full-width form
 * panel expands BELOW the toolbar (contained inside the editor column).
 * Form is responsive — fields stack on narrow widths.
 *
 * Insert output:
 *   <p><strong>Q. {question}</strong></p><p>{answer}</p>
 *
 * Quill drops literal <h3> when set externally via the value prop in some
 * builds. Bold-question paragraph format is universally Quill-safe AND is
 * detected by the FAQ pipeline (Pattern B + Q. prefix stripping).
 */
export default function FaqBlockButton({ onInsert }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');

  const submit = () => {
    const qt = q.trim();
    const at = a.trim();
    if (!qt) return;
    // Strip any user-typed "Q." / "Q:" prefix iteratively so we don't end
    // up with "Q. Q. what is bpo?" after the auto-prefix is added.
    const cleaned = stripLeadingQPrefix(sanitize(qt));
    const safeQ = cleaned.replace(/\?+$/, '') + '?';
    const safeA = sanitize(at);
    const html = `<p><strong>Q. ${safeQ}</strong></p><p>${safeA || ''}</p>`;
    onInsert?.(html);
    setQ('');
    setA('');
    setOpen(false);
  };

  function stripLeadingQPrefix(s) {
    let prev;
    let cur = String(s || '').trim();
    do {
      prev = cur;
      cur = cur.replace(/^\s*(?:Q|question|FAQ)\s*[:.\-)]\s*/i, '').trim();
    } while (cur !== prev);
    return cur;
  }

  return (
    <div className="w-full">
      {/* Toolbar button */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11.5px] font-bold uppercase tracking-[0.16em] border transition-colors',
          open
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25'
        )}
      >
        {open ? <X size={12} /> : <HelpCircle size={12} />}
        {open ? 'Cancel FAQ' : 'Insert FAQ'}
      </motion.button>

      {/* Expanded form — full-width panel BELOW the toolbar. Never overflows
          the editor column because it is contained inside this w-full div. */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden mt-3"
          >
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3 space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Question</label>
                <input
                  type="text"
                  value={q}
                  placeholder='e.g. "What is BPO customer service?"'
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) submit(); }}
                  autoFocus
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-foreground/[0.04] border border-border/60 focus:border-cyan-500/60 focus:bg-foreground/[0.06] outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Answer</label>
                <textarea
                  value={a}
                  placeholder="Concise, helpful answer (1–3 sentences)…"
                  onChange={(e) => setA(e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-foreground/[0.04] border border-border/60 focus:border-cyan-500/60 focus:bg-foreground/[0.06] outline-none text-sm transition-all resize-y"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 rounded-md text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!q.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-[0.16em] bg-cyan-500 text-white hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={11} /> Add FAQ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Decode entities + drop invisible/zero-width characters. Codepoints listed
// individually so no `-` becomes a regex range (which would silently match
// every printable ASCII char between two codepoints — the bug that ate
// FAQ content down to "?").
function sanitize(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[  ​‌‍﻿]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
