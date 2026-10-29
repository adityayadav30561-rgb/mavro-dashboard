/**
 * SaiSatwik blog post - SAP PS cluster spoke (MM and SD integration).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K19.
 * Primary keyword: SAP PS MM SD integration. Intent: informational (traffic
 * engine), Priority 3, geo-neutral. Anchors UP to the SAP PS hub (#5418) and
 * laterally to the networks, milestone billing and FICO spokes. House style:
 * plain, direct, no em dashes, no filler, no invented transactions.
 */

module.exports = {
  title: 'SAP PS Integration with MM and SD: Procurement to Billing',
  slug: 'sap-ps-integration-with-mm-and-sd',

  excerpt:
    'How SAP PS integrates with MM and SD: purchase requisitions from activities, project stock, goods issues, sales orders, assembly processing and billing.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-20T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'Engineering and Construction',
    'For COOs',
    'Beginner Guide',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS integration with MM and SD connects a project to the purchasing, inventory and sales processes around it. On the MM side, external activities and material components create purchase requisitions and reservations, purchase orders are assigned to WBS elements, and materials can be held as project stock. On the SD side, a sales order item links to a billing WBS element, so revenue, billing and project costs meet on one project. SaiSatwik designs SAP PS integration with MM and SD so buyers, store teams and billing clerks all work from project dates.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does SAP PS integration with MM and SD cover?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> SAP PS integration with MM (Materials Management) and SD (Sales and Distribution) is the set of document flows that let a project trigger procurement, consume inventory and generate customer billing. The project becomes the driver of those documents, not a passive cost bucket.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Consider an engineering firm building a pumping station. The network says the pumps are needed in week 18. MM raises the requisition with that date. SD bills the customer when the pumps are commissioned. Every step carries the WBS element, so the project shows cost, commitment and revenue together.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SAP PS integrate with MM?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS reaches MM through network activities and material components. The type of activity and the procurement settings on each component decide what document SAP creates.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>External processing activities.</strong> Create a purchase requisition for bought-in work. The <a href="https://saisatwik.com/sap-ps-network-and-activities-explained/">SAP PS networks and activities guide</a> explains activity types.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Material components.</strong> Assigned to activities, they create reservations against stock or purchase requisitions for direct procurement.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Purchase orders.</strong> Account assigned to the WBS element or network, so the commitment shows on the project at once.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Goods issues.</strong> Materials issued to a project post their value as actual cost on the WBS element.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is project stock in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Project stock is inventory reserved for one WBS element. Material bought for a project goes into this special stock and cannot be used elsewhere without a deliberate transfer. Project-driven MRP, run with MD51, plans requirements for one project in isolation.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Project stock suits engineered-to-order equipment and high-value items. Common, cheap materials usually stay in plant stock and are simply reserved, which keeps inventory flexible across projects.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SAP PS integrate with SD?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS reaches SD through the sales order. A sales order item points to a WBS element flagged as a billing element, and that link carries revenue and billing back to the project.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Sales order to WBS link.</strong> Revenue from invoices posts to the billing element.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Assembly processing.</strong> Saving a sales order can create a project from a standard template automatically, with dates and quantities from the order.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Milestone billing.</strong> Billing plan dates are released by project milestones. See <a href="https://saisatwik.com/milestone-billing-in-sap-ps/">milestone billing in SAP PS</a>.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Resource-related billing.</strong> A dynamic item processor (DIP) profile turns actual project costs into billing requests.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Delivery from project.</strong> CNS0 creates deliveries of project materials to the customer site.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What triggers each integration document?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The table maps the common SAP PS events to the MM or SD document they produce. It is a useful checklist when testing an implementation end to end.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Project event</th><th>Module</th><th>Resulting document</th></tr></thead><tbody><tr><td><strong>External activity released</strong></td><td>MM</td><td>Purchase requisition for the service</td></tr><tr><td><strong>Material component with direct procurement</strong></td><td>MM</td><td>Purchase requisition for the material</td></tr><tr><td><strong>Material component from stock</strong></td><td>MM</td><td>Reservation, then goods issue to the project</td></tr><tr><td><strong>Purchase order saved</strong></td><td>MM</td><td>Commitment on the WBS element</td></tr><tr><td><strong>Sales order saved with assembly processing</strong></td><td>SD</td><td>Project created from template</td></tr><tr><td><strong>Billing milestone reached</strong></td><td>SD</td><td>Billing block lifted, invoice due</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS events and the MM or SD documents they create</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Why does procurement timing matter on projects?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Late material is one of the most common reasons projects slip. <a href="https://www.mckinsey.com/capabilities/operations/our-insights/imagining-constructions-digital-future" target="_blank" rel="noopener">McKinsey reports</a> that large projects typically finish 20 percent later than scheduled. When requisitions carry real activity dates, buyers can see slippage risk weeks earlier than they would from a spreadsheet.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Scheduling discipline sits underneath that. The <a href="https://www.gao.gov/products/gao-16-89g" target="_blank" rel="noopener">GAO Schedule Assessment Guide</a> stresses logically linked activities, and procurement dates are only as good as that logic.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What changed for MM and SD integration in SAP S/4HANA?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The project flows themselves work the same in <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>. The changes come from around them. Customers and suppliers become business partners. MRP runs faster through MRP Live. Many purchasing and sales screens gain SAP Fiori apps.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Migration teams should test project-driven purchasing and billing as full scenarios. The <a href="https://saisatwik.com/sap-ecc-vs-sap-s-4hana/">SAP ECC vs SAP S/4HANA comparison</a> lists the wider platform changes.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik design SAP PS integration with MM and SD?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik runs integration design as cross-module scenarios, not module silos. A typical scenario walks one project from sales order through procurement, goods issue, confirmation, billing and settlement, with PS, MM, SD and FICO consultants testing together.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That is standard in every engagement from the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>. For the finance side of the same flows, see <a href="https://saisatwik.com/sap-ps-and-fico-integration/">SAP PS and FICO integration</a>, and for the module basics, the <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">SAP PS beginner guide</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS integration with MM and SD</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How does a network activity create a purchase requisition?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>An external processing activity, or a material component set for direct procurement, generates a purchase requisition when the network is released or saved, depending on configuration. The requisition carries the activity's dates and account assignment.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between project stock and plant stock?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Project stock is reserved for a specific WBS element and valued on that project. Plant stock is general inventory available to any consumer. Project stock suits engineered or high-value items; common materials usually stay in plant stock.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can a sales order create a project automatically?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes, through assembly processing. When the sales order item is saved, SAP creates a project or network from a standard template, copying dates and quantities from the order. It suits repeatable engineer-to-order products.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How does revenue from SD reach the SAP PS project?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The sales order item is assigned to a WBS element flagged as a billing element. When the invoice posts, revenue lands on that element, where results analysis and settlement process it at period end.</p>
<!-- /wp:paragraph -->
`,
};
