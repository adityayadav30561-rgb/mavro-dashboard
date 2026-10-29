/**
 * SaiSatwik blog post - SAP PS cluster spoke (project cost planning).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K13.
 * Primary keyword: SAP PS cost planning. Intent: informational (traffic
 * engine), Priority 1, geo-neutral. Anchors UP to the SAP PS hub (#5418) and
 * laterally to the WBS, tutorial and networks spokes. House style: plain,
 * direct, no em dashes, no filler, no invented transactions.
 */

module.exports = {
  title: 'SAP PS Project Cost Planning Guide: Methods, Steps and Tips',
  slug: 'sap-ps-project-cost-planning-guide',

  excerpt:
    'SAP PS cost planning explained: overall planning, cost element planning, Easy Cost Planning and network costing, with the steps, planning profile and pitfalls.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-14T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'For CFOs',
    'For PMOs',
    'Tutorial',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS cost planning is how a project's expected costs are entered against its WBS elements before money is spent. SAP Project System offers four methods: overall (structure) planning, detailed cost element planning, Easy Cost Planning, and network costing. Smaller projects plan top-down with rough figures. Capital projects usually plan bottom-up from activities and materials. A planning profile set in configuration controls which methods are allowed and how values roll up. SaiSatwik configures SAP PS cost planning so the plan becomes the baseline for budgets, variance reports and earned value.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is cost planning in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> cost planning in SAP PS is the process of recording expected project costs, by WBS element and period, in a plan version. The plan is not a budget. It is the estimate the budget is later approved against.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That distinction matters in practice. Plans change freely as estimates mature. Budgets are controlled values with an approval trail and availability control behind them. Finance teams that merge the two lose the ability to say how far the estimate moved before anyone approved the money.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which cost planning methods does SAP PS offer?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS gives four planning methods, each suited to a different stage of maturity. Most projects use two of them over their life: a rough top-down figure early, then a detailed bottom-up plan once design is firm.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Method</th><th>How it works</th><th>Best used when</th></tr></thead><tbody><tr><td><strong>Overall (structure) planning, CJ40</strong></td><td>Enter a single amount per WBS element, overall or by year</td><td>Early estimates, feasibility, simple internal projects</td></tr><tr><td><strong>Cost element planning, CJR2</strong></td><td>Plan by cost element, period and activity type on each WBS element</td><td>Finance needs plan figures by cost element for variance reporting</td></tr><tr><td><strong>Easy Cost Planning</strong></td><td>Build a costing model of materials, services and labour inside the Project Builder</td><td>Quotation stage on customer projects, quick bottom-up estimates</td></tr><tr><td><strong>Network costing</strong></td><td>Planned costs come from network activities and material components</td><td>Detailed execution plans with scheduled work and procurement</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS cost planning methods compared</figcaption></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Network costing is the most accurate because cost follows the schedule. It also needs a well-built network. The <a href="https://saisatwik.com/sap-ps-network-and-activities-explained/">guide to SAP PS networks and activities</a> covers how activities generate planned cost.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do you plan project costs in SAP PS, step by step?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A typical SAP PS cost planning cycle runs in six steps. The order matters more than the transactions, because each step depends on the one before it.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Confirm the structure.</strong> WBS elements that carry costs need the planning element indicator set. The <a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS WBS guide</a> explains the operative indicators.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Choose the plan version.</strong> Version 0 holds the working plan. Extra versions hold scenarios or frozen baselines.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Enter rough figures.</strong> Use overall planning in CJ40 for early estimates per WBS element and fiscal year.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Refine bottom-up.</strong> Move to cost element planning, Easy Cost Planning or network costing as scope firms up.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Check totals.</strong> Review the hierarchy so lower-level plans and higher-level plans agree, following the rules in the planning profile.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Hand over to budgeting.</strong> The approved plan becomes the basis for the original budget entered in CJ30, covered in <a href="https://saisatwik.com/budgeting-and-availability-control-in-sap-ps/">budgeting and availability control in SAP PS</a>.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does the planning profile control in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The planning profile is the configuration object behind every SAP PS cost plan. It is assigned through the project profile, so every project of that type plans the same way.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Time frame.</strong> How many past and future years can be planned.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Bottom-up or top-down.</strong> Whether lower WBS levels must stay within the values planned above them.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Annual or overall values.</strong> Whether plans are entered per fiscal year or as one total.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Default version and currency.</strong> Which plan version and currency the planning screens open with.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Cost element planning settings.</strong> Which planning layouts users see for detailed planning.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Why does accurate SAP PS cost planning matter?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Cost overruns on large projects are the rule, not the exception. <a href="https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/delivering-large-scale-it-projects-on-time-on-budget-and-on-value" target="_blank" rel="noopener">McKinsey and the University of Oxford</a> found large IT projects run 45 percent over budget on average, while delivering 56 percent less value than predicted.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A plan that lives in a spreadsheet cannot be tracked against actuals. A plan in SAP PS can, line by line and period by period. The <a href="https://www.gao.gov/products/gao-20-195g" target="_blank" rel="noopener">GAO Cost Estimating and Assessment Guide</a> sets out 12 steps for a reliable estimate, and its core advice applies here. Document the basis of each figure, then compare actuals against it continuously.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What are the common SAP PS cost planning mistakes?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Four mistakes show up again and again in SAP PS systems SaiSatwik inherits from other implementers.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Planning on too many WBS levels.</strong> Plans entered at three levels of the same branch double-count unless the planning profile is set to check them.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Treating the plan as the budget.</strong> Without a separate budget, availability control has nothing to check against.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Never updating the plan.</strong> A plan frozen at kick-off makes every variance report meaningless by month four.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Mixing methods without rules.</strong> Teams that use CJ40 on some projects and network costing on others cannot compare portfolios.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does cost planning work in SAP S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The core SAP PS cost planning methods still run in <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>. Easy Cost Planning and network costing are unchanged for most users. The bigger shift is in detailed financial planning, where SAP positions <a href="https://www.sap.com/products/data-cloud/cloud-analytics.html" target="_blank" rel="noopener">SAP Analytics Cloud</a> as the strategic planning tool.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Which classic planning transactions remain the right choice depends on your release and planning approach. Check the simplification notes for your target release on the <a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE" target="_blank" rel="noopener">SAP Help Portal</a> before migrating.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik approach SAP PS cost planning?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik designs cost planning around the decisions finance needs to make. That usually means one planning method per project type, a planning profile that enforces it, and a frozen baseline version kept apart from the working plan. Variance against that baseline then becomes the first line of every steering committee report.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Planning design is part of every SAP PS engagement the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a> runs, on ECC and on SAP S/4HANA. For the bigger picture of where planning sits in a project's life, start with the <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">SAP PS beginner guide</a>.</p>
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
<li><a href="https://saisatwik.com/sap-ps-tutorial-for-beginners/">SAP PS tutorial for beginners</a>. Planning in the context of the full lifecycle.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/how-to-create-a-project-in-sap-ps-cj20n/">How to create a project in SAP PS using CJ20N</a>. Where Easy Cost Planning lives.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-best-practices-for-capital-projects/">SAP EPPM best practices for capital projects</a>. Governance around plans, baselines and budgets.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS cost planning</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between cost planning and budgeting in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Cost planning records the expected cost of the work and can change freely. Budgeting records the approved amount, is changed only through supplements, returns or transfers, and is what availability control checks postings against. Plans come first; budgets are approved against them.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Which transaction is used for cost planning in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ40 handles overall planning by WBS element. CJR2 handles detailed planning by cost element and activity type. Easy Cost Planning runs inside CJ20N, and network costing calculates plan values automatically from network activities.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can I keep more than one cost plan for the same project?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. Plans are stored in plan versions. Version 0 is the working plan, and additional versions can hold an approved baseline, an optimistic scenario or a forecast. Comparing versions shows how the estimate moved over time.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is network costing better than manual cost planning?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It is more precise, because planned cost follows the activity schedule and procurement dates. It also needs a maintained network. For simple internal projects, overall planning is often enough and much cheaper to keep current.</p>
<!-- /wp:paragraph -->
`,
};
