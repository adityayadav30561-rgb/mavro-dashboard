# Lead Tracking Automation — Design Plan

> ## Status as of 11 Aug 2026
>
> **Phase 1 is BUILT AND LIVE.** Manual lead entry, temperature, lead type,
> pipeline + SLA fields, the append-only email and contact logs, the 3/6/10
> follow-up engine, and the "Needs attention" panel all shipped. The historical
> CRM (103 rows) and 9 LinkedIn leads are imported.
>
> **Phase 2 (CEO's Google Sheet) — NOT STARTED, blocked on you.** Needs a Google
> Sheet URL shared with `mavro-dashboard@spanbix-analytics.iam.gserviceaccount.com`
> as Editor, and a decision on whether it carries SaiSatwik, Spanbix, or both on
> separate tabs.
>
> **Phase 3 (email logging) — NOT STARTED, blocked on you.** History needs an
> Outlook CSV export (§5a, no permissions required). Ongoing auto-logging needs
> a delegated Graph app registration you can do yourself in ~20 minutes (§5b).
>
> **Changed since this plan was written:** the pipelines are now split across
> two pages. `/leads` is Spanbix only; `/saisatwik-leads` is the services CRM
> and is where the follow-up engine lives. See CLAUDE.md §Phase 12.

**Status:** Phase 1 delivered; Phases 2–3 awaiting inputs.
**Goal:** retire the hand-maintained Excel. One system of record for every lead,
email activity logged without typing, a CEO-facing sheet that updates itself,
and follow-up reminders so nothing goes cold unnoticed.

**Decisions already made** (2026-08-11): auto-updated Google Sheet for the CEO ·
in-app reminders only · this document before any code.

**Revised 2026-08-11 after clarification:** email logging moves from BCC-only to
a Microsoft Graph read of the operator's Sent Items (see §5) — BCC cannot
recover the historical email history that is required, and Graph delivers both
history and ongoing logging without depending on remembering to BCC.

> **The system does this work, not the assistant.** Everything here runs
> server-side on a schedule. A one-time historical import can be done by hand
> from an export or screenshots; nothing ongoing depends on a chat session.

---

## 1. What this replaces

Today three things happen by hand:

1. A row is typed into Excel for every lead — name, email, type, hot/cold,
   mail-sent, message. Some come from the website, some from LinkedIn.
2. "Did I email them?" is remembered and typed in after the fact.
3. The workbook is re-shared with the CEO so he sees current numbers.

All three become automatic or near-automatic.

---

## 2. What already exists (the head start)

| Capability | State |
|---|---|
| Lead records (name, email, phone, company, message, customFields) | Live |
| Status pipeline (new → contacted → qualified → converted → closed) | Live |
| `priority` (low/medium/high/urgent) | Live |
| `channel` — Google Ads / Facebook Ads / organic / direct, auto-derived | Live |
| Append-only contact log (who called, what was said, when) | Live |
| `submittedAt` — exact submission time | Live |
| Four lead-capture staff accounts, restricted to Lead Capture | Live |
| Excel generation (`exceljs`, used by the MBR export) | Live |
| Recurring in-process jobs (`scheduledPublishService` timer pattern) | Live |
| `nodemailer`, `googleapis` | Installed, unwired for this |

**Genuinely missing:** manual/LinkedIn lead entry · hot-warm-cold · email
activity log · Google Sheet sync · follow-up surfacing.

---

## 3. Data model changes

All additive to the existing `Lead` schema. Nothing existing is removed.

```js
// ---- Qualification ----
temperature:     'hot' | 'warm' | 'cold'   // indexed; set by the agent
leadType:        String                     // individual / campus / corporate
jobTitle:        String
city:            String
leadScore:       Number                     // 0-100, computed (see below)

// ---- Pipeline ----
estimatedValue:  Number                     // INR; enables pipeline forecasting
expectedCloseAt: Date
lostReason:      String                     // enum, set when status -> closed
lostAt:          Date

// ---- Activity / SLA ----
lastContactedAt:  Date                      // indexed; derived from the logs
firstRespondedAt: Date                      // auto-set on the FIRST contact/email
nextFollowUpAt:   Date                      // indexed; explicit reminder date
touchCount:       Number                    // derived: contactLog + emailLog length

// ---- Compliance ----
doNotContact:    Boolean                    // hard block, surfaced in the UI

emailLog: [{                                // append-only, mirrors contactLog
  direction:   'outbound' | 'inbound',
  subject:     String,
  snippet:     String,                      // ~300 chars, never the full body
  sentAt:      Date,
  messageId:   String,                      // dedup key (RFC Message-ID)
  loggedVia:   'graph' | 'bcc' | 'manual' | 'import',
}]
```

`channel` enum gains: `linkedin`, `manual`, `referral`, `walk_in`.

`lostReason` enum (starting set, editable): `price`, `timing`, `chose_competitor`,
`not_qualified`, `no_response`, `duplicate`, `other`. **This is the field most
teams omit and later wish they had** — it is the only way to learn why deals
die rather than guessing.

`firstRespondedAt` gives time-to-first-response, the metric most strongly
correlated with conversion in lead research. Computed, never typed.

`leadScore` is derived, not entered: channel weight (paid ad click > organic >
direct), data completeness (phone + company + job title), and engagement
(touch count, email replies). Recomputed on write. It is a sorting aid, not a
decision-maker — an agent can always override with `temperature`.

**Deliberately NOT added:** campaign hierarchies, custom objects,
multi-currency, territory rules. Standard CRM furniture that would slow every
screen down for a team of four.

**"Mail sent or not" is not stored.** It is `emailLog.length > 0` — a derived
fact that cannot drift out of sync with reality. Same reasoning as the contact
log: record events, derive state.

**Why `temperature` rather than reusing `priority`:** they answer different
questions. Priority is *how urgently we should act*; temperature is *how likely
they are to close*. A cold lead can be high priority (big campus account worth
chasing) and a hot lead low priority (already handled). Collapsing them loses
information.

---

## 4. Part A — One system of record

**Manual lead entry.** New `POST /api/leads` (admin-authenticated, distinct
from the public `POST /api/leads/submit`) plus an "Add Lead" button in Lead
Capture. Captures the same fields a form would, with `channel` set to
`linkedin` / `manual` / `referral` / `walk_in`.

This is what absorbs the LinkedIn leads. Once it exists, every lead — paid,
organic, LinkedIn, walk-in — lives in one queryable place.

**Pipeline fields** in the lead modal: temperature chips (hot/warm/cold), lead
type dropdown, next-follow-up date picker. Sits alongside the contact log
that already exists.

**Effort:** ~1 session. No external dependencies. **This alone retires the
Excel as your working copy.**

---

## 5. Part B — Email logging (self-service only)

**Constraint (2026-08-11): no third party involved.** Everything below is done
by the account owner alone, in portals they already control. Nothing requires
an IT department, an external consultant, or another person's approval.

### 5a. Historical email — Outlook CSV export (zero setup, works today)

Outlook can export Sent Items without any API, portal or permission:

> File → Open & Export → Import/Export → Export to a file → Comma Separated
> Values → **Sent Items** → save as `sent.csv`

The export contains recipient, subject and date — everything the email log
needs. Then:

```
npm run import:lead-emails -- sent.csv          # dry run, shows matches
npm run import:lead-emails -- sent.csv --apply  # write
```

The importer matches each row's recipient against lead email addresses, skips
non-matches, and dedups on subject + timestamp so re-running is harmless.
Entries land with `loggedVia: 'import'`.

**This is the recommended path for history.** It needs no Azure, no consent,
no waiting. One export, one command.

### 5b. Ongoing email — delegated Graph OAuth (self-service, ~20 min)

For new mail to log itself, the app registration goes in the operator's **own**
Azure portal, using **delegated** permissions rather than application ones:

1. portal.azure.com → App registrations → New registration (single tenant)
2. API permissions → Microsoft Graph → **Delegated** → `Mail.Read` +
   `offline_access`
3. Certificates & secrets → new client secret
4. Sign in once through the app's consent screen with
   `aditya.y@saisatwik.com`; the refresh token is stored encrypted

**Why delegated rather than application permissions:** a delegated token can
only ever reach the mailbox of the person who signed in. It is scoped to one
inbox *by construction*, so the Application Access Policy — the step that
previously needed a tenant admin — disappears entirely. The earlier design's
one dependency on another person is removed by this change, not worked around.

If the tenant blocks user consent for this scope, the same portal has a
"Grant admin consent" button, available to whoever owns the tenant. Still one
person, still self-service.

### 5c. If Azure is unwanted entirely — auto-forward + Cloudflare

A fully code-side alternative that never touches Azure:

1. An Outlook rule auto-BCCs every sent message to `log@spanbix.com`
2. **Cloudflare Email Routing** (free; spanbix.com DNS is already on
   Cloudflare) receives it and triggers an Email Worker
3. The Worker POSTs the message to a signed endpoint on the backend

Fully automated and self-service, but it is more moving parts than 5b and
still cannot recover history — 5a remains the answer for that.

### What gets stored (all paths)

Subject, timestamp, direction, dedup key, and a short snippet. Never full
bodies, never attachments. A record is written only when a recipient matches
an existing lead; everything else is discarded.

### Implementation sketch

- `src/utils/importLeadEmails.js` — CSV importer, dry-run by default (5a)
- `src/services/msGraphAuth.js` — refresh-token flow, mirroring the existing
  zero-dependency `googleAuth.js` pattern (5b)
- `src/services/leadMailService.js` — poll, match, append; idempotent on
  `internetMessageId`
- Started from `server.js` on the existing `setInterval` pattern
  (`scheduledPublishService` is the precedent — no Redis, no queue)
- Env: `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_REFRESH_TOKEN`,
  `LEAD_MAILBOX`; silent no-op when unset

**Effort:** 5a ~half a session · 5b ~1 session of code plus ~20 minutes of
portal clicking.

## 6. Part C — Google Sheet that updates itself

### How it works

A Google Sheet is shared with the **service account you already have**
(`mavro-dashboard@spanbix-analytics.iam.gserviceaccount.com`, currently used
for GA4 and Search Console). A job rewrites the `Leads` tab on a schedule. The
CEO keeps his existing link and workflow; the numbers are simply always
current.

`googleapis` is already a dependency. The only new setup is enabling the
Sheets API in that GCP project and sharing the sheet with the service account
as Editor.

### Sync strategy: full rewrite, not incremental

Every run clears the `Leads` tab and writes all rows fresh. Incremental
diffing is faster but drifts — a deleted lead or an edited field eventually
desynchronises, and the failure is silent. A full rewrite of a few hundred
rows costs one API call and is correct by construction.

**Consequence the CEO must know:** anything he types into the `Leads` tab is
overwritten on the next sync. If he wants to annotate, he gets a separate tab
that the sync never touches.

### Columns

Mirrors the working view: name · email · phone · type · source/channel ·
temperature · status · owner · last contacted · emails sent · next follow-up ·
message · created. **Final column list needs your current Excel header row**
(see §9).

**Effort:** ~1 session. No blockers beyond sheet access.

---

## 7. Part D — Reminders (in-app)

**This needs no scheduler at all.** A follow-up is not an event to be fired —
it is a *query*: "leads whose `nextFollowUpAt` has passed, or whose
`lastContactedAt` is older than the threshold for their temperature."

So it is computed on read: `GET /api/leads/follow-ups`, surfaced as a **Needs
follow-up** panel at the top of Lead Capture with a count badge.

Proposed default thresholds (all configurable):

| Temperature | Nudge after no contact for |
|---|---|
| Hot | 2 days |
| Warm | 7 days |
| Cold | 30 days |

Plus anything with an explicit `nextFollowUpAt` in the past.

This deliberately avoids reviving the notification stack that was built and
removed in Phase 7. If you later want a daily email digest, `nodemailer` is
already installed and it is a small addition — but in-app costs nothing to run
and cannot spam anyone.

**Effort:** ~half a session.

---

## 8. Phasing

| Phase | Delivers | Blocked on | Effort |
|---|---|---|---|
| **1** | Manual entry, temperature, lead type, follow-up panel, email-log UI + manual logging | Nothing | ~1 session |
| **2** | Google Sheet auto-sync | Sheet shared with service account | ~1 session |
| **3a** | Historical email import from an Outlook CSV export | Nothing — self-service export | ~½ session |
| **3b** | Ongoing auto-logging via delegated Graph | ~20 min in your own Azure portal | ~1 session |

Phase 1 is what actually retires your Excel. Phase 2 retires the *re-sharing*.
Phase 3 retires the remembering.

Each ships independently and is useful on its own.

---

## 9. What I need from you

**Blocking Phase 1:**

1. **Your current Excel header row, verbatim.** I want the new fields to match
   what you already track, not what I guessed. Paste the columns.
2. **Lead type values** — what goes in that column today? (individual learner /
   college / corporate / something else)
3. **Do the four agents see all leads, or only their own?** Right now they see
   everything.

**Blocking Phase 2:**

4. Is the CEO's sheet an existing Google Sheet, or is it an Excel file that
   would need converting? If it exists, send the URL.
5. Confirm you can share it with
   `mavro-dashboard@spanbix-analytics.iam.gserviceaccount.com` as Editor.

**Blocking Phase 3:**

6. Export Sent Items from Outlook to CSV (steps in §5a) and send me the file —
   that unblocks the entire email history with no portal work at all.
7. For ongoing logging: are you able to sign in at portal.azure.com with an
   account that owns the tenant? If yes, §5b is ~20 minutes of your own
   clicking and no one else is involved.

**Optional:**

8. Reminder thresholds — are 2 / 7 / 30 days right for hot / warm / cold?

---

## 10. Risks and limitations, stated plainly

- **Delegated Graph reads one real mailbox** — the signer's own, and no other.
  Filtered to lead-matched mail, but it is genuine mailbox access and should be
  treated as such.
- **The CSV path is a snapshot.** It captures history at export time; it does
  not keep itself current. That is what 5b is for.
- **Email matching is by address.** Mail to an address the lead never submitted
  will not attach automatically.
- **The Google Sheet is one-way.** Edits made in the sheet are overwritten.
  The dashboard is the source of truth; the sheet is a view of it.
- **Graph application permissions are tenant-wide unless restricted.** The
  Application Access Policy is mandatory, not a nice-to-have.
- **Render's instance sleeps on the free tier.** The mail poll and sheet sync
  only run while the service is awake. The existing cron-job.org keep-warm
  already addresses this; worth confirming it covers the needed window.
- **Lead email matching is by address.** If someone emails from a different
  address than they submitted, it will not match automatically.
