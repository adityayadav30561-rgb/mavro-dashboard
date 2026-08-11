// ════════════════════════════════════════════════════════════════════════════
// Shared vocabulary for the Lead Capture UI.
// ────────────────────────────────────────────────────────────────────────────
// Labels and chip styling for every lead enum, in one place so the table, the
// detail modal, the follow-up panel and the add form cannot drift apart.
//
// Values mirror the server enums:
//   channel      → src/utils/leadChannel.js
//   temperature  → src/models/Lead.js
//   mailStatus   → src/models/Lead.js
//   cadence      → src/utils/leadFollowUp.js (gaps of 3 / 6 / 10 days)
// ════════════════════════════════════════════════════════════════════════════

export const CHANNEL = {
  google_ads:     { label: 'Google Ads',    cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' },
  facebook_ads:   { label: 'Facebook Ads',  cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' },
  instagram_ads:  { label: 'Instagram Ads', cls: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20' },
  linkedin:       { label: 'LinkedIn',      cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20' },
  campaign:       { label: 'Campaign',      cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20' },
  google_organic: { label: 'Google Search', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  social:         { label: 'Social',        cls: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20' },
  referral:       { label: 'Referral',      cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  walk_in:        { label: 'Walk-in',       cls: 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-500/10 dark:text-lime-400 dark:border-lime-500/20' },
  manual:         { label: 'Manual',        cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600' },
  direct:         { label: 'Direct',        cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600' },
};

export const TEMPERATURE = {
  hot:  { label: 'Hot',  cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' },
  warm: { label: 'Warm', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' },
  cold: { label: 'Cold', cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20' },
};

export const MAIL_STATUS = {
  sent:      { label: 'Sent',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' },
  not_sent:  { label: 'Not sent',  cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-300 dark:border-slate-600' },
  // Imported leads whose email history nobody recorded. Deliberately its own
  // state rather than being folded into "not sent" — see leadFollowUp.js.
  unknown:   { label: 'Unknown',   cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' },
};

export const LOST_REASON = {
  price: 'Too expensive',
  timing: 'Bad timing',
  chose_competitor: 'Chose a competitor',
  not_qualified: 'Not qualified',
  no_response: 'No response',
  duplicate: 'Duplicate',
  other: 'Other',
};

/** Lead types. Free text on the server; these are the suggested values. */
export const LEAD_TYPES = ['individual', 'campus', 'corporate'];

/** Channels a human can pick when adding a lead by hand. */
export const MANUAL_CHANNELS = ['linkedin', 'referral', 'walk_in', 'manual', 'campaign', 'direct'];

/** Gaps in days between outreach emails. Mirrors the server cadence. */
export const CADENCE_DAYS = [3, 6, 10];

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }) : '—';

/** "3 days overdue" / "in 2 days" / "today" — relative to now. */
export function relativeDays(date) {
  if (!date) return '';
  const days = Math.round((new Date(date) - new Date()) / 86400000);
  if (days === 0) return 'today';
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  return `in ${days} day${days === 1 ? '' : 's'}`;
}
