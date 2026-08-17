/**
 * Grade an ads lead from the qualifying answers it submitted.
 *
 * WHY: the Google Ads campaign produces volume but mixed quality — job
 * seekers, casual browsers, and people who did not realise the training is
 * paid. The landing form now asks intent, timeline and profile
 * (spanbix-web/src/lib/leadQualifiers.js). Collecting those answers is only
 * half the job: without a grade the counselling team still has to read every
 * lead to decide who to call first.
 *
 * Maps onto the existing `Lead.temperature` field, so it shows up in the Temp
 * column and filters in Lead Capture with no new UI.
 *
 * The option strings are matched EXACTLY as the form sends them. If the form's
 * wording changes, update it here in the same commit — a silent mismatch would
 * grade every future lead 'warm' and nobody would notice, because 'warm' is
 * also the legitimate middle case.
 *
 * Deliberately conservative: only an explicit "looking for a job" or "just
 * exploring" earns 'cold', and only a stated intent to enrol plus a near-term
 * start earns 'hot'. Everything else stays 'warm' rather than being guessed
 * into a bucket a human then has to un-learn.
 */

const HOT_TIMELINES = ['Immediately', 'Within 7 days'];

/**
 * @param {object} customFields The lead's submitted customFields.
 * @returns {'hot'|'warm'|'cold'|undefined} undefined when the lead carries no
 *          qualifying answers at all (organic forms, imports, older leads) —
 *          those must not be silently graded on missing data.
 */
function gradeLeadTemperature(customFields = {}) {
  const intent = typeof customFields.intent === 'string' ? customFields.intent.trim() : '';
  const timeline = typeof customFields.timeline === 'string' ? customFields.timeline.trim() : '';

  // No qualifiers answered → not an ads-form lead. Leave temperature unset so
  // a human can still set it, rather than inventing one.
  if (!intent && !timeline) return undefined;

  // Explicit disqualifiers first: someone who says they want a job, or that
  // they are only browsing, is not an admission lead today.
  if (intent === 'I am only looking for a job') return 'cold';
  if (timeline === 'Just exploring') return 'cold';

  // Stated intent to enrol + a near-term start.
  if (intent === 'Yes, I want course details' && HOT_TIMELINES.includes(timeline)) return 'hot';

  return 'warm';
}

module.exports = { gradeLeadTemperature, HOT_TIMELINES };
