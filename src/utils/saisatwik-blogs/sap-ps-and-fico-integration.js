/**
 * SaiSatwik blog post - SAP PS cluster spoke (FICO integration).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K18.
 * Primary keyword: SAP PS FICO integration. Intent: informational (traffic
 * engine), Priority 2, geo-neutral. Anchors UP to the SAP PS hub (#5418) and
 * laterally to the cost planning, budgeting, results analysis and settlement
 * spokes. House style: plain, direct, no em dashes, no filler, no invented
 * transactions.
 */

module.exports = {
  title: 'SAP PS and FICO Integration: How Projects Meet Finance',
  slug: 'sap-ps-and-fico-integration',

  excerpt:
    'How SAP PS integrates with FI and CO: org structure, cost elements, activity rates, overheads, the period-end close, assets and the S/4HANA Universal Journal.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-19T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'Manufacturing',
    'For CFOs',
    'Beginner Guide',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS FICO integration means every cost and revenue on a project is also a posting in SAP Finance (FI) and Controlling (CO). WBS elements and network activities are CO objects, so invoices, labour confirmations, goods issues and overheads land on them with the same cost elements finance uses. At period end, results analysis and settlement carry project values to cost centers, assets and profitability analysis. In SAP S/4HANA, all of it sits in one Universal Journal. SaiSatwik designs SAP PS FICO integration so project managers and controllers read the same numbers.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does SAP PS FICO integration mean?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> SAP PS FICO integration is the set of links that make SAP Project System objects part of the financial and controlling structure. A WBS element is not a separate ledger. It is an account assignment object inside CO, tied to a company code, a controlling area and a profit center.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That design is why SAP PS reports and finance reports agree. A supplier invoice posted to a WBS element updates the G/L, the project's actual costs and the profit center at the same moment. There is no overnight interface to reconcile.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which FICO settings does every SAP PS project depend on?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Before a single project is created, several FICO structures must exist. Missing any of them stops the project definition from saving. The table shows what each one gives a project.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>FICO object</th><th>What it gives the project</th></tr></thead><tbody><tr><td><strong>Company code</strong></td><td>The legal entity whose books the project posts to</td></tr><tr><td><strong>Controlling area</strong></td><td>The CO scope for cost collection and settlement</td></tr><tr><td><strong>Profit center</strong></td><td>Segment and margin reporting for the project</td></tr><tr><td><strong>Cost elements</strong></td><td>The categories of cost and revenue on every posting</td></tr><tr><td><strong>Activity types and rates</strong></td><td>The price of internal labour and machine time</td></tr><tr><td><strong>Costing sheet</strong></td><td>The rules that calculate overhead on project costs</td></tr></tbody></table><figcaption class="wp-element-caption">FICO building blocks of SAP PS</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do project costs flow from SAP PS into FICO?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Costs reach a project through four main routes. Each one posts to FI and CO at the same time, with the WBS element or network activity as the account assignment.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Supplier invoices and direct postings.</strong> An invoice or journal entry carrying a WBS element posts the expense and the project cost together.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Labour confirmations.</strong> Hours confirmed on network activities are valued at the activity rate and credit the work center's cost center.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Goods issues.</strong> Material issued to a project posts its value from inventory to the project.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Overheads.</strong> CJ44 for one project or CJ45 collectively applies the costing sheet to add overhead.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Commitments matter as well. Open purchase orders show on the project as committed cost, which is what <a href="https://saisatwik.com/budgeting-and-availability-control-in-sap-ps/">availability control in SAP PS</a> checks against the budget.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is the SAP PS period-end close sequence?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The SAP PS period-end close follows a fixed order, because each step uses values the previous step produced. Finance teams usually run it as one scheduled job chain.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Complete actual postings.</strong> Invoices, confirmations and goods issues for the period.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Calculate overhead.</strong> CJ45 applies costing sheets across projects.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Run results analysis.</strong> KKAJ values customer projects. See the <a href="https://saisatwik.com/results-analysis-in-sap-ps-explained/">guide to results analysis in SAP PS</a>.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Settle.</strong> CJ8G moves costs and results to receivers. The <a href="https://saisatwik.com/sap-ps-settlement-explained/">SAP PS settlement guide</a> covers rules and receivers.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Report.</strong> Plan, actual and commitment reports per project and per profit center.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do capital projects connect SAP PS to Asset Accounting?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Capital projects add Asset Accounting (FI-AA) to the integration. An investment profile on the WBS element creates an asset under construction when the element is released. Monthly settlement builds its value, and final settlement capitalises the completed fixed assets.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Large programmes often add SAP Investment Management above the projects to govern the capital budget. The <a href="https://saisatwik.com/sap-investment-management-vs-sap-eppm/">comparison of SAP Investment Management and SAP EPPM</a> explains where that layer fits.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What changed for SAP PS FICO integration in SAP S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The biggest change is the Universal Journal. In <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>, FI and CO postings land in one table, ACDOCA. Project costs, G/L lines and profitability data sit in the same line item.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Cost elements also changed. They are now G/L accounts with a cost element category, maintained in the chart of accounts instead of a separate CO master. Migration teams need to plan for this early, since SAP has set mainstream maintenance for ECC to end in 2027, with optional extended maintenance to 2030, according to <a href="https://news.sap.com/2020/02/sap-s4hana-maintenance-2040-clarity-choice-sap-business-suite-7/" target="_blank" rel="noopener">SAP's maintenance announcement</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Why does tight PS and FICO integration matter?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Disconnected project and finance data hides overruns until they are expensive. <a href="https://www.mckinsey.com/capabilities/tech-and-ai/our-insights/delivering-large-scale-it-projects-on-time-on-budget-and-on-value" target="_blank" rel="noopener">McKinsey and Oxford research</a> found large IT projects run 45 percent over budget on average. Integrated cost data does not prevent overruns, but it surfaces them the week they start.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik approach SAP PS FICO integration?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik runs SAP PS and FICO design as one workstream, not two teams passing documents. Project profiles, settlement profiles, costing sheets and profit center derivation are agreed in the same workshops with controllers in the room.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That approach is standard in every engagement from the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>, on ECC and SAP S/4HANA alike. For the project side of the picture, start with the <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">SAP PS beginner guide</a>.</p>
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
<li><a href="https://saisatwik.com/sap-ps-project-cost-planning-guide/">SAP PS project cost planning guide</a>. How plans feed CO reporting.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-architecture-and-integration-overview/">SAP EPPM architecture and integration overview</a>. The wider integration map.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ecc-to-s-4hana-migration-guide-benefits/">SAP ECC to S/4HANA migration guide</a>. Planning the move to the Universal Journal.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS FICO integration</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is a WBS element a cost object in SAP CO?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. A WBS element with the account assignment indicator is a CO account assignment object. Costs, revenues and commitments post to it, and it settles to final receivers at period end.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Which transaction calculates overhead on SAP PS projects?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ44 calculates overhead for an individual project and CJ45 runs it collectively. Both apply the costing sheet assigned to the WBS element or network.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Do SAP PS and FI need reconciliation?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Not in the usual sense. Postings to projects are FI and CO postings at the same time. In SAP S/4HANA they share one line item in the Universal Journal, so project and ledger values cannot drift apart.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Who should own SAP PS FICO integration design?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Both the project controlling lead and the finance controller. Settlement, overhead and revenue recognition choices affect the financial statements, so finance must sign them off, while the project side owns structure and planning.</p>
<!-- /wp:paragraph -->
`,
};
