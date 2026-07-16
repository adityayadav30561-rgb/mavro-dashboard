/**
 * SaiSatwik blog post - SAP EPPM cluster spoke #9 (architecture + integration).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K05.
 * Primary keyword: SAP EPPM architecture. Secondary: EPPM integration, EPPM
 * landscape. Intent: informational (traffic engine), Priority 2, geo-neutral.
 * House style: plain, direct, no em dashes, no filler words. Traffic-intent
 * template from SAISATWIK_BLOG_PUBLISHING.md.
 */

module.exports = {
  title: 'SAP EPPM Architecture and Integration: How It All Connects',
  slug: 'sap-eppm-architecture-and-integration-overview',

  excerpt:
    'How SAP EPPM is architected: the five modules, the SAP S/4HANA core they sit on, and every integration point (FICO, HCM, MM/SD, SAC, Fiori, BTP) that makes the data flow.',

  categories: ['SAP'],
  tags: [
    'SAP EPPM',
    'SAP S/4HANA',
    'Enterprise Portfolio Management',
    'SAP PS',
    'For CTOs',
    'For PMOs',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP EPPM architecture is a layered model: five modules (SAP PS, PPM, IM, CPM, CATS) sit on top of the <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> core, share one financial data store (the Universal Journal, table ACDOCA), and connect outward to SAP FICO, HCM, MM and SD through native integration rather than interfaces. The front end runs on <a href="https://www.sap.com/products/technology-platform/fiori.html" target="_blank" rel="noopener">SAP Fiori</a>, analytics run embedded on live data, and custom extensions live on SAP BTP outside the core. Because everything shares the same database, project data, financial data and resource data stay consistent without reconciliation. SaiSatwik designs every <a href="https://saisatwik.com/what-is-sap-eppm-and-why-top-enterprises-are-switching-to-it/">SAP EPPM</a> landscape around these integration points, since a clean architecture is what keeps a rollout maintainable years later.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is the SAP EPPM architecture?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The SAP EPPM architecture is best read as four layers stacked on one database. Each layer has a job, and the value comes from how tightly they connect rather than from any single layer working alone.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Layer</th><th>What Lives Here</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>Presentation</strong></td><td>SAP Fiori apps, dashboards, SAP GUI for power users</td><td>How executives, PMOs and project teams interact with the system</td></tr><tr><td><strong>Application</strong></td><td>SAP PS, PPM, IM, CPM, CATS modules</td><td>The portfolio, project, budgeting, commercial and time-capture logic</td></tr><tr><td><strong>Data</strong></td><td>Universal Journal (ACDOCA), master data, CDS views</td><td>One shared store so project and finance read the same numbers</td></tr><tr><td><strong>Platform</strong></td><td>SAP S/4HANA on SAP HANA in-memory database</td><td>The engine that runs the modules and serves real-time analytics</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Custom development sits alongside this stack on <a href="https://www.sap.com/products/technology-platform.html" target="_blank" rel="noopener">SAP BTP</a>, deliberately outside the core so upgrades stay clean. That side-by-side extension model is a defining feature of the modern SAP EPPM landscape.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do the five SAP EPPM modules fit together?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Inside the application layer, the five modules pass data to each other in a defined flow. A budget approved in SAP IM funds a project executed in SAP PS, whose time is captured in SAP CATS, whose margin is reported in SAP CPM, all scored against other projects in SAP PPM. For the module-by-module detail, the <a href="https://saisatwik.com/sap-eppm-modules-explained-ps-ppm-im-cpm-cats/">SAP EPPM modules guide</a> breaks each one down.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Module</th><th>Feeds Into</th><th>Reads From</th></tr></thead><tbody><tr><td>SAP IM (Investment Management)</td><td>SAP PS (approved budgets become project budgets)</td><td>Board-approved capital plans</td></tr><tr><td>SAP PS (Project System)</td><td>SAP CPM, SAP CATS, the Universal Journal</td><td>SAP IM budgets, MM procurement, HCM resources</td></tr><tr><td>SAP CATS (Time Sheet)</td><td>SAP PS costs, SAP CPM margin, HCM payroll</td><td>Employee and contractor time entries</td></tr><tr><td>SAP CPM (Commercial PM)</td><td>Portfolio profitability reporting</td><td>SAP PS actuals, billing plans</td></tr><tr><td>SAP PPM (Portfolio &amp; PM)</td><td>Executive portfolio decisions</td><td>Live SAP PS project data</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Because these hand-offs happen inside one system, there is no nightly batch job moving data between modules. A cost posted in SAP PS this morning is visible in SAP CPM margin analysis this afternoon.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SAP EPPM integrate with SAP FICO?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The SAP EPPM to SAP FICO integration is the most important connection in the whole landscape. In SAP S/4HANA, project costs post directly to the Universal Journal, which is the same table SAP Finance and Controlling use. There is no separate project ledger to reconcile.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In practice this means a WBS element carries its account, cost centre, profit centre and project attributes on the same line item. When a controller runs the P&amp;L and a PMO runs a project cost report, both queries hit ACDOCA. This single-source design is why SAP EPPM on S/4HANA removes the reconciliation work that the older SAP ECC architecture required.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What are the other SAP EPPM integration points?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Beyond finance, SAP EPPM connects to the rest of the SAP landscape through native integration. These are the connections that matter on most implementations.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Integration</th><th>What Flows</th><th>Why It Matters</th></tr></thead><tbody><tr><td>SAP HCM / SuccessFactors</td><td>Resources, capacity, time via CATS</td><td>Project staffing reads real workforce availability</td></tr><tr><td>SAP MM (Materials Management)</td><td>Purchase orders, goods receipts to WBS</td><td>Procurement costs land on the right project automatically</td></tr><tr><td>SAP SD (Sales &amp; Distribution)</td><td>Billing, revenue to project accounting</td><td>Client-facing project revenue is tracked end to end</td></tr><tr><td>SAP Analytics Cloud</td><td>Live project KPIs via CDS views</td><td>Executive dashboards without a data warehouse round trip</td></tr><tr><td>SAP Fiori</td><td>Browser-based apps for every role</td><td>Adoption widens beyond SAP GUI specialists</td></tr><tr><td>SAP BTP</td><td>Custom apps, workflows, AI extensions</td><td>Extensions live outside the core so upgrades stay clean</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>The pattern across all six is the same: native integration inside the SAP stack, not point-to-point interfaces that break on upgrade. That is the architectural advantage of running EPPM inside SAP rather than bolting a standalone project tool onto an SAP finance system.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What are the SAP EPPM deployment options?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The same module architecture runs across three deployment models. The choice affects how much of the EPPM footprint is available and who manages the infrastructure.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Deployment</th><th>EPPM Footprint</th><th>Best For</th></tr></thead><tbody><tr><td>S/4HANA on-premise</td><td>Full EPPM suite, deepest customisation</td><td>Capital-heavy enterprises with complex requirements</td></tr><tr><td>S/4HANA Cloud, private edition</td><td>Near-full EPPM, managed infrastructure</td><td>Enterprises wanting cloud economics without losing depth</td></tr><tr><td>S/4HANA Cloud, public edition</td><td>Core project financials, leaner feature set</td><td>Standardised, lower-complexity project estates</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Capital-project-heavy businesses usually land on private edition or on-premise because they need the full SAP PS and SAP IM depth. According to <a href="https://www.gartner.com/en/information-technology/insights/erp" target="_blank" rel="noopener">Gartner ERP research</a>, deployment choice is now driven as much by integration and governance needs as by cost, which is exactly the calculation an EPPM landscape forces.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does SaiSatwik design into an SAP EPPM landscape?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik treats architecture as the first deliverable, not an afterthought. Before any module is configured, the SaiSatwik team maps the integration points to FICO, HCM, MM and SD, decides what belongs in the core versus on SAP BTP, and sets the master-data model that every module will share.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That ordering matters because a weak architecture is invisible on go-live day and expensive two years later, when custom code blocks an upgrade or a broken integration forces manual data entry. The <a href="https://saisatwik.com/services/sap/eppm/">SaiSatwik SAP EPPM practice</a> designs the landscape to stay clean through upgrades, then sequences the build around it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Related SaiSatwik Reading</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>These companion guides sit alongside the SAP EPPM architecture picture:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/what-is-sap-eppm-and-why-top-enterprises-are-switching-to-it/">What is SAP EPPM and why top enterprises are switching to it</a>. The definitional pillar for the suite described here.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-modules-explained-ps-ppm-im-cpm-cats/">SAP EPPM modules explained: PS, PPM, IM, CPM and CATS</a>. The module-by-module detail behind the application layer.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-in-sap-s4hana-what-changed/">SAP EPPM in SAP S/4HANA: what changed</a>. How the Universal Journal and Fiori reshaped this architecture.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-implementation-roadmap/">SAP EPPM implementation roadmap</a>. How the architecture translates into a phased rollout plan.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-s4-hana-modules-guide/">SAP S/4HANA modules: a comprehensive guide</a>. The wider platform the EPPM stack runs inside.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP EPPM architecture</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is SAP EPPM a single product or several modules?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP EPPM is an architecture of five modules (SAP PS, PPM, IM, CPM and CATS) that run on a shared SAP S/4HANA core, not a single product. Most enterprises license and deploy two or three of the modules, not all five, based on which capabilities they need.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What database does SAP EPPM run on?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP EPPM runs on the SAP HANA in-memory database through SAP S/4HANA. Financial postings for projects land in the Universal Journal (table ACDOCA), the same store used by SAP Finance and Controlling, which is what makes real-time project financial reporting possible.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How does SAP EPPM avoid data reconciliation?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Every project cost posts to one line item in the Universal Journal carrying its account, WBS element, cost centre and profit centre together. Because project reporting and the general ledger read the same rows, there is no separate project ledger to reconcile against finance, which was a routine task in the older SAP ECC architecture.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Where do SAP EPPM customisations live?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Modern SAP EPPM customisations live on SAP BTP, side by side with the core rather than inside it. This keeps the digital core clean so S/4HANA upgrades do not break custom code, which is the recommended extension model for the current architecture.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can SAP EPPM integrate with non-SAP systems?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. While EPPM integrates natively with SAP FICO, HCM, MM and SD, it can connect to non-SAP systems through SAP Integration Suite on SAP BTP using APIs and standard connectors. Native SAP integration is deeper, so most landscapes keep the finance and resource connections inside SAP and use BTP for the external ones.</p>
<!-- /wp:paragraph -->
`,
};
