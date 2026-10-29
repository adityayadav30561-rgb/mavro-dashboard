/**
 * SaiSatwik blog post - SAP PS cluster spoke (SAP PS in S/4HANA).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K22.
 * Primary keyword: SAP PS S/4HANA. Intent: informational (traffic engine),
 * Priority 1, geo-neutral. Anchors UP to the SAP PS hub (#5418), laterally to
 * the FICO, results analysis and planning spokes, and bridges to the SAP
 * Platform Guides cluster. House style: plain, direct, no em dashes, no
 * filler. Changes stated only where well established; release-specific items
 * point readers to SAP's simplification list.
 */

module.exports = {
  title: 'SAP PS in S/4HANA: Key Differences from ECC Explained',
  slug: 'sap-ps-in-s4hana-key-differences',

  excerpt:
    'What changes for SAP PS in S/4HANA: the Universal Journal, cost elements as G/L accounts, planning, revenue recognition, Fiori apps and migration steps.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-23T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'Cloud Migration',
    'For CTOs',
    'Comparison',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS in S/4HANA keeps the same core objects and most of the same transactions as ECC: project definitions, WBS elements, networks, CJ20N and the period-end close. The differences sit around the module. Finance postings land in the Universal Journal. Cost elements become G/L accounts. Detailed planning moves toward SAP Analytics Cloud. Event-based revenue recognition joins results analysis, and Fiori apps add new screens. SaiSatwik helps project-driven businesses move SAP PS to S/4HANA without redesigning projects that already work.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Does SAP PS still exist in SAP S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. SAP Project System is part of <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> on-premise and private cloud. Project definitions, WBS elements, networks, activities and milestones work as they did in ECC, and CJ20N remains the main working transaction.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That continuity is deliberate. Thousands of companies run capital and customer projects on SAP PS. A forced redesign would have stalled migrations. The <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">SAP PS beginner guide</a> describes the objects that carry over unchanged.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What are the key differences for SAP PS in S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The changes that affect SAP PS teams most come from finance, planning and the user interface. The table summarises them.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Area</th><th>SAP ECC</th><th>SAP S/4HANA</th></tr></thead><tbody><tr><td><strong>Finance data</strong></td><td>Separate FI and CO tables, reconciled</td><td>One Universal Journal (table ACDOCA)</td></tr><tr><td><strong>Cost elements</strong></td><td>Separate CO master data</td><td>G/L accounts with a cost element category</td></tr><tr><td><strong>Detailed planning</strong></td><td>Classic planning transactions such as CJR2</td><td>SAP Analytics Cloud positioned as the strategic planning tool</td></tr><tr><td><strong>Revenue recognition</strong></td><td>Results analysis at period end</td><td>Results analysis or event-based revenue recognition</td></tr><tr><td><strong>Customer and vendor master</strong></td><td>Separate customer and vendor records</td><td>Business partner model</td></tr><tr><td><strong>User interface</strong></td><td>SAP GUI</td><td>SAP GUI plus SAP Fiori apps</td></tr><tr><td><strong>MRP</strong></td><td>Classic MRP</td><td>MRP Live, much faster on HANA</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS in ECC vs SAP PS in S/4HANA</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does the Universal Journal change SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The Universal Journal puts every financial posting, including project costs, in one line-item table. A supplier invoice on a WBS element is one record carrying the G/L account, cost element, profit center and project together.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For project controllers, reports get faster and FI to CO reconciliation disappears. For migration teams, the cost element change is the bigger job. Secondary cost elements used for settlement, overhead and results analysis must exist as G/L accounts first. The <a href="https://saisatwik.com/sap-ps-and-fico-integration/">SAP PS and FICO integration guide</a> covers those flows.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What changes for planning and revenue recognition?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Planning and revenue recognition are where SAP PS in S/4HANA asks for real decisions. Both have a classic option and a newer one.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Cost planning.</strong> Easy Cost Planning and network costing work as before. For detailed financial planning, SAP positions <a href="https://www.sap.com/products/data-cloud/cloud-analytics.html" target="_blank" rel="noopener">SAP Analytics Cloud</a> as the strategic tool. See the <a href="https://saisatwik.com/sap-ps-project-cost-planning-guide/">SAP PS cost planning guide</a>.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Revenue recognition.</strong> Classic results analysis still runs on-premise. Event-based revenue recognition posts recognised revenue as costs and billings occur. The <a href="https://saisatwik.com/results-analysis-in-sap-ps-explained/">results analysis guide</a> compares the two.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Neither choice has to be made on day one. Many companies convert with classic planning and results analysis, then move to the newer options as a later phase.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP PS functions need checking before migration?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP publishes a Simplification List for each S/4HANA release. It names functions that changed, moved or are not part of the target architecture. A few older Project System add-ons appear on it, and the list changes by release.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Run SAP Readiness Check against your ECC system before planning the conversion. It reports which simplification items apply to the functions you actually use. Release-specific guidance is on the <a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE" target="_blank" rel="noopener">SAP Help Portal</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Why is the timing of SAP PS migration important?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The ECC deadline sets the clock. <a href="https://news.sap.com/2020/02/sap-s4hana-maintenance-2040-clarity-choice-sap-business-suite-7/" target="_blank" rel="noopener">SAP's maintenance announcement</a> commits mainstream maintenance for ECC until the end of 2027, with optional extended maintenance to 2030. S/4HANA maintenance runs to at least 2040.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Project-heavy businesses carry extra migration risk because projects run across the cutover. <a href="https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/delivering-large-scale-it-projects-on-time-on-budget-and-on-value" target="_blank" rel="noopener">McKinsey and Oxford found</a> large IT projects run 45 percent over budget on average. Open projects, budgets and assets under construction all need a clear conversion plan.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How should you migrate SAP PS to S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>An SAP PS migration follows the wider S/4HANA conversion, with a few project-specific steps. The order below is how SaiSatwik plans them.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Run Readiness Check.</strong> Identify simplification items that touch Project System.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Clean up projects.</strong> Close finished projects, settle balances and archive what you can.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Prepare cost elements.</strong> Map secondary cost elements to G/L accounts.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Decide planning and revenue recognition.</strong> Keep classic first, or move now.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Test full cycles.</strong> Plan, budget, procure, confirm, bill and settle on converted projects.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Train on Fiori.</strong> Introduce the new apps alongside CJ20N, not instead of it.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik handle SAP PS in S/4HANA projects?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik treats SAP PS as its own workstream inside an S/4HANA conversion. Open projects are listed and classified months before cutover. The project team decides which close, which convert, and which need a fresh structure.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That work is part of every conversion run by the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>. For the full platform picture, see the <a href="https://saisatwik.com/sap-ecc-to-s-4hana-migration-guide-benefits/">SAP ECC to S/4HANA migration guide</a> and <a href="https://saisatwik.com/sap-eppm-in-sap-s4hana-what-changed/">SAP EPPM in SAP S/4HANA: what changed</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS in S/4HANA</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is SAP PS replaced in SAP S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>No. SAP Project System continues in SAP S/4HANA with the same core objects and transactions. What changes are the surrounding finance, planning and interface layers, plus newer options such as event-based revenue recognition.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Does CJ20N still work in SAP S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. CJ20N runs in SAP S/4HANA as the main transaction for building and changing projects. SAP Fiori apps add monitoring and reporting views alongside it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What happens to cost elements for SAP PS in S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Cost elements become G/L accounts with a cost element category in the chart of accounts. Secondary cost elements used for overhead, results analysis and settlement must be set up as G/L accounts during conversion.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can open SAP PS projects be converted to S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. A system conversion carries open projects, budgets, commitments and assets under construction across. Clean-up before conversion, such as closing finished projects and settling balances, makes it much smoother.</p>
<!-- /wp:paragraph -->
`,
};
