/**
 * SaiSatwik blog post - SAP PS cluster spoke (networks and activities).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K12.
 * Primary keyword: SAP PS network activities. Intent: informational (traffic
 * engine), Priority 2, geo-neutral. Anchors UP to the SAP PS hub (#5418) and
 * laterally to the tutorial, WBS and CJ20N spokes. House style: plain, direct,
 * no em dashes, no filler, no invented transactions.
 */

module.exports = {
  title: 'SAP PS Network and Activities Explained: A Practical Guide',
  slug: 'sap-ps-network-and-activities-explained',

  excerpt:
    'How networks and activities work in SAP PS: activity types, relationships, scheduling, costing and how they link to the WBS. With tables and common mistakes.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-13T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'Engineering and Construction',
    'For PMOs',
    'Beginner Guide',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>An SAP PS network is the scheduling and resource layer of SAP Project System. It holds activities (the actual units of work), the relationships between them, and the milestones that mark progress. The WBS answers "what are we delivering and where do costs sit". The network answers "who does what, in which order, and when". Each activity is assigned to a WBS element, so its planned and actual costs roll up the project structure. SaiSatwik designs networks this way on every SAP PS rollout: thin enough to maintain, detailed enough to schedule.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What is a network in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> a network in SAP PS is an object that models the sequence of work in a project. It contains activities, the relationships that chain them together, and the dates the system calculates from both. A project can carry one network or many. Large capital projects often split networks by phase, contractor or site.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Networks are optional. A project that only needs cost collection can live on WBS elements alone. Once dates, dependencies or capacity matter, the network becomes the place where the plan lives. The <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">SAP PS beginner guide</a> shows where networks sit next to the project definition and the WBS.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How does a network differ from the WBS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The WBS is the hierarchical breakdown of deliverables and the home of budgets. The network is a flat, time-based plan of the work itself. Think of the WBS as the filing cabinet for money and the network as the calendar for people and materials.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Aspect</th><th>WBS element</th><th>Network activity</th></tr></thead><tbody><tr><td><strong>Main purpose</strong></td><td>Structure, cost collection, budget</td><td>Sequence, dates, resources</td></tr><tr><td><strong>Shape</strong></td><td>Hierarchy (levels)</td><td>Logic chain (relationships)</td></tr><tr><td><strong>Carries budget</strong></td><td>Yes</td><td>No, costs roll up to the assigned WBS element</td></tr><tr><td><strong>Drives procurement</strong></td><td>Rarely directly</td><td>Yes, via external activities and material components</td></tr><tr><td><strong>Typical owner</strong></td><td>Project controller</td><td>Planner or scheduler</td></tr></tbody></table><figcaption class="wp-element-caption">WBS element vs network activity in SAP PS</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which activity types does an SAP PS network use?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS networks use four activity types, and choosing the right one decides how cost and procurement behave. Picking the wrong type is the most common modelling error in the first month of a rollout.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Internal processing activity.</strong> Work done by your own people. It points to a work center and an activity type, so planned hours become planned cost at the work center rate.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>External processing activity.</strong> Work bought from a supplier. It creates a purchase requisition, and the cost arrives through the purchase order and invoice.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>General costs activity.</strong> A planned amount that does not fit either category, such as travel, permits or insurance.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Service activity.</strong> Subcontracted work described through service specifications, used where procurement runs on service entry sheets.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Activities can also carry activity elements. These are sub-items with the same types, useful when one activity mixes in-house labour and a bought-in service.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do relationships and scheduling work in an SAP PS network?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Relationships tell SAP PS which activity depends on which. The scheduler then calculates earliest and latest dates for every activity, and the float between them. Four relationship types exist, and finish-start covers most real plans.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Finish-start (FS).</strong> The successor starts after the predecessor finishes. Pour the foundation, then erect the steel.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Start-start (SS).</strong> Both start together, or with a time lag. Survey and site clearing often run side by side.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Finish-finish (FF).</strong> Both must finish together. Testing ends when documentation ends.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Start-finish (SF).</strong> Rarely used. The successor cannot finish until the predecessor starts.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Scheduling runs in CJ20N or through overall network scheduling. The result is a critical path: the chain of activities with zero float. Delay any of them and the finish date moves. The <a href="https://www.gao.gov/products/gao-16-89g" target="_blank" rel="noopener">GAO Schedule Assessment Guide</a> treats a logically linked, critical-path schedule as a core best practice, and SAP PS networks are built to produce one.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do networks drive cost planning and procurement in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Networks are where most bottom-up cost planning in SAP PS happens. Each activity carries planned work, planned purchases or a planned amount. Network costing values them and posts the result as planned cost on the assigned WBS element. The <a href="https://saisatwik.com/sap-ps-project-cost-planning-guide/">SAP PS cost planning guide</a> compares it with the other planning methods.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Material components attached to activities drive procurement too. A component can trigger a reservation from stock or a purchase requisition, and the dates follow the activity schedule. Get the schedule right and buyers see real need dates. Get it wrong and the warehouse fills with steel nobody can use for six weeks.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Header-assigned or activity-assigned: how should networks link to the WBS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS lets you assign a whole network to one WBS element (header assignment) or assign each activity to its own element (activity assignment). Activity assignment is the common choice on capital projects because cost lands exactly where the work belongs.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Header assignment suits small, single-deliverable projects. It keeps maintenance light but blurs cost reporting once the project grows. SaiSatwik usually recommends activity assignment, with network templates so planners do not assign hundreds of activities by hand. The <a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS Work Breakdown Structure guide</a> covers how to shape the WBS those activities point to.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What mistakes do teams make with SAP PS networks?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Most network problems trace back to modelling too much or too little. These four come up on nearly every project SaiSatwik reviews.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Thousands of tiny activities.</strong> Nobody confirms them, so progress data dies within a month. Model work at the level people actually report.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Missing relationships.</strong> Activities with no predecessor float freely, and the critical path becomes fiction.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Wrong activity type.</strong> A subcontract modelled as internal work never creates a purchase requisition.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>No templates.</strong> Each planner builds networks differently, and portfolio reporting cannot compare like with like.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>The stakes are real. <a href="https://www.mckinsey.com/capabilities/operations/our-insights/imagining-constructions-digital-future" target="_blank" rel="noopener">McKinsey research on construction</a> found large projects typically take 20 percent longer than scheduled and run up to 80 percent over budget. A clean network will not fix that alone, but a broken one hides the slippage until it is too late to act.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik set up SAP PS networks?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik starts with the reporting question, not the configuration. Which dates does the steering committee review? Which activities do site teams confirm? The network is then built to that grain, with standard networks as templates and activity types mapped to how each client actually buys and staffs work.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The same design runs on <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> and on ECC, which matters for clients mid-migration. It is part of every engagement the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a> delivers. Reference material lives on the <a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE" target="_blank" rel="noopener">SAP Help Portal</a>.</p>
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
<li><a href="https://saisatwik.com/sap-ps-tutorial-for-beginners/">SAP PS tutorial for beginners</a>. The full project lifecycle, step by step.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/how-to-create-a-project-in-sap-ps-cj20n/">How to create a project in SAP PS using CJ20N</a>. Where networks are built in practice.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-modules-explained-ps-ppm-im-cpm-cats/">SAP EPPM modules explained</a>. Where SAP PS fits among its sibling modules.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/earned-value-management-in-sap-ps/">Earned value management in SAP PS</a>. How confirmed activities feed progress analysis.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS networks and activities</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is a network mandatory in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>No. A project can run on WBS elements only if it just needs cost collection and budgeting. Add a network when you need scheduling, dependencies, capacity planning or procurement driven by activity dates.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between an activity and an activity element?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>An activity is a unit of work in the network with its own dates and relationships. An activity element hangs under an activity and adds detail, such as an external service inside mostly internal work. Elements take their dates from the parent activity.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Which transaction creates a network in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Most teams create networks inside CJ20N, the Project Builder. The dedicated transactions CN21, CN22 and CN23 create, change and display networks outside it. Standard networks used as templates are maintained with CN01, CN02 and CN03.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How do network activities affect project cost?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Network costing values each activity's planned work, purchases or amounts and writes planned cost to the assigned WBS element. Actual costs from confirmations, goods issues and invoices follow the same path, so the WBS shows plan and actual side by side.</p>
<!-- /wp:paragraph -->
`,
};
