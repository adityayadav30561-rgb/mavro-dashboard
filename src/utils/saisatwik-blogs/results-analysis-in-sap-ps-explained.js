/**
 * SaiSatwik blog post - SAP PS cluster spoke (results analysis).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K16.
 * Primary keyword: SAP PS results analysis. Intent: informational (traffic
 * engine), Priority 2, geo-neutral. Anchors UP to the SAP PS hub (#5418) and
 * laterally to the milestone billing and cost planning spokes. House style:
 * plain, direct, no em dashes, no filler, no invented transactions.
 */

module.exports = {
  title: 'Results Analysis (RA) in SAP PS Explained Simply',
  slug: 'results-analysis-in-sap-ps-explained',

  excerpt:
    'What results analysis does in SAP PS: POC methods, WIP, accrued and deferred revenue, loss provisions, KKA2 and KKAJ, and how RA connects to settlement.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-17T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'Engineering and Construction',
    'For CFOs',
    'Beginner Guide',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Results analysis in SAP PS is the period-end step that works out how much revenue and cost a customer project has really earned, compared with what was billed and posted. Using a method such as percentage of completion, it calculates work in process, accrued or deferred revenue, and provisions for expected losses. It runs with KKA2 for one project or KKAJ for many, and settlement then carries the results to financial accounting. SaiSatwik configures SAP PS results analysis so project margins in the ledger match how the business actually earns them.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is results analysis in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> results analysis (RA) in SAP PS is a valuation that compares a project's actual costs and revenues with its planned figures, then calculates the adjustments needed for correct period profit. It works on the WBS element that carries revenue.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The need is simple. A 14-month EPC contract might bill 40 percent of its value in month three, while only 15 percent of the work is done. Without RA, the profit and loss statement shows a windfall in month three and a loss for the rest of the year. RA spreads the margin to match the work.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Why does RA matter for revenue recognition?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Accounting standards require revenue on long contracts to follow performance, not invoices. Under <a href="https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/" target="_blank" rel="noopener">IFRS 15</a>, revenue is often recognised over time as the performance obligation is satisfied. Indian companies apply the converged Ind AS 115.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>RA is how SAP PS produces those numbers. It does not change invoices or costs. It posts the difference between what was billed and what was earned, so the ledger reports margin in the right period. Auditors check these postings closely on project-based businesses.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which results analysis methods does SAP PS support?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS offers several RA methods, chosen through the results analysis key on each billing WBS element. Three cover most real projects.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Method</th><th>How progress is measured</th><th>Typical use</th></tr></thead><tbody><tr><td><strong>Cost-based percentage of completion</strong></td><td>Actual cost divided by planned total cost</td><td>Fixed-price construction and engineering contracts</td></tr><tr><td><strong>Revenue-based method</strong></td><td>Billed revenue relative to planned revenue</td><td>Contracts where billing tracks progress closely</td></tr><tr><td><strong>Completed contract</strong></td><td>No margin until the project finishes</td><td>Short contracts, or where outcome cannot be estimated reliably</td></tr></tbody></table><figcaption class="wp-element-caption">Common SAP PS results analysis methods</figcaption></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Cost-based percentage of completion is the most common. It depends on a reliable cost plan, which is why the <a href="https://saisatwik.com/sap-ps-project-cost-planning-guide/">SAP PS cost planning guide</a> matters long before the first period-end close.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What values does RA calculate?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>RA produces a small set of values, each posted on its own RA cost element. Knowing them by name makes the reports much easier to read.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Work in process (WIP).</strong> Costs incurred that cannot yet be matched against revenue.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Revenue in excess of billings.</strong> Earned revenue not yet invoiced, shown as accrued revenue.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Billings in excess of revenue.</strong> Invoices raised ahead of progress, shown as deferred revenue.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Reserves for imminent loss.</strong> A provision when planned costs exceed planned revenue.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Cost of sales.</strong> The cost matched against recognised revenue for the period.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does RA run at period end?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>RA sits in the middle of the SAP PS period-end close. The order matters, because each step uses the results of the one before.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Post all actuals.</strong> Confirmations, goods issues, invoices and overheads (CJ44 or CJ45) for the period.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Run results analysis.</strong> KKA2 for a single project, KKAJ for collective processing. Check the log for warnings about missing plans.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Review the results.</strong> Look at WIP, accrued revenue and loss reserves by project before anything reaches the ledger.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Settle.</strong> CJ88 or CJ8G transfers the RA values to financial accounting and profitability analysis.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What changed for results analysis in SAP S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Classic RA still runs in <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> on-premise. SAP also offers event-based revenue recognition, which posts recognised revenue in real time as costs and billings occur, instead of waiting for period end.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The choice depends on your release, deployment and accounting policy. Event-based recognition is the direction SAP is investing in, but migrating to it is a project in its own right. Check the documentation for your release on the <a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE" target="_blank" rel="noopener">SAP Help Portal</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik set up results analysis?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik starts RA design with the client's finance team and auditors, not the IMG. The accounting policy decides the method. The project structure decides where revenue lives. Configuration follows from both.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>On every engagement, the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a> runs at least two parallel period-end closes before go-live, comparing SAP results with the existing spreadsheets. RA is closely tied to <a href="https://saisatwik.com/milestone-billing-in-sap-ps/">milestone billing in SAP PS</a>, which produces the billed revenue it analyses.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Related SaiSatwik Reading</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>More from the SAP PS series:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">What is SAP PS? A beginner guide</a>. The project objects results analysis runs on.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-tutorial-for-beginners/">SAP PS tutorial for beginners</a>. Where period-end fits in the project lifecycle.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-in-sap-s4hana-what-changed/">SAP EPPM in SAP S/4HANA: what changed</a>. The wider platform changes behind revenue recognition.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-settlement-explained/">SAP PS settlement explained</a>. The step that posts RA values to the ledger.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about results analysis in SAP PS</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Which transaction runs results analysis in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>KKA2 runs results analysis for an individual project or WBS element. KKAJ runs it collectively for many projects, usually as part of the period-end close. Both write results to RA cost elements.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is results analysis needed for internal projects?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Usually not. RA matters where a project earns revenue from a customer. Internal and capital projects normally settle costs to cost centers or assets instead, without any revenue to match.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How do results analysis values reach the general ledger?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Through settlement. Running CJ88 or CJ8G after RA transfers WIP, accrued revenue and reserves to financial accounting, based on the settlement profile and results analysis settings.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between results analysis and event-based revenue recognition?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>RA calculates adjustments at period end. Event-based revenue recognition, available in SAP S/4HANA, posts recognised revenue as each cost or billing event happens. The second gives real-time margins but needs its own design.</p>
<!-- /wp:paragraph -->
`,
};
