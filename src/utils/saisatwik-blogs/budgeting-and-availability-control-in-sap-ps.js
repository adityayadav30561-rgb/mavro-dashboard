/**
 * SaiSatwik blog post - SAP PS cluster spoke (budgeting and availability control).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K14.
 * Primary keyword: SAP PS budget availability control. Intent: informational
 * (traffic engine), Priority 2, geo-neutral. Anchors UP to the SAP PS hub
 * (#5418) and laterally to the cost planning and WBS spokes. House style:
 * plain, direct, no em dashes, no filler, no invented transactions.
 */

module.exports = {
  title: 'Budgeting and Availability Control in SAP PS Explained',
  slug: 'budgeting-and-availability-control-in-sap-ps',

  excerpt:
    'How budgeting and availability control work in SAP PS: original budget, release, supplements, transfers, tolerance limits and the budget profile settings.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-15T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'For CFOs',
    'For PMOs',
    'Beginner Guide',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Budgeting in SAP PS records the approved amount for each WBS element, and availability control checks every posting against it. When a purchase order, invoice or goods issue would push assigned costs past a tolerance limit, SAP PS warns the user, emails the person responsible, or blocks the posting outright. Budgets are entered with CJ30, released with CJ32 and changed only through supplements, returns and transfers. SaiSatwik configures SAP PS availability control so overspend is stopped at the point of commitment, not discovered at month end.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is a budget in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> a budget in SAP PS is the approved cost limit for a project, held on WBS elements and managed separately from the cost plan. The plan is the estimate. The budget is the money the business has agreed to spend.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Once a budget is entered, the project picks up the BUDG system status. From then on, changes go through controlled transactions with their own history. That audit trail is what finance and internal audit rely on when a project comes back asking for more.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does the SAP PS budget lifecycle work?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The SAP PS budget lifecycle has five moves, and each one has its own transaction and history. This keeps the approved figure and its later changes visible side by side.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Step</th><th>What it does</th><th>Transaction</th></tr></thead><tbody><tr><td><strong>Original budget</strong></td><td>Enters the first approved amount per WBS element</td><td>CJ30</td></tr><tr><td><strong>Release</strong></td><td>Makes part or all of the budget available to spend</td><td>CJ32</td></tr><tr><td><strong>Supplement</strong></td><td>Adds money after approval of a scope or cost change</td><td>Budget supplement transaction</td></tr><tr><td><strong>Return</strong></td><td>Gives unused budget back to a higher WBS level</td><td>Budget return transaction</td></tr><tr><td><strong>Transfer</strong></td><td>Moves budget between WBS elements or projects</td><td>CJ34</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS budget lifecycle</figcaption></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Release is the step teams forget. A project can hold a large original budget, but only the released portion counts as spendable if the budget profile is set that way. Phased release is a simple, effective control on multi-year capital projects.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is availability control in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Availability control</strong> is the SAP PS check that compares assigned values against the budget every time a cost-relevant document is saved. Assigned values include actual costs plus commitments such as open purchase requisitions and purchase orders.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Commitments are the reason it works so well. Overspend is caught when the purchase order is raised, weeks before the invoice arrives. By then, the conversation with the vendor is still possible. After the invoice, it is just a variance.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How do tolerance limits work in availability control?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Tolerance limits set how strictly availability control reacts. Each limit is a percentage of budget used, tied to an action. A common setup looks like this:</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>At 90 percent:</strong> a warning appears for the user posting the document.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>At 100 percent:</strong> a warning plus an email to the person responsible for the WBS element.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>At 110 percent:</strong> an error that blocks the posting until budget is added.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Limits can differ by activity group, so purchase orders can be blocked while goods issues only warn. The percentages above are illustrations. Each business sets its own in the tolerance limits attached to the budget profile.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does the budget profile control in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The budget profile is the configuration behind SAP PS budgeting and availability control. It is maintained in OPS9 and assigned through the project profile.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Time frame and annual values.</strong> Whether budgets are held as an overall figure, per fiscal year, or both.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Activation type.</strong> Whether availability control never activates, activates when budget is allocated, or activates by background job once usage passes a set percentage.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Overall or annual check.</strong> Whether postings are checked against the total budget or the current year's budget.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Release requirement.</strong> Whether availability control checks against released budget or total budget.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Currency and exchange rate type.</strong> Which currency the check runs in.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Two housekeeping transactions are worth knowing. CJBV activates availability control on existing projects after a profile change. CJBN reconstructs assigned values if they ever fall out of step with the documents.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Why is availability control worth the effort?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Large projects overspend as a matter of habit. Bent Flyvbjerg calls it the <a href="https://arxiv.org/abs/1409.0003" target="_blank" rel="noopener">iron law of megaprojects</a>: over budget, over time, over and over again. His research puts global megaproject spending at 6 to 9 trillion US dollars a year, about 8 percent of world GDP.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Availability control does not make estimates better. What it does is force a decision every time spending crosses the line. <a href="https://www.mckinsey.com/capabilities/operations/our-insights/imagining-constructions-digital-future" target="_blank" rel="noopener">McKinsey found</a> large construction projects can run up to 80 percent over budget. Forcing those decisions early is the cheapest protection against that outcome.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What mistakes do teams make with SAP PS budgets?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The common failures are configuration choices that look harmless on day one. SaiSatwik finds at least one of these on most SAP PS reviews.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Availability control switched off "temporarily".</strong> It rarely comes back on, and budgets turn into reports instead of controls.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Budget on every WBS level.</strong> Control at too low a level creates constant blocks and transfer requests.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Error at 100 percent with no warning tier.</strong> Users hit a wall with no notice, and pressure builds to raise the limit.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Budget entered before the plan is stable.</strong> The first month becomes a stream of supplements that hide the real overrun.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik set up SAP PS budgeting?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik sets budget control at the WBS level where someone is actually accountable, usually one or two levels below the project definition. Tolerance limits get a warning tier, an email tier and an error tier. Phased release is configured for multi-year capital projects.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The setup runs the same way on <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> and ECC, and is part of every engagement from the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>. It builds on the <a href="https://saisatwik.com/sap-ps-project-cost-planning-guide/">SAP PS cost planning guide</a>, because a budget is only as good as the plan behind it.</p>
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
<li><a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">What is SAP PS? A beginner guide</a>. Where budgets sit among the SAP PS objects.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS Work Breakdown Structure explained</a>. Choosing the WBS level budgets live on.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-best-practices-for-capital-projects/">SAP EPPM best practices for capital projects</a>. Budget governance across a portfolio.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/earned-value-management-in-sap-ps/">Earned value management in SAP PS</a>. Reading spend against progress, not just against budget.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS budgeting and availability control</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What happens when a posting exceeds the budget in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Availability control compares assigned values to the budget. Depending on the tolerance limits, the user sees a warning, the person responsible gets an email, or the posting is blocked with an error until budget is supplemented or transferred.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Does availability control check commitments or only actual costs?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Both. Assigned values include actual costs and commitments such as purchase requisitions and purchase orders. That is why availability control catches overspend at the purchasing stage instead of after the invoice posts.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between CJ30 and CJ32?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ30 maintains the original budget, the approved amount for each WBS element. CJ32 releases budget, making part or all of it available to spend. Projects with phased approvals release budget in stages.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Why is availability control not active on my project?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Check the budget profile's activation type first. If availability control activates by background job, it switches on only after usage passes the set percentage. After profile changes, CJBV activates it for existing projects.</p>
<!-- /wp:paragraph -->
`,
};
