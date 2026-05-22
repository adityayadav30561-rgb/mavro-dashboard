import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const btn = (p, label, disabled) => (
    <button key={label || p} onClick={() => onPageChange(p)} disabled={disabled}
      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
        p === page
          ? 'bg-brand-600 text-white font-semibold'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      } disabled:opacity-40 disabled:cursor-not-allowed`}>
      {label || p}
    </button>
  );

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft size={18} />
        </button>
        {start > 1 && <>{btn(1)}<span className="px-1 text-slate-400">…</span></>}
        {pages.map(p => btn(p))}
        {end < totalPages && <><span className="px-1 text-slate-400">…</span>{btn(totalPages)}</>}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
