import { useState } from 'react';
import { AlarmClock, Send, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Chip from './Chip';
import { CHANNEL, TEMPERATURE, CADENCE_DAYS, relativeDays, fmtDate } from '@/lib/leadMeta';

// Follow-up queue. Three buckets, all computed server-side from the logs
// rather than stored as a work queue — see src/utils/leadFollowUp.js.
//
//   due          the 3/6/10 reminder has come around
//   awaitingMail never emailed at all — top of the funnel
//   unknownMail  imported leads whose email history nobody recorded, so the
//                sequence deliberately will not start until a human resolves it
const TABS = [
  {
    key: 'due',
    label: 'Follow-up due',
    icon: AlarmClock,
    ink: 'text-rose-600 dark:text-rose-400',
    empty: 'Nothing is overdue. Every contacted lead is inside its follow-up window.',
  },
  {
    key: 'awaitingMail',
    label: 'Awaiting first mail',
    icon: Send,
    ink: 'text-blue-600 dark:text-blue-400',
    empty: 'Every lead has been emailed at least once.',
  },
  {
    key: 'unknownMail',
    label: 'Unknown history',
    icon: HelpCircle,
    ink: 'text-orange-600 dark:text-orange-400',
    empty: 'No leads with unrecorded email history.',
  },
];

export default function FollowUpPanel({ data, loading, onOpenLead }) {
  const [tab, setTab] = useState('due');
  const [collapsed, setCollapsed] = useState(false);

  const counts = data?.counts || { due: 0, awaitingMail: 0, unknownMail: 0 };
  const rows = data?.[tab] || [];
  const active = TABS.find((t) => t.key === tab);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <AlarmClock size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Needs attention</h3>
          <span className="text-[11px] text-slate-400">
            chase at {CADENCE_DAYS.join(' · ')} day gaps
          </span>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="flex flex-wrap gap-2 px-5 py-3">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={13} className={isActive ? '' : t.ink} />
                  {t.label}
                  <span className={`px-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-white dark:bg-slate-900'}`}>
                    {counts[t.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="px-5 pb-4">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">{active?.empty}</p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-72 overflow-y-auto">
                {rows.map((l) => (
                  <button
                    key={l._id}
                    onClick={() => onOpenLead?.(l._id)}
                    className="w-full text-left py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {l.name}
                        {l.company && <span className="text-slate-400 font-normal"> · {l.company}</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{l.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Chip map={TEMPERATURE} value={l.temperature} fallback="" />
                      <Chip map={CHANNEL} value={l.channel} fallback="" />
                      {tab === 'due' ? (
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {relativeDays(l.nextFollowUpAt)}
                        </span>
                      ) : tab === 'awaitingMail' ? (
                        <span className="text-[11px] text-slate-500 whitespace-nowrap">
                          added {fmtDate(l.createdAt)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-orange-600 dark:text-orange-400 whitespace-nowrap">
                          confirm if mailed
                        </span>
                      )}
                      {tab === 'due' && (
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {l.mailsSent} sent
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
