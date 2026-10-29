/**
 * SaiSatwik blog post - SAP PS cluster spoke (settlement).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K17.
 * Primary keyword: SAP PS settlement. Intent: informational (traffic engine),
 * Priority 2, geo-neutral. Anchors UP to the SAP PS hub (#5418) and laterally
 * to the results analysis and budgeting spokes. House style: plain, direct,
 * no em dashes, no filler, no invented transactions.
 */

module.exports = {
  title: 'SAP PS Settlement Explained: Rules, Receivers and Steps',
  slug: 'sap-ps-settlement-explained',

  excerpt:
    'How SAP PS settlement works: settlement rules, receivers, the settlement profile, CJ88 and CJ8G, assets under construction and period-end order.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-18T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'Oil and Gas',
    'For CFOs',
    'Beginner Guide',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS settlement moves costs collected on WBS elements and networks to their final receivers, such as a cost center, a fixed asset, an asset under construction, a G/L account or profitability analysis. A settlement rule on each object says where costs go and in what share. A settlement profile in configuration says which receivers are allowed. Settlement runs at period end with CJ88 for one project or CJ8G for many. SaiSatwik designs SAP PS settlement so project costs land in the right place in the ledger without manual journal entries.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is settlement in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> settlement in SAP PS is the transfer of costs, and revenues where relevant, from a project object to one or more receivers defined in its settlement rule. A project collects cost temporarily. Settlement sends it to where it belongs for good.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>A WBS element is a holding place, not a destination. A maintenance project settles to the plant cost center that owns the equipment. A capital project settles to an asset. A customer project settles its results to profitability analysis. Without settlement, costs sit on projects and the financial statements never see them in the right lines.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which receivers can SAP PS settle to?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS can settle to several receiver types, and the settlement profile limits which ones a project type may use. The right receiver depends on what the project produces.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Receiver</th><th>Typical project</th><th>What happens to the cost</th></tr></thead><tbody><tr><td><strong>Cost center</strong></td><td>Internal, overhead or maintenance projects</td><td>Becomes operating expense of that department</td></tr><tr><td><strong>Asset under construction</strong></td><td>Capital projects during build</td><td>Accumulates as a balance sheet asset while work continues</td></tr><tr><td><strong>Fixed asset</strong></td><td>Capital projects at completion</td><td>Capitalised and depreciated from the in-service date</td></tr><tr><td><strong>Profitability segment</strong></td><td>Customer projects</td><td>Feeds margin reporting by customer, product or region</td></tr><tr><td><strong>G/L account</strong></td><td>Special cases</td><td>Posts directly to a ledger account</td></tr></tbody></table><figcaption class="wp-element-caption">Common SAP PS settlement receivers</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does a settlement rule contain?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A settlement rule is attached to each WBS element or network that needs to settle. It holds one or more distribution rules, and each distribution rule names a receiver, a share and a settlement type.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Receiver.</strong> The object that will take the cost, such as a cost center or an asset.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Share.</strong> A percentage, an equivalence number or a fixed amount.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Settlement type.</strong> Periodic settlement (PER) moves the period's costs. Full settlement (FUL) moves everything still open.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Settlement rules can be entered by hand in CJ20N or generated in bulk with a strategy, using CJB2 for one project or CJB1 collectively. Generated rules keep a large portfolio consistent and save hours each month.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do capital projects settle to assets?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Capital projects settle in two stages, and this is where SAP PS settlement gets most attention from auditors. An investment profile on the WBS element tells SAP PS to create an asset under construction when the element is released.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>During the build.</strong> Periodic settlement moves costs from the WBS element to the asset under construction each month.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>At completion.</strong> Line item settlement rules, maintained in CJIC, split the accumulated cost across the final fixed assets.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Final settlement.</strong> A full settlement capitalises the costs on the fixed assets, and depreciation starts from the capitalisation date.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Accounting rules decide which costs may be capitalised. <a href="https://www.ifrs.org/issued-standards/list-of-standards/ias-16-property-plant-and-equipment/" target="_blank" rel="noopener">IAS 16</a> covers property, plant and equipment, and <a href="https://www.ifrs.org/issued-standards/list-of-standards/ias-23-borrowing-costs/" target="_blank" rel="noopener">IAS 23</a> covers interest on qualifying assets. SAP PS applies the split, but finance has to define it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does the settlement profile control?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The settlement profile, maintained in OKO7, is the configuration behind every SAP PS settlement. It is assigned through the project profile.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Allowed receivers.</strong> Which receiver types may appear in settlement rules.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Allocation structure.</strong> Which cost elements are used to settle which original costs.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Default object type.</strong> The receiver type proposed when a rule is created.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Settlement requirement.</strong> Whether objects must be fully settled before they can be closed.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Where does settlement sit in the SAP PS period-end close?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Settlement is the last major step of the SAP PS period-end close. It runs after overhead calculation and, on customer projects, after results analysis. Run it earlier and the ledger misses the period's overhead and revenue adjustments.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The <a href="https://saisatwik.com/results-analysis-in-sap-ps-explained/">guide to results analysis in SAP PS</a> explains the step that comes just before settlement on customer projects. Once a project is complete and fully settled, it can move to technically completed and then closed status.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What goes wrong with SAP PS settlement?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Settlement errors are among the most common period-end tickets SaiSatwik handles for SAP PS clients. Four causes account for most of them.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Missing settlement rule.</strong> New WBS elements were released without one, so costs pile up and block closing.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Receiver locked or closed.</strong> The cost center or asset in the rule is no longer valid for posting.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Allocation structure gaps.</strong> A new cost element was never added, so part of the cost cannot settle.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Settling before results analysis.</strong> Customer projects post incomplete revenue figures to the ledger.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik set up SAP PS settlement?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik designs settlement backwards from the financial statements. Finance first defines where each project type's costs should end up. Settlement profiles, allocation structures and rule strategies are then built to match, so project teams never type a settlement rule by hand.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The design runs on <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> and ECC and is part of every engagement from the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>. Capital projects often pair it with the controls in <a href="https://saisatwik.com/budgeting-and-availability-control-in-sap-ps/">budgeting and availability control in SAP PS</a>.</p>
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
<li><a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">What is SAP PS? A beginner guide</a>. Settlement in the context of the full module.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS Work Breakdown Structure explained</a>. Designing the elements that settle.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-investment-management-vs-sap-eppm/">SAP Investment Management vs SAP EPPM</a>. Where capital project governance sits.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-and-fico-integration/">SAP PS and FICO integration</a>. The full period-end sequence settlement belongs to.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS settlement</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between CJ88 and CJ8G?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ88 settles one project, WBS element or network at a time. CJ8G settles many projects in one collective run, usually scheduled as part of the period-end close. Both use the same settlement rules and profiles.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Why does SAP PS settlement fail with no settlement rule?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The WBS element or network carries costs but has no settlement rule. Add one in CJ20N, or generate rules with CJB2 or CJB1 using a settlement strategy, then run settlement again.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between periodic and full settlement?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Periodic settlement transfers the costs of the current period only. Full settlement transfers all costs not yet settled, regardless of period. Capital projects use full settlement at completion to capitalise the final assets.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can a project be closed before it is fully settled?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Normally no. If the settlement profile requires full settlement, SAP PS blocks the closed status while a balance remains on the object. Settle the balance first, then close.</p>
<!-- /wp:paragraph -->
`,
};
