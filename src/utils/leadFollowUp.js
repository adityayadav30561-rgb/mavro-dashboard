/**
 * Follow-up sequencing for lead outreach.
 *
 * CADENCE (confirmed 2026-08-11): gaps BETWEEN emails, not days from the first.
 *
 *   first mail  ──3 days──▶ reminder 1  ──6 days──▶ reminder 2  ──10 days──▶ reminder 3
 *
 * So a lead emailed on day 0 is chased on days 3, 9 and 19. After the 3rd
 * reminder (the 4th mail overall) the sequence is exhausted and the lead is
 * marked cold — but it stays open and in the working list, so it can still be
 * revived by hand. Nothing is deleted: every mail stays in `emailLog`, which
 * is append-only, so the whole chase history is auditable.
 *
 * UNKNOWN MAIL HISTORY. Leads imported from the old spreadsheet carry
 * `mailStatus: 'unknown'` — nobody recorded whether an email ever went out.
 * Those never generate a reminder, because there is no send date to count
 * from, and they are excluded from "awaiting first mail" too. They sit in
 * their own bucket until a human resolves them. Guessing either way is worse
 * than showing the gap: assume un-emailed and you double-mail someone already
 * in conversation; assume emailed and you silently never contact them.
 *
 * Logging an email against such a lead DOES resolve the unknown — that is a
 * human supplying the missing fact, and the sequence starts from that date.
 *
 * `doNotContact` leads are always excluded.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Gap in days before each step, indexed by how many mails have already gone
 * out. 1 mail sent → wait 3 days; 2 sent → 6; 3 sent → 10; 4+ → sequence over.
 */
const GAPS_DAYS = [3, 6, 10];

/** Total mails (initial + reminders) before a lead is considered exhausted. */
const MAX_MAILS = GAPS_DAYS.length + 1; // 4

/** Outbound mails only — an inbound reply is not a chase. */
function outboundCount(lead) {
  return (lead.emailLog || []).filter((e) => e.direction !== 'inbound').length;
}

/**
 * When the next chase is due, or null when none is.
 * Returns null for: unknown mail history, do-not-contact, nothing sent yet,
 * or a sequence that has run its course.
 */
function computeNextFollowUpAt(lead) {
  if (!lead) return null;
  if (lead.doNotContact) return null;
  if (lead.mailStatus === 'unknown') return null;

  const sent = (lead.emailLog || [])
    .filter((e) => e.direction !== 'inbound')
    .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));

  if (sent.length === 0) return null;          // nothing sent — no reminder yet
  if (sent.length >= MAX_MAILS) return null;   // sequence exhausted

  const gapDays = GAPS_DAYS[sent.length - 1];
  const last = new Date(sent[sent.length - 1].sentAt);
  return new Date(last.getTime() + gapDays * DAY_MS);
}

/** True once the 4th mail has gone out — the trigger to mark the lead cold. */
function isSequenceExhausted(lead) {
  return outboundCount(lead) >= MAX_MAILS;
}

/**
 * Which sequence step the NEXT mail would be: 0 = first mail, 1..3 = reminders.
 * Used to stamp `sequenceStep` when an email is logged.
 */
function nextSequenceStep(lead) {
  return Math.min(outboundCount(lead), MAX_MAILS - 1);
}

/**
 * Recompute every derived activity field. Call after any change to emailLog
 * or contactLog so the stored values can never drift from the logs.
 *
 * Mutates and returns the lead document.
 */
function refreshDerivedFields(lead) {
  const emails = (lead.emailLog || []).filter((e) => e.direction !== 'inbound');
  const contacts = lead.contactLog || [];

  lead.touchCount = emails.length + contacts.length;

  const stamps = [
    ...emails.map((e) => new Date(e.sentAt)),
    ...contacts.map((c) => new Date(c.contactedAt)),
  ].filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a - b);

  if (stamps.length) {
    lead.firstRespondedAt = stamps[0];
    lead.lastContactedAt = stamps[stamps.length - 1];
  }

  if (emails.length > 0 && lead.mailStatus !== 'sent') lead.mailStatus = 'sent';

  // Manual overrides of nextFollowUpAt are respected only while the sequence
  // is still running; once exhausted the reminder is cleared regardless.
  lead.nextFollowUpAt = computeNextFollowUpAt(lead);

  if (isSequenceExhausted(lead)) {
    // Cold, but deliberately still open (decision 2026-08-11): status and
    // pipeline position are untouched so it stays in the working list.
    lead.temperature = 'cold';
  }

  return lead;
}

/**
 * Mongo filter for "needs a follow-up now".
 * Kept here so the list view, the badge count and any future digest all use
 * one definition rather than three drifting copies.
 */
function dueFilter(now = new Date()) {
  return {
    isSpam: { $ne: true },
    doNotContact: { $ne: true },
    nextFollowUpAt: { $ne: null, $lte: now },
  };
}

/** Leads that have never been emailed and are not 'unknown' — the top of the funnel. */
function awaitingFirstMailFilter() {
  return {
    isSpam: { $ne: true },
    doNotContact: { $ne: true },
    mailStatus: 'not_sent',
    status: { $nin: ['converted', 'closed', 'spam'] },
  };
}

module.exports = {
  GAPS_DAYS,
  MAX_MAILS,
  computeNextFollowUpAt,
  isSequenceExhausted,
  nextSequenceStep,
  refreshDerivedFields,
  dueFilter,
  awaitingFirstMailFilter,
  outboundCount,
};
