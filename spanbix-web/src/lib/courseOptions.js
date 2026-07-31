// ════════════════════════════════════════════════════════════════════════════
// Course choices offered on the public lead forms — single source of truth.
// ────────────────────────────────────────────────────────────────────────────
// Four forms ask "which course?" (/contact, /enquire, /campus-visit and the
// /sap-course ads landing page) and the answer lands in `customFields.interest`
// on the Lead. Keeping the lists here stops the forms drifting apart, which
// would fragment the interest values the sales team filters on.
//
// The field is REQUIRED on every form. `NOT_DECIDED` exists so someone who is
// genuinely still deciding has an honest answer — it is a real choice, not a
// way to skip the question. Nothing is preselected, so the visitor must pick.
//
// Adding a course to the catalog (SPANBIX_CAREER_PATHS in spanbixSeo.js) means
// adding it here too, or enquiries for it get filed as "Not decided yet".
// ════════════════════════════════════════════════════════════════════════════

export const NOT_DECIDED = 'Not decided yet';

/** The four SAP tracks, in catalog order. */
export const SAP_TRACKS = ['SAP FICO', 'SAP MM', 'SAP SD', 'SAP ABAP'];

/**
 * General-purpose forms (/contact, /enquire, /campus-visit) offer the whole
 * catalog: the SAP tracks plus AI Mastery, which is a live non-SAP program.
 */
export const COURSE_CHOICES = [...SAP_TRACKS, 'AI Mastery', NOT_DECIDED];

/**
 * The /sap-course ads landing page stays SAP-only — the ad promises SAP
 * training, so offering AI Mastery there would mismatch the campaign.
 */
export const SAP_COURSE_CHOICES = [...SAP_TRACKS, NOT_DECIDED];

/** Shared copy for the blocked-submit message, so all four forms read alike. */
export const COURSE_REQUIRED_MESSAGE =
  `Please choose a course. Pick "${NOT_DECIDED}" if you are still deciding.`;
