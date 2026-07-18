/**
 * SaiSatwik blog post - SAP PS cluster spoke (step-by-step tutorial).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K09.
 * Primary keyword: SAP PS tutorial. Secondary: SAP PS training, learn SAP PS,
 * SAP PS step by step. Intent: informational (traffic engine), Priority 1,
 * geo-neutral. Anchors UP to the SAP PS hub (#5418) and laterally into the
 * SAP EPPM cluster. House style: plain, direct, no em dashes, no filler,
 * no fabricated stats or course codes. Every transaction code is real.
 */

module.exports = {
  title: 'SAP PS Tutorial for Beginners: Learn SAP Project System Step by Step',
  slug: 'sap-ps-tutorial-for-beginners',

  excerpt:
    'A step-by-step SAP PS tutorial for beginners: build a project in CJ20N, plan costs, set the budget, post actuals, monitor and settle. Includes the transaction codes worth learning first.',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP EPPM',
    'SAP S/4HANA',
    'Tutorial',
    'Beginner Guide',
    'For PMOs',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The fastest way to learn SAP PS (Project System) is to follow one project through its full lifecycle in a practice system: create the project and WBS in transaction CJ20N, add networks and activities for scheduling, plan costs with CJ40, set and release the budget with CJ30 and CJ32, post actual costs through timesheets and purchasing, then monitor with CJI3 and settle with CJ88. This SAP PS tutorial walks through exactly that sequence, step by step, with the transaction codes a beginner actually needs. If you want the concepts before the clicks, start with the <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">SAP PS beginner guide</a>, then come back here to do the work.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What should you know before starting this SAP PS tutorial?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>You need three things: basic SAP navigation (logging in, running a transaction code, using the SAP Fiori launchpad or SAP GUI), a grasp of the five SAP PS objects (project definition, WBS element, network, activity, milestone), and access to a practice system. The object model is covered in the <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">What is SAP PS guide</a>, so this tutorial assumes you know what a WBS element is and focuses on doing, not defining.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>You do not need to be a finance expert. But keep one principle in mind the whole way through: in SAP PS, every planning and posting step ultimately lands on a WBS element, and every WBS element ultimately settles to finance. If you understand that flow, every transaction in this tutorial makes sense.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP PS transaction codes does a beginner need?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS has hundreds of transactions, but beginners need about ten. Learn these and you can run a project end to end.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Transaction</th><th>Name</th><th>What You Use It For</th></tr></thead><tbody><tr><td><strong>CJ20N</strong></td><td>Project Builder</td><td>Create and change the project, WBS, networks, activities and milestones in one screen</td></tr><tr><td><strong>CN41N</strong></td><td>Project Structure Overview</td><td>View the whole project structure with statuses and dates</td></tr><tr><td><strong>CJ40</strong></td><td>Change Project Plan</td><td>Plan costs against WBS elements</td></tr><tr><td><strong>CJ30</strong></td><td>Change Original Budget</td><td>Enter the approved budget on the WBS</td></tr><tr><td><strong>CJ32</strong></td><td>Change Budget Release</td><td>Release budget so spending can begin</td></tr><tr><td><strong>CAT2</strong></td><td>Record Working Times</td><td>Book hours to a project activity or WBS element</td></tr><tr><td><strong>CJI3</strong></td><td>Actual Cost Line Items</td><td>See every actual cost posted to the project, line by line</td></tr><tr><td><strong>S_ALR_87013533</strong></td><td>Plan/Actual/Variance Report</td><td>Compare planned cost, budget and actuals per WBS element</td></tr><tr><td><strong>CJ88</strong></td><td>Settle Project</td><td>Settle project costs to their final receivers in finance</td></tr><tr><td><strong>CJ02</strong></td><td>Change Project Definition</td><td>Adjust project header data outside the Project Builder</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>In SAP S/4HANA these classic transactions still work, and SAP Fiori apps such as Project Builder and Project Cost Report cover the same ground with a modern interface. This tutorial uses the transaction codes because they behave the same in almost every system you will meet.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 1: How do you create a project and WBS in SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Open CJ20N, the Project Builder (covered click by click in the <a href="https://saisatwik.com/how-to-create-a-project-in-sap-ps-cj20n/">CJ20N project creation guide</a>). Create a new project definition and give it a clear identifier and description. The project definition is the header: it carries the start and finish dates, the organisational assignments (company code, plant, profit center) and the project profile, which controls default settings for everything created under it.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Under the project definition, create the WBS elements. Structure them the way cost responsibility breaks down, not the way tasks happen to be listed. A simple training structure works well: one level for the project, one level for phases (engineering, procurement, execution), and one level below only where a phase needs separate cost tracking. Flag each WBS element as a planning element and an account assignment element so it can carry planned and actual costs; the <a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS WBS guide</a> explains these operative indicators in full. WBS design discipline is the habit that separates good SAP PS implementations from messy ones, a point covered in depth in the <a href="https://saisatwik.com/sap-eppm-best-practices-for-capital-projects/">SAP EPPM best practices guide</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 2: How do you add networks and activities for scheduling?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Still in CJ20N, create a network under the project and add activities to it. Each activity is a piece of work with a duration, a work center if internal labour does it, and a cost estimate. Link the activities with relationships (finish-start is the most common) so the system can calculate the schedule.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Assign each activity to the WBS element it belongs to. This assignment is what connects time planning to cost planning: the activity carries the dates, the WBS element collects the money. Run scheduling from the Project Builder and check the calculated dates in CN41N. Add a milestone to a key activity, such as phase completion, so you have a progress marker to track later.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 3: How do you plan costs against the WBS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>With the structure in place, open CJ40 and enter planned costs on the WBS elements. For a first pass, plan overall values per element. In real projects, cost planning gets more detailed: activity costing rolls labour and material estimates up from the network, and Easy Cost Planning offers a form-based alternative. For this tutorial, overall planning per WBS element is enough to see the mechanics.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The point of planning in the system rather than a spreadsheet is comparability. The plan you enter here is the baseline that every later report compares actuals against, in the same structure, with no re-keying.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 4: How do you budget and release the project?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Planning says what the project should cost. Budgeting says what it is allowed to spend. Enter the approved budget per WBS element in CJ30, then release it in CJ32. If availability control is active in the budget profile, SAP PS now checks every posting against released budget and warns or blocks when spending approaches the limit.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Finally, release the project itself: in CJ20N, set the project (or individual WBS elements) to status REL. Released status is the gate that allows actual postings. This status logic matters in real operations: a project that is still in CRTD (created) status silently rejects cost postings, which is one of the first things to check when a posting fails.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 5: How do you post actual costs during execution?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Actual costs reach the project from the processes around it, which is the whole reason SAP PS beats standalone tools. In a practice system, post at least these three types:</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Time.</strong> Book hours to a project activity in CAT2. The hours are valued at the work center rate and land on the project as labour cost.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Procurement.</strong> Create a purchase order account-assigned to a WBS element. The commitment appears on the project immediately, and the actual cost posts at goods receipt.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Direct postings.</strong> Post a journal entry or material issue against the WBS element to represent costs that arrive straight from finance or the warehouse.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>Watch what happens after each posting: the cost appears on the WBS element without any interface run or import, because project and ledger share one platform. The integration architecture behind this is described in the <a href="https://saisatwik.com/sap-eppm-architecture-and-integration-overview/">SAP EPPM architecture overview</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Step 6: How do you monitor and settle the project?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Two reports cover most beginner monitoring needs. CJI3 lists every actual cost line item on the project, with drill-down to the source document. S_ALR_87013533 shows plan, budget and actual side by side per WBS element, which is the report project controllers live in. Check your milestone status in CN41N as work completes.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>At period end, run settlement with CJ88. Settlement moves the costs collected on WBS elements to their final receivers: a fixed asset for capital projects, a cost center for expense projects, or profitability for customer projects. When settlement is complete and no more postings are expected, set the project status to TECO (technically complete) and later CLSD (closed). You have now run the full lifecycle every production SAP PS project follows.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How long does it take to learn SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It depends on the depth you need, but the path is predictable. A practical plan looks like this:</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Stage</th><th>Focus</th><th>You Can Do</th></tr></thead><tbody><tr><td><strong>First weeks</strong></td><td>Objects, CJ20N, this tutorial's six steps in a sandbox</td><td>Build and run a simple project end to end</td></tr><tr><td><strong>First months</strong></td><td>Cost planning depth, budgeting, settlement rules, reporting</td><td>Support a live project as a junior consultant or key user</td></tr><tr><td><strong>First year</strong></td><td>Configuration (project profiles, budget profiles, settlement profiles), integration with MM, CO and SD</td><td>Design and configure SAP PS for a business</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>The single biggest accelerator is repetition in a practice system. Running the six steps above five times teaches more than reading any amount of documentation, because the errors you hit (posting blocked by status, budget exceeded, settlement rule missing) are the exact errors real projects produce.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Where can you practice and get SAP PS training?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>For official material, the <a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE" target="_blank" rel="noopener">SAP Help Portal</a> documents Project System inside SAP S/4HANA, and <a href="https://learning.sap.com/" target="_blank" rel="noopener">SAP Learning</a> offers structured courses and certification paths for project management in <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>. For hands-on access, SAP offers trial and sandbox options, and most employers running SAP can provide a quality-system login for practice.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>For teams rather than individuals, structured enablement during an implementation beats generic courses. SaiSatwik runs SAP PS implementations with key-user training built into the project, so the people who will run the system learn it on their own project structures. That work is part of the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Related SaiSatwik Reading</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Build on this tutorial with the rest of the SAP PS and SAP EPPM series:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">What is SAP PS (Project System)? A beginner guide</a>. The concepts behind every step in this tutorial.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-modules-explained-ps-ppm-im-cpm-cats/">SAP EPPM modules explained: PS, PPM, IM, CPM and CATS</a>. Where SAP PS sits among the five modules.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-best-practices-for-capital-projects/">SAP EPPM best practices for capital projects</a>. The WBS and budgeting discipline behind reliable numbers.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-in-sap-s4hana-what-changed/">SAP EPPM in SAP S/4HANA: what changed</a>. How the S/4HANA move reshaped the project modules.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about learning SAP PS</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is SAP PS hard to learn for a beginner?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The object model (project definition, WBS, network, activity, milestone) takes a few days to understand, and the six-step lifecycle in this tutorial can be practised in a week. The genuinely hard part is the finance integration: budgeting, commitments and settlement. Beginners who learn the cost flow early find the rest of the module straightforward.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Do I need SAP S/4HANA access to learn SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>To learn properly, yes, you need hands-on access to some SAP system: an employer quality system, an SAP trial, or a training sandbox. Reading alone does not build the muscle memory. The classic transactions behave almost identically in SAP ECC and SAP S/4HANA, so access to either works for the fundamentals.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is there an SAP PS certification?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP offers certification for project management in SAP S/4HANA through SAP Learning, covering Project System alongside the wider portfolio and project management scope. Certification helps consultants signal credibility, but employers weight hands-on project experience more heavily than the exam.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is CJ20N in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ20N is the Project Builder, the central transaction in SAP PS. It creates and maintains the entire project structure (project definition, WBS elements, networks, activities and milestones) in a single screen, which is why every SAP PS tutorial starts there.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between SAP PS training and an SAP PS tutorial?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A tutorial like this one teaches the working sequence: build, plan, budget, execute, monitor, settle. Formal SAP PS training goes wider, covering configuration, integration with MM, CO and SD, and edge cases like assembly processing. Do the tutorial first; it makes formal training far easier to absorb.</p>
<!-- /wp:paragraph -->
`,
};
