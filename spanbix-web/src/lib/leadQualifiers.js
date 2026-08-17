// ════════════════════════════════════════════════════════════════════════════
// Qualifying questions on the Google Ads landing form (/sap-course).
// ────────────────────────────────────────────────────────────────────────────
// WHY: the campaign generates volume but mixed quality — job seekers, casual
// browsers, and people who did not realise the training is paid. Asking intent
// up front lets the counselling team call the serious enquiries first instead
// of discovering the mismatch on the phone.
//
// Answers land in `customFields` on the Lead, which the admin Lead Capture
// modal renders automatically — no dashboard change is needed to see them.
//
// The wording is the business's own. Keep the option strings STABLE: they are
// stored verbatim on every lead and are what the backend reads to grade the
// lead, so renaming one silently changes the grade of every future lead and
// breaks comparison with the ones already collected.
//
// Deliberately NOT added to /contact or /enquire. Those are organic pages with
// longer forms already, and the quality problem is specific to paid traffic.
// ════════════════════════════════════════════════════════════════════════════

export const QUALIFIERS = [
  {
    key: 'intent',
    label: 'ARE YOU INTERESTED IN PAID SAP TRAINING? *',
    short: 'intent',
    options: [
      'Yes, I want course details',
      'I am exploring options',
      'I am only looking for a job',
    ],
  },
  {
    key: 'timeline',
    label: 'WHEN ARE YOU PLANNING TO JOIN? *',
    short: 'timeline',
    options: ['Immediately', 'Within 7 days', 'Within 30 days', 'Just exploring'],
  },
  {
    key: 'profile',
    label: 'YOUR CURRENT PROFILE *',
    short: 'profile',
    options: ['Student', 'Graduate', 'Working professional', 'Job seeker', 'Other'],
  },
];

/** Message shown when a qualifier is the thing blocking submission. */
export const QUALIFIER_REQUIRED_MESSAGE = 'Please answer all the questions so a counsellor can help you properly.';
