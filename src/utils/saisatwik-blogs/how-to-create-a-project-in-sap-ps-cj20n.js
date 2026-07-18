/**
 * SaiSatwik blog post - SAP PS cluster spoke (CJ20N how-to).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K11.
 * Primary keyword: CJ20N SAP PS. Secondary: project builder SAP, CJ20N
 * tutorial. Intent: informational (traffic engine), Priority 1, geo-neutral.
 * Anchors UP to the SAP PS hub (#5418), the K09 tutorial (#5423) and the
 * K10 WBS guide (#5425). House style: plain, direct, no em dashes, no
 * filler, no invented error codes or transactions. Human cadence: varied
 * sentence lengths, concrete practitioner detail.
 */

module.exports = {
  title: 'How to Create a Project in SAP PS Using CJ20N (Project Builder)',
  slug: 'how-to-create-a-project-in-sap-ps-cj20n',

  excerpt:
    'A practical CJ20N tutorial: create a project in SAP PS with the Project Builder, from project definition and WBS to networks, scheduling and release. Includes the errors beginners hit and how to fix them.',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP EPPM',
    'SAP S/4HANA',
    'Tutorial',
    'For PMOs',
    'Checklist',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>To create a project in SAP PS, open transaction CJ20N (the Project Builder), create a project definition with a project profile and an identifier that fits your coding mask, add WBS elements underneath it, attach networks and activities if the project needs scheduling, then set the status to released so postings can begin. The whole build happens in one split-screen transaction: structure tree on the left, detail screens on the right. This guide walks through each step in CJ20N, then covers the errors that stop beginners and the shortcuts practitioners actually use.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is CJ20N in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ20N is the Project Builder, the central working transaction of SAP Project System. Before it existed, building a project meant hopping between separate transactions for the project definition, the WBS and the networks. CJ20N put all of it on one screen. The left pane shows the project tree and a worklist of recently used objects; the right pane shows the detail of whatever you clicked. Almost everything a project administrator does day to day happens here.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The older single-purpose transactions (CJ01, CJ02 and CJ03 for structures, CN21 and CN22 for networks) still exist and still work. Some long-time users prefer them for mass changes. But if you are learning SAP PS today, learn CJ20N first; the <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">SAP PS beginner guide</a> explains the objects you will be building with it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What do you need before opening CJ20N?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Three things, and missing any of them will stop you within minutes:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>A project profile.</strong> Configuration chooses it, not you. It sets the defaults for everything the project inherits: planning profile, budget profile, settlement profile, statuses. Ask your SAP team which profile fits your project type.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>A valid project number.</strong> If a coding mask is configured (it usually is), your identifier has to match the pattern, something like P-1000 or C-2026-001. The system rejects anything that breaks the mask.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Organisational data.</strong> Company code, controlling area, and usually a plant and profit center. Have them ready; the project definition asks for them immediately.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 1: How do you create the project definition in CJ20N?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Open CJ20N and choose Create, then Project. Enter the project number and description, pick the project profile, and fill in the start and finish dates plus the organisational assignments. Save nothing yet. The project definition is only the header; a project with no WBS elements underneath it cannot carry a single cost.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>One habit worth forming on day one: write descriptions that make sense outside your own head. Three years from now, someone in finance will read "P-1000 Riyadh substation extension" in a report and know what it was. "P-1000 Project" tells them nothing.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 2: How do you add WBS elements?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>With the project definition selected in the tree, add WBS elements below it. Type the identifier and description for each, or open the WBS overview to enter several at once, level by level. Indent to create children; the tree on the left redraws as you go.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For each element, set the operative indicators: planning element where costs get planned, account assignment element where actuals will post, billing element where revenue lands on customer projects. Skip this and the structure looks fine but behaves wrong; a purchase order pointed at an element without the account assignment flag simply refuses to post. Structure and indicator design have their own guide: <a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS Work Breakdown Structure explained</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 3: How do you add networks, activities and milestones?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Cost-only projects can stop after step 2. If the project needs dates, dependencies or resource planning, create a network under the project and add activities to it: internal activities for your own work centers, external activities for subcontracted work, general cost activities for everything else. Chain them with relationships, mostly finish-start, and assign each activity to the WBS element that should carry its cost.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Milestones attach to activities. Use them for the events someone will actually ask about later: phase gates, customer billing triggers, handovers. A project with forty milestones has none that matter.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 4: How do you schedule and check the project?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Run scheduling from within CJ20N and the system calculates dates for every activity from the durations and relationships you entered. Check the result in the Project Builder itself or step out to CN41N, the structure overview, for the whole tree with dates and statuses in one list.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Look for two things before going further: activities with no WBS assignment (their costs will have nowhere sensible to go) and dates that fall outside the project definition's basic dates. Both take seconds to fix now and hours to untangle after postings start.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 5: How do you release the project?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A freshly created project sits in CRTD (created) status, and CRTD rejects actual postings by design. When the structure is ready, set the project definition or individual WBS elements to REL (released) from the Edit menu, then save. Release cascades down the tree, so releasing the top releases everything under it unless you deliberately hold parts back.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Plenty of businesses insert a budgeting step before release: plan costs with CJ40, enter the budget with CJ30, release budget with CJ32, and only then release the project. The full sequence, with the budget transactions in context, is in the <a href="https://saisatwik.com/sap-ps-tutorial-for-beginners/">SAP PS tutorial for beginners</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What are the most common CJ20N errors and how do you fix them?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Every SAP PS beginner hits the same handful of walls in the first week. Here they are, with the fix for each.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Problem</th><th>Why It Happens</th><th>Fix</th></tr></thead><tbody><tr><td><strong>Project number rejected on creation</strong></td><td>The identifier does not match the configured coding mask</td><td>Check the mask pattern with your SAP team and follow it exactly, separators included</td></tr><tr><td><strong>Cost posting fails after the project is built</strong></td><td>The project or WBS element is still in CRTD status</td><td>Release the element (REL status) in CJ20N, then repost</td></tr><tr><td><strong>Purchase order will not accept the WBS element</strong></td><td>The element is not flagged as an account assignment element</td><td>Set the account assignment indicator on the element and save</td></tr><tr><td><strong>Budget-related block when posting</strong></td><td>Availability control is active and the posting exceeds released budget</td><td>Check budget versus assigned funds, then top up via CJ30/CJ32 or get the budget increased through your approval process</td></tr><tr><td><strong>Cannot delete a WBS element</strong></td><td>Actual costs or commitments already sit on it</td><td>Elements with postings cannot be deleted; close or lock the element and settle its costs instead</td></tr><tr><td><strong>Fields greyed out, changes impossible</strong></td><td>The object is locked by another user or a status forbids the change</td><td>Check who holds the lock, and review the system status; some fields freeze permanently after release</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which CJ20N shortcuts do practitioners actually use?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Three habits separate people who fight the Project Builder from people who fly through it.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Copy from templates, never from scratch.</strong> Creating a project with reference to a standard WBS or an existing project brings the whole structure, indicators and all, in one step. Businesses that run clean SAP PS portfolios create almost everything from templates.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Use the worklist.</strong> The left pane remembers the objects you touched recently. For an administrator working five projects, the worklist is faster than any search.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Learn the derive-and-inherit behaviour.</strong> Dates, organisational data and profiles flow from the project definition downward. Set them right at the top and you barely touch them again; set them wrong and you correct every element by hand.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>In <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>, CJ20N works unchanged, and SAP Fiori adds apps like Project Builder and Project Control alongside it. The classic transaction remains the deepest tool for structure work, which is why implementation teams still teach it first. Official documentation for Project System lives on the <a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE" target="_blank" rel="noopener">SAP Help Portal</a>, and <a href="https://learning.sap.com/" target="_blank" rel="noopener">SAP Learning</a> carries the formal training paths.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik help teams work in CJ20N?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik builds the groundwork that makes CJ20N pleasant instead of painful: coding masks that read naturally, project profiles matched to real project types, and standard WBS templates so administrators copy rather than construct. Key-user training happens on the client's own structures during the implementation, not on generic demo data.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That setup work is part of every SAP PS engagement the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a> runs, whether greenfield or an ECC-to-S/4HANA conversion.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Related SaiSatwik Reading</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The rest of the SAP PS series:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">What is SAP PS (Project System)? A beginner guide</a>. The objects CJ20N builds, explained from zero.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-tutorial-for-beginners/">SAP PS tutorial for beginners</a>. The full lifecycle around this transaction: plan, budget, execute, settle.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS Work Breakdown Structure (WBS) explained</a>. How to design the structure before you build it here.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-best-practices-for-capital-projects/">SAP EPPM best practices for capital projects</a>. The governance around templates, budgets and release.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about CJ20N</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between CJ20N and CJ01 or CJ02?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ01, CJ02 and CJ03 are the older create, change and display transactions for work breakdown structures only. CJ20N replaced them for daily work by combining the project definition, WBS, networks, activities and milestones in one split-screen transaction. The old codes still function and some users keep them for focused mass changes, but CJ20N is the standard.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can CJ20N create networks and activities, or only the WBS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ20N handles the complete structure: project definition, WBS elements, networks, activities, activity elements and milestones. Networks can also be maintained in the dedicated transactions CN21 and CN22, but most users never need to leave the Project Builder.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Why can I not post costs to my new project?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Almost always status. New projects sit in CRTD (created) status, which blocks actual postings until you release the project or WBS element to REL status in CJ20N. If release does not fix it, check that the target WBS element has the account assignment indicator set.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Does CJ20N still exist in SAP S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. CJ20N runs unchanged in SAP S/4HANA, alongside newer SAP Fiori apps for project management. Structure-heavy work still tends to happen in CJ20N because it exposes every field and object in one place.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can I create a project by copying an existing one?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes, and you should. When creating in CJ20N, create with reference to a standard project (template) or an operative project, and the system copies the structure, indicators and settings. Copying from well-built templates is how businesses keep hundreds of projects structurally consistent.</p>
<!-- /wp:paragraph -->
`,
};
