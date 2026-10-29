/**
 * SaiSatwik blog post - SAP PS cluster spoke (earned value management).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K20.
 * Primary keyword: earned value management SAP. Intent: informational
 * (traffic engine), Priority 1, geo-neutral. Anchors UP to the SAP PS hub
 * (#5418) and laterally to the cost planning and networks spokes. House style:
 * plain, direct, no em dashes, no filler, no invented transactions.
 */

module.exports = {
  title: 'Earned Value Management in SAP PS: Progress Analysis Guide',
  slug: 'earned-value-management-in-sap-ps',

  excerpt:
    'How earned value management works in SAP PS: planned value, earned value, actual cost, CPI and SPI, progress measurement methods, CNE1, CNE2 and CNE5.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-21T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'Oil and Gas',
    'For PMOs',
    'Tutorial',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Earned value management in SAP PS is done through progress analysis. It compares planned value, earned value and actual cost for each WBS element or activity, then derives cost and schedule performance indexes. SAP PS measures progress with methods such as start-finish, milestone, time-proportional or estimation, runs the calculation with CNE1 or CNE2, and reports results in CNE5. The figures show whether a project is ahead, behind, over or under, long before the final bill. SaiSatwik sets up earned value management in SAP PS for capital programmes that need honest status reporting.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is earned value management?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> earned value management (EVM) is a project control method that compares the value of work actually completed with the work planned and the cost actually spent. It answers two questions with numbers. Is the project on budget for the work done? Is it on schedule against the plan?</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>EVM is a published discipline, not an SAP invention. The <a href="https://www.pmi.org/standards/earned-value-management" target="_blank" rel="noopener">PMI Standard for Earned Value Management</a> defines the method. The <a href="https://www.gao.gov/products/gao-20-195g" target="_blank" rel="noopener">GAO Cost Estimating and Assessment Guide</a> sets out how US federal programmes apply it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which earned value figures does SAP PS calculate?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS progress analysis works with three base values and derives the performance indexes from them. The names below are the standard EVM terms; SAP screens show the same values under their own labels.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Figure</th><th>Meaning</th><th>Formula</th></tr></thead><tbody><tr><td><strong>Planned value (PV)</strong></td><td>Budgeted cost of work scheduled to date</td><td>From the cost plan and schedule</td></tr><tr><td><strong>Earned value (EV)</strong></td><td>Budgeted cost of work actually performed</td><td>Percentage complete multiplied by plan</td></tr><tr><td><strong>Actual cost (AC)</strong></td><td>Cost actually incurred for that work</td><td>From actual postings</td></tr><tr><td><strong>Cost performance index (CPI)</strong></td><td>Cost efficiency</td><td>EV divided by AC</td></tr><tr><td><strong>Schedule performance index (SPI)</strong></td><td>Schedule efficiency</td><td>EV divided by PV</td></tr></tbody></table><figcaption class="wp-element-caption">Core earned value figures</figcaption></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>A CPI of 0.85 means every dollar spent has produced 85 cents of planned work. An SPI of 1.10 means the work is ahead of plan. Both below 1.0 together is the pattern steering committees should ask about first.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SAP PS measure progress?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The EV figure in SAP PS depends on how percentage complete is measured. Measurement methods are assigned per WBS element or activity, and the right one depends on the kind of work.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Start-finish.</strong> A fixed percentage at start and the rest at finish. Good for short tasks.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Milestone technique.</strong> Progress jumps as milestones are reached, each carrying a weight.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Time-proportional.</strong> Progress grows evenly with elapsed time. Suits level-of-effort work.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Degree of processing.</strong> Uses the confirmed degree of processing on network activities.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Quantity proportional.</strong> Progress equals units completed against units planned.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Estimation.</strong> A person responsible enters the percentage directly.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Cost proportional.</strong> Progress equals actual cost over planned cost. Easy, but it hides overspend.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Cost proportional deserves a warning. If progress is calculated from cost, overspending looks like progress. Use it only where nothing better is measurable.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do you run earned value analysis in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Earned value analysis in SAP PS runs as part of the monthly cycle. The steps are short once configuration is in place.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Maintain the plan.</strong> EVM needs a cost plan and dates. The <a href="https://saisatwik.com/sap-ps-project-cost-planning-guide/">SAP PS cost planning guide</a> covers this.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Record progress.</strong> Confirm activities, reach milestones or enter estimates, depending on the method.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Run progress analysis.</strong> CNE1 for one project, CNE2 for many.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Review results.</strong> CNE5 shows planned value, EV, actual cost and percentage complete per object.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Act on variances.</strong> Escalate elements with CPI or SPI below agreed thresholds.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Why does earned value matter on capital projects?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Cost reports alone mislead. A project can be exactly on budget because work is late. <a href="https://www.mckinsey.com/capabilities/operations/our-insights/imagining-constructions-digital-future" target="_blank" rel="noopener">McKinsey found</a> large construction projects typically finish 20 percent late and up to 80 percent over budget. EVM shows both problems together, early enough to act.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The scale of capital spending makes this matter. <a href="https://arxiv.org/abs/1409.0003" target="_blank" rel="noopener">Bent Flyvbjerg puts</a> global megaproject spending at 6 to 9 trillion US dollars a year. Even small CPI improvements on programmes that size are worth a lot of money.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What mistakes break earned value in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>EVM reporting fails quietly when its inputs are weak. These are the problems SaiSatwik most often finds when reviewing SAP PS progress analysis.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>No baseline.</strong> Plans are overwritten every month, so planned value keeps moving.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Cost-proportional everywhere.</strong> CPI is always 1.0, which tells nobody anything.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Unconfirmed activities.</strong> Site teams do not confirm, so EV lags reality.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Measurement at the wrong level.</strong> Progress at project level hides the one element in trouble.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik implement earned value in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik picks a measurement method per work type with the project controls team, freezes a baseline plan version before execution, and builds confirmation into normal site reporting. CNE5 results then feed the monthly portfolio review.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The setup runs on <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> and ECC and is part of project controls work from the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>. Activity confirmation, which feeds most methods, is covered in the <a href="https://saisatwik.com/sap-ps-network-and-activities-explained/">SAP PS networks and activities guide</a>.</p>
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
<li><a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">What is SAP PS? A beginner guide</a>. The objects progress analysis runs on.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/budgeting-and-availability-control-in-sap-ps/">Budgeting and availability control in SAP PS</a>. The budget side of project control.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-best-practices-for-capital-projects/">SAP EPPM best practices for capital projects</a>. EVM inside portfolio governance.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about earned value management in SAP PS</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Which transaction runs progress analysis in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CNE1 runs progress analysis for an individual project and CNE2 runs it collectively. CNE5 is the progress analysis report showing planned value, earned value, actual cost and percentage complete.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between earned value and actual cost?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Actual cost is what was spent. Earned value is the budgeted cost of the work actually completed. If earned value is lower than actual cost, the work is costing more than planned.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Which progress measurement method should I use?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Match the method to the work. Milestones suit engineering deliverables, quantity proportional suits installation work, time-proportional suits level-of-effort tasks. Avoid cost proportional except where no physical measure exists.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Does SAP PS earned value work in SAP S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. Progress analysis with CNE1, CNE2 and CNE5 runs in SAP S/4HANA. Many organisations also feed the results into SAP Analytics Cloud or Fiori dashboards for portfolio reporting.</p>
<!-- /wp:paragraph -->
`,
};
