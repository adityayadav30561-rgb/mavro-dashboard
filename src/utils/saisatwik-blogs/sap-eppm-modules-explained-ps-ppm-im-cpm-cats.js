/**
 * SaiSatwik blog post — SAP EPPM cluster spoke #6 (module breakdown).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx → Knowledge Blogs → K02.
 * Priority 1, informational, global. Complements hub #5302.
 * Written per SAISATWIK_BLOG_PUBLISHING.md — traffic intent template.
 * v2 (2026-07-08): added 4 tables, tightened prose, clean Gutenberg blocks.
 * Pushed as DRAFT — user reviews + publishes.
 */

module.exports = {
  title: 'SAP EPPM Modules Explained: PS, PPM, IM, CPM and CATS',
  slug: 'sap-eppm-modules-explained-ps-ppm-im-cpm-cats',

  excerpt:
    'SAP EPPM is not one product. It is five modules — SAP PS, PPM, IM, CPM and CATS — that cover the full portfolio and project lifecycle. Here is what each does and where it fits.',

  categories: ['SAP'],
  tags: [
    'SAP EPPM',
    'SAP PS',
    'SAP PPM',
    'SAP Investment Management',
    'SAP CPM',
    'SAP CATS',
    'SAP S/4HANA',
    'Enterprise Portfolio Management',
    'For PMOs',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The five SAP EPPM modules are <strong>SAP PS</strong> (Project System) for execution, <strong>SAP PPM</strong> (Portfolio and Project Management) for prioritisation, <strong>SAP IM</strong> (Investment Management) for capital budgeting, <strong>SAP CPM</strong> (Commercial Project Management) for revenue and margin control, and <strong>SAP CATS</strong> (Cross-Application Time Sheet) for time and cost capture. Together they cover the full lifecycle from portfolio scoring to closure inside <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>. SaiSatwik plans <a href="https://saisatwik.com/what-is-sap-eppm-and-why-top-enterprises-are-switching-to-it/">SAP EPPM</a> rollouts around the two or three modules that carry the most business weight for a given client, not all five at once.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">The five SAP EPPM modules at a glance</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Before the module-by-module breakdown, here is the summary table most buyers ask for.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Module</th><th>Full Name</th><th>What It Owns</th><th>Key Transactions</th><th>Typical First Buyer</th></tr></thead><tbody><tr><td><strong>SAP PS</strong></td><td>Project System</td><td>Project execution, WBS, cost planning, actuals, settlement</td><td>CJ20N, CJ40, CJ88, CN25</td><td>PMO, Project Controller</td></tr><tr><td><strong>SAP PPM</strong></td><td>Portfolio and Project Management</td><td>Portfolio scoring, prioritisation, scenario planning</td><td>Fiori portfolio dashboards</td><td>CIO, Head of Strategy</td></tr><tr><td><strong>SAP IM</strong></td><td>Investment Management</td><td>Capital budgeting, appropriation requests, investment programmes</td><td>IM01, IM22, IM32</td><td>CFO, Head of Treasury</td></tr><tr><td><strong>SAP CPM</strong></td><td>Commercial Project Management</td><td>Revenue recognition, margin, billing plans, project profitability</td><td>Project Workspace, Financial Planner</td><td>Finance Controller</td></tr><tr><td><strong>SAP CATS</strong></td><td>Cross-Application Time Sheet</td><td>Time capture against WBS, contractor hours, payroll feed</td><td>CAT2, CAT7, CATS_APPR_LITE</td><td>HR Ops, Site Manager</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Every module below plugs into the same SAP S/4HANA Universal Journal. The value comes from how the five connect, not from any single one on its own.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does SAP EPPM mean for an enterprise buyer?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><a href="https://www.sap.com/products/erp/enterprise-portfolio-project-management.html" target="_blank" rel="noopener">SAP EPPM (Enterprise Portfolio and Project Management)</a> is not a single license or a single transaction. It is a coordinated suite of modules that already sit inside the SAP stack. An enterprise buyer chooses SAP EPPM when spreadsheets and standalone project tools stop keeping up with the number, size or financial weight of the projects the business runs.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The buyer decision is rarely "install all five modules". It is usually "start with the one or two modules that solve the biggest pain, then extend as ROI proves out". SaiSatwik has run this sequencing across capital-heavy sectors including construction, oil and gas, utilities, manufacturing and the public sector.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>According to the <a href="https://www.pmi.org/learning/thought-leadership/pulse" target="_blank" rel="noopener">PMI Pulse of the Profession</a> research, 11.4 percent of every dollar invested in projects is wasted because of poor portfolio governance. The five SAP EPPM modules exist to close that gap on the enterprise side.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do the five SAP EPPM modules actually work?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each module owns a distinct part of the lifecycle. A capital budget approved in SAP IM flows into a project in SAP PS, which schedules resources whose time is captured through SAP CATS, whose revenue and margin are recognised inside SAP CPM, and whose priority against other projects is scored inside SAP PPM.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">SAP PS (Project System)</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS is the execution module. Every live project sits here. Project managers build the Work Breakdown Structure (WBS), define network activities, assign resources, plan costs, track actuals, run availability control and settle costs at closure. Transactions like CJ20N (project builder), CJ40 (cost planning) and CJ88 (settlement) live in SAP PS.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>SAP PS is the module most enterprise buyers already have in some form. It is the entry point for the wider SAP EPPM story because most portfolio and financial signals depend on data that first lands inside a PS project.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">SAP PPM (Portfolio and Project Management)</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PPM sits one level above SAP PS. It answers the strategic question: <em>which projects should we invest in, and in what order?</em> Executives see all active and proposed projects as one portfolio. Each project can be scored on ROI, risk, strategic fit and resource availability.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Portfolio managers move projects between buckets, run scenario models and hand approved projects down to PS for execution. In practice, SAP PPM is where the CFO and the CIO have the conversation the business needs before more money hits the projects.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">SAP IM (Investment Management)</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE/investmentmanagement" target="_blank" rel="noopener">SAP IM</a> is the capital budgeting engine. It handles the appropriation request (AR) workflow, investment programmes, position budgets and multi-year capital allocation. A CAPEX decision that requires board approval flows through SAP IM before it becomes a live project.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Enterprises with multi-year capital programmes (utilities, oil and gas, government infrastructure) typically start their SAP EPPM journey with SAP IM because that is where the pain first shows up. Uncontrolled AR sprawl or annual budget slippage is the classic SAP IM trigger.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">SAP CPM (Commercial Project Management)</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP CPM covers the commercial side. Revenue recognition, project profitability, billing plans, margin analysis and financial forecasting for a portfolio of client-facing projects all sit here. EPC contractors, engineering firms and IT services businesses are common SAP CPM buyers.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>SAP CPM is not a replacement for SAP PS. It sits on top and consolidates the commercial layer across many PS projects. A finance controller running month-end for a book of thirty active projects will spend most of the day inside SAP CPM.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">SAP CATS (Cross-Application Time Sheet)</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP CATS is the time and attendance layer for projects. Employees, contractors and site labour book time against WBS elements and network activities. That data feeds cost postings in SAP PS, margin postings in SAP CPM and payroll postings in SAP HCM at the same time.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>SAP CATS looks trivial until an audit asks how many hours a contractor billed against a specific WBS in a specific week. Without CATS the answer sits in emails and spreadsheets. With CATS the answer sits in one table.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do the SAP EPPM modules fit inside SAP S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>All five modules run natively inside SAP S/4HANA. The move from SAP ECC to S/4HANA has not removed any SAP EPPM module. Some capabilities have been rewritten. The Financials integration for SAP PS now uses the Universal Journal (table ACDOCA) rather than the older CO tables. <a href="https://www.sap.com/products/technology-platform/fiori.html" target="_blank" rel="noopener">SAP Fiori</a> apps expose SAP PPM and SAP IM to executives without opening SAP GUI.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Here is what actually changed for the five modules between SAP ECC and SAP S/4HANA.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Module</th><th>SAP ECC</th><th>SAP S/4HANA</th></tr></thead><tbody><tr><td>SAP PS</td><td>Cost postings in CO tables (COEP, COSP)</td><td>Universal Journal ACDOCA carries every cost line</td></tr><tr><td>SAP PPM</td><td>Portal-based UI, limited mobile access</td><td>Fiori portfolio dashboards on desktop and tablet</td></tr><tr><td>SAP IM</td><td>Appropriation requests through classic GUI</td><td>Fiori AR approval, mobile push notifications</td></tr><tr><td>SAP CPM</td><td>Add-on with separate database schema</td><td>Native in S/4HANA, uses Universal Journal</td></tr><tr><td>SAP CATS</td><td>CAT2 GUI transaction</td><td>Fiori "My Timesheet" app plus CAT2 for power users</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>The <a href="https://www.gartner.com/en/information-technology/insights/erp" target="_blank" rel="noopener">Gartner ERP</a> guidance is consistent on this point: unified portfolio and financial governance sits in the top three ERP priorities for large enterprises, and that unification is exactly what the five SAP EPPM modules deliver on S/4HANA.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP EPPM modules does a buyer typically start with?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>There is no single starting sequence. There is a pattern by pain. The SaiSatwik SAP practice usually maps the buyer's biggest pain to one of these four entry points.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Pain Signal</th><th>Start With</th><th>Add Next</th><th>Typical Sector</th></tr></thead><tbody><tr><td>Cost overruns on live projects</td><td>SAP PS</td><td>SAP CATS</td><td>Construction, EPC, IT Services</td></tr><tr><td>Capital budget sprawl and slippage</td><td>SAP IM</td><td>SAP PS</td><td>Utilities, Oil and Gas, Public Sector</td></tr><tr><td>No visibility across a portfolio of projects</td><td>SAP PPM</td><td>SAP PS + SAP CPM</td><td>Manufacturing, Telecom, Pharma</td></tr><tr><td>Client-facing project margins unclear</td><td>SAP CPM</td><td>SAP PS + SAP CATS</td><td>Engineering Services, EPC Contractors</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Once the first module is stable, the others follow in a natural sequence. Trying to configure all five in a single big-bang programme is the fastest way to blow the budget and the timeline.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does SaiSatwik do differently on SAP EPPM module rollout?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik has a rule for every SAP EPPM engagement: the first two weeks are spent on master-data validation before any configuration work begins. Bad WBS templates, inconsistent cost element groups and unclean investment programme structures are what force rework in months four and five of a rollout.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Client engagements are scoped by module. Here is the typical duration range for a mid-market SAP EPPM client, based on the <a href="https://saisatwik.com/services/sap/eppm/">SaiSatwik SAP EPPM service page</a> delivery model.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Scope</th><th>Duration</th><th>Client Size</th><th>Key Deliverables</th></tr></thead><tbody><tr><td>Single module (SAP PS or SAP IM)</td><td>12 to 16 weeks</td><td>Mid-market, single entity</td><td>Config, master data, cutover, 4 weeks hypercare</td></tr><tr><td>Two modules (SAP PS + SAP CATS)</td><td>16 to 20 weeks</td><td>Mid-market, single or twin entity</td><td>Config, time integration, HCM handshake, hypercare</td></tr><tr><td>Three modules (SAP PS + SAP IM + SAP CATS)</td><td>20 to 26 weeks</td><td>Mid-market to large enterprise</td><td>Config, AR workflow, financial integration, hypercare</td></tr><tr><td>Four to five modules with SAP PPM or SAP CPM</td><td>28 to 40 weeks</td><td>Large enterprise, multi-entity</td><td>Full suite, executive dashboards, phased cutover</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>SaiSatwik keeps the sequencing simple, ships the highest-value module first, and only expands scope once the first module is running clean in production. That is a boring plan, and it is exactly why it works.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Related SaiSatwik Reading on SAP EPPM</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/what-is-sap-eppm-and-why-top-enterprises-are-switching-to-it/">What is SAP EPPM and why top enterprises are switching to it</a> — the definitional pillar for readers new to the suite.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-investment-management-vs-sap-eppm/">SAP Investment Management vs SAP EPPM</a> — a closer look at when SAP IM alone is enough and when the broader SAP EPPM story kicks in.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/enterprise-business-challenges-solved-by-sap-eppm/">8 enterprise business challenges solved by SAP EPPM</a> — module-agnostic view of the operational pain SAP EPPM removes.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/why-enterprises-are-investing-in-sap-eppm-enterprise-portfolio-and-project-management-in-2026/">Why enterprises are investing in SAP EPPM in 2026</a> — the current investment thesis with a Dubai lens.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/why-saudi-enterprises-are-adopting-sap-eppm-for-large-project-portfolios/">Why Saudi enterprises are adopting SAP EPPM for large project portfolios</a> — the Saudi Vision 2030 angle.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP EPPM modules</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Do I need all five SAP EPPM modules?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>No. Most enterprises run two or three of the five in production. The right combination depends on which pain is loudest today. SAP PS plus SAP CATS is a common starting pair. Adding SAP IM makes sense once capital budgeting becomes the bottleneck. SAP PPM and SAP CPM are typically the last modules to land.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is SAP EPPM the same as SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>No. SAP PS is one of the five modules that make up SAP EPPM. Confusing the two is common because SAP PS is the module most enterprises already run. SAP EPPM is the wider suite that surrounds SAP PS with portfolio scoring (PPM), capital budgeting (IM), commercial reporting (CPM) and time capture (CATS).</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Which SAP EPPM module handles capital budgeting?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP IM (Investment Management). It owns appropriation requests, investment programmes, position budgets and multi-year capital allocation. Approved AR data flows from SAP IM into SAP PS when the project starts execution.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How is SAP EPPM different on SAP S/4HANA compared to SAP ECC?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The five modules are still SAP PS, PPM, IM, CPM and CATS. On S/4HANA, the finance integration for SAP PS runs through the Universal Journal (ACDOCA). Fiori apps replace GUI for most executive-facing tasks in SAP PPM and SAP IM. Portfolio dashboards, project status monitors and time sheet apps run in the browser.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How long does a SAP EPPM module rollout typically take?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A single-module rollout for a mid-market client is usually 12 to 16 weeks. A three-module rollout runs 20 to 26 weeks. Multi-country or multi-entity landscapes stretch further. SaiSatwik scopes engagements by module and by legal entity rather than by headcount, which keeps timelines predictable.</p>
<!-- /wp:paragraph -->
`,
};
