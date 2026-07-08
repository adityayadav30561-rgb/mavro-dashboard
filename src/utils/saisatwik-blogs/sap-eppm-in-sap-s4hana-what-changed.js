/**
 * SaiSatwik blog post — SAP EPPM cluster spoke #7 (S/4HANA platform angle).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx → Knowledge Blogs → K03.
 * Priority 1, informational, global. Primary keyword: SAP EPPM S/4HANA.
 * Deliberately bridges the SAP EPPM cluster and the SAP Platform Guides
 * cluster (links to both hubs + the ECC/migration pair).
 * Written per SAISATWIK_BLOG_PUBLISHING.md — traffic intent template.
 */

module.exports = {
  title: 'SAP EPPM in SAP S/4HANA: What Changed and What It Means',
  slug: 'sap-eppm-in-sap-s4hana-what-changed',

  excerpt:
    'SAP EPPM did not just survive the move to SAP S/4HANA. Project financials, reporting, and the entire front end changed. Here is exactly what is different and what it means for your rollout.',

  categories: ['SAP'],
  tags: [
    'SAP EPPM',
    'SAP S/4HANA',
    'SAP PS',
    'SAP ECC',
    'Enterprise Portfolio Management',
    'For PMOs',
    'For CTOs',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP EPPM in SAP S/4HANA changed in four load-bearing ways: project financials now post to the Universal Journal (table ACDOCA) instead of separate CO tables, the front end moved from SAP GUI to <a href="https://www.sap.com/products/technology-platform/fiori.html" target="_blank" rel="noopener">SAP Fiori</a>, analytics run embedded on live data instead of overnight extracts, and SAP CPM became a native part of the platform rather than an add-on. The modules themselves survived. SAP PS, PPM, IM, CPM and CATS all run on <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>. SaiSatwik plans every EPPM-on-S/4HANA programme around these four changes, because each one breaks a different set of old habits.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What did SAP EPPM look like before S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>In the SAP ECC era, <a href="https://www.sap.com/products/erp/enterprise-portfolio-project-management.html" target="_blank" rel="noopener">SAP EPPM</a> was a collection of loosely coupled parts. SAP PS lived inside ECC and posted costs to the classic CO tables. SAP PPM ran as a separate add-on with its own portal-based interface. SAP CPM shipped as a bolt-on with its own database schema. Project reporting meant batch extracts into SAP BW, refreshed overnight.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That architecture worked. It also created the reconciliation industry every ECC-era finance controller knows too well. A project manager's view of actuals and the general ledger's view of the same numbers could disagree until the next reconciliation run settled the argument.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The pressure to move is now a deadline, not a preference. <a href="https://news.sap.com/2020/02/sap-s4hana-maintenance-2040-clarity-choice-sap-business-suite-7/" target="_blank" rel="noopener">SAP has committed mainstream maintenance for ECC only through 2027</a>, which is why most EPPM modernisation conversations today are really S/4HANA migration conversations.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What actually changed for SAP EPPM in S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Here is the change map SaiSatwik walks clients through at the start of every EPPM-on-S/4HANA engagement.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Area</th><th>SAP ECC Era</th><th>SAP S/4HANA</th><th>What It Means</th></tr></thead><tbody><tr><td><strong>Project financials</strong></td><td>Costs in CO tables (COEP, COSP), reconciled to FI</td><td>Every posting lands in the Universal Journal (ACDOCA)</td><td>One version of project truth; reconciliation work disappears</td></tr><tr><td><strong>User experience</strong></td><td>SAP GUI transactions (CJ20N, CJ40, CAT2)</td><td>Fiori apps in the browser, GUI still available for power users</td><td>Executives and casual users finally use the system directly</td></tr><tr><td><strong>Analytics</strong></td><td>Overnight BW extracts, day-old dashboards</td><td>Embedded analytics on live ACDOCA data via CDS views</td><td>Margin and budget positions are current at the moment you look</td></tr><tr><td><strong>SAP PPM</strong></td><td>Separate add-on, portal UI, periodic sync with PS</td><td>Runs on the same S/4HANA stack with Fiori dashboards</td><td>Portfolio decisions read live project data, not synced copies</td></tr><tr><td><strong>SAP CPM</strong></td><td>Bolt-on with its own schema</td><td>Native S/4HANA component using the Universal Journal</td><td>Commercial project reporting stops being a side system</td></tr><tr><td><strong>Time capture</strong></td><td>CAT2 GUI transaction</td><td>Fiori "My Timesheet" app, CAT2 retained</td><td>Contractors and site staff book time from a phone browser</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does the Universal Journal change project reporting?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Universal Journal is the single biggest architectural shift for project-heavy businesses. In ECC, a project cost existed in several places at once: the CO line item, the FI document, the profitability segment. Each copy could age at its own pace.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>In S/4HANA there is one line item, in one table, carrying the account, the WBS element, the profit centre and the margin dimensions together. When a PMO pulls a project cost report and a CFO pulls the P&amp;L, both queries hit the same rows.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The practical effects show up fast. Month-end project settlement runs shrink. Budget-versus-actual views stop lagging behind reality. Auditors trace a project cost to the ledger in one step. According to the <a href="https://www.pmi.org/learning/thought-leadership/pulse" target="_blank" rel="noopener">PMI Pulse of the Profession</a>, poor data quality in portfolio governance is a leading driver of the 11.4 percent of project investment that gets wasted, and a single-source ledger attacks exactly that problem.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What happens to SAP PS customisations during the move?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This is where EPPM migrations get real. Twenty years of ECC usually means a thick layer of custom ABAP sitting on top of SAP PS: custom reports reading CO tables directly, user exits shaping WBS behaviour, Z-transactions the business swears it cannot live without.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Three rules of thumb hold across most estates SaiSatwik has assessed:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Custom reports on CO tables break.</strong> Anything reading COEP or COSP directly needs rework against ACDOCA or, better, replacement with an embedded analytics view that already exists.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Core PS logic mostly survives.</strong> WBS structures, network types, settlement rules and billing plans carry over. The SAP Simplification Item Catalog flags the exceptions, and it must be checked line by line, not skimmed.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>A third of Z-transactions are dead weight.</strong> Usage analysis before the move consistently shows a large slice of custom code that nobody has run in years. Migrating it is paying to move furniture nobody sits on.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP EPPM capabilities are new on S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Beyond the re-platforming, S/4HANA added capabilities the ECC stack never had.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Capability</th><th>What It Does</th><th>Who Uses It</th></tr></thead><tbody><tr><td>Fiori project dashboards</td><td>Live status, cost and schedule tiles without running a report</td><td>PMO, executives</td></tr><tr><td>Embedded margin analysis</td><td>Project profitability from ACDOCA, no BW round trip</td><td>Finance controllers</td></tr><tr><td>Situation handling</td><td>Push alerts when a budget threshold or date slips</td><td>Project managers</td></tr><tr><td>CDS-based custom reporting</td><td>Real-time custom views without cloning tables</td><td>IT, analysts</td></tr><tr><td>BTP extension path</td><td>Custom apps live outside the core, upgrades stay clean</td><td>Development teams</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>The pattern across all five: work that used to require a specialist and a wait now happens in the browser, on live data. That is the quiet reason EPPM adoption widens after an S/4HANA move. More people can actually use it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What should a PMO do before moving SAP EPPM to S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The sequencing below is the pre-work SaiSatwik runs with every client PMO. None of it requires S/4HANA licences to start.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Inventory the project estate.</strong> Active WBS structures, open network activities, unsettled costs. Anything open at cutover multiplies migration effort.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Run the Simplification Item Catalog against your PS and PPM footprint.</strong> This tells you which transactions, tables and functions change before anyone writes a plan.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Measure custom-code usage.</strong> Let the usage data kill the dead Z-transactions so the migration scope shrinks before it is priced.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Clean master data now.</strong> Project profiles, cost element groups and settlement rules migrate at whatever quality they hold on cutover day. Cleaning after go-live costs multiples more.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Decide the PPM timing.</strong> Portfolio management can move with the core or follow in a second wave. Moving everything at once is the ambitious plan; it is rarely the cheapest one.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does SaiSatwik do differently on EPPM-to-S/4HANA programmes?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik treats an EPPM move as a finance-data programme wearing a project-management coat. The first two weeks go to master-data validation and the Simplification Item review, before any conversion tooling runs. That ordering exists because rework in month four is where these programmes lose their budgets.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Scope is cut by module and by legal entity. A PS-first conversion for a mid-market client typically lands in 16 to 20 weeks, with PPM and CPM following as a second wave once ACDOCA reporting has bedded in. The <a href="https://saisatwik.com/services/sap/eppm/">SaiSatwik SAP EPPM practice</a> runs both the greenfield and the conversion paths, and will tell you plainly which one your estate actually needs.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Related SaiSatwik Reading</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This post sits between two SaiSatwik guide clusters. These are the natural next reads:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/what-is-sap-eppm-and-why-top-enterprises-are-switching-to-it/">What is SAP EPPM and why top enterprises are switching to it</a> — the definitional pillar for the suite this post modernises.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-modules-explained-ps-ppm-im-cpm-cats/">SAP EPPM modules explained: PS, PPM, IM, CPM and CATS</a> — the module-by-module breakdown behind everything discussed here.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-s4-hana-modules-guide/">SAP S/4HANA modules: a comprehensive guide</a> — the wider platform these EPPM changes live inside.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ecc-vs-sap-s-4hana/">SAP ECC vs SAP S/4HANA: key differences</a> — the platform comparison for stakeholders still weighing the move.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ecc-to-s-4hana-migration-guide-benefits/">How to migrate from SAP ECC to S/4HANA</a> — the step-by-step migration guide this post's PMO checklist feeds into.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP EPPM in S/4HANA</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is SAP EPPM included in SAP S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The EPPM modules run on S/4HANA but licensing varies by component. SAP PS ships with the S/4HANA core. SAP PPM and SAP CPM are typically licensed separately even though they run on the same stack. Check entitlements before assuming a capability is already paid for.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Does SAP PS still exist in S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. SAP PS remains the project execution module in S/4HANA. WBS structures, networks, settlement and milestone billing all carry forward. The changes are underneath: financial postings go to the Universal Journal, and Fiori apps sit in front of the classic transactions.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is ACDOCA and why does it matter for projects?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>ACDOCA is the Universal Journal table in SAP S/4HANA, the single line-item store for financial postings. For projects it means the WBS cost view and the general ledger are the same data, so project reporting is real-time and reconciliation between CO and FI disappears as a task.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Do I need to reimplement SAP PPM when moving to S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Not from zero, but it is more than a technical upgrade. Portfolio structures and scoring models carry over conceptually, while the interface moves to Fiori and integration points change. Most enterprises treat the PPM move as a second wave after the core conversion stabilises.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can SAP EPPM run on S/4HANA Cloud?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Project management capabilities exist across S/4HANA Cloud editions, with scope differences. The private edition supports the fullest EPPM footprint, close to on-premise. The public edition covers core project financials with a leaner feature set. Capital-project-heavy enterprises usually land on private edition or on-premise for this reason.</p>
<!-- /wp:paragraph -->
`,
};
