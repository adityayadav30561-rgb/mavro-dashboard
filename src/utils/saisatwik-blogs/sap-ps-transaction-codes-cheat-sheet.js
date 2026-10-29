/**
 * SaiSatwik blog post - SAP PS cluster spoke (transaction code cheat sheet).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K21.
 * Primary keyword: SAP PS transaction codes. Intent: informational (traffic
 * engine), Priority 1, geo-neutral. Anchors UP to the SAP PS hub (#5418) and
 * laterally to every earlier spoke whose transactions it lists. House style:
 * plain, direct, no em dashes, no filler. Only well-established standard
 * transactions are listed; nothing invented.
 */

module.exports = {
  title: 'SAP PS Transaction Codes Cheat Sheet (by Project Phase)',
  slug: 'sap-ps-transaction-codes-cheat-sheet',

  excerpt:
    'SAP PS transaction codes grouped by phase: structure, planning, budgeting, execution, period-end, reporting and configuration, plus the system statuses to know.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-22T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'For PMOs',
    'Cheat Sheet',
    'Tutorial',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The most used SAP PS transaction codes are CJ20N (Project Builder) for building projects, CJ40 and CJR2 for cost planning, CJ30 and CJ32 for budgets, CN25 for confirmations, CJ88 and CJ8G for settlement, and CN41N and CJI3 for reporting. This cheat sheet groups the standard SAP Project System transactions by project phase, so you can find the right one for the job in front of you. It also lists the system statuses that decide what each transaction allows. SaiSatwik consultants use the same grouping when training key users.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How should you use this SAP PS transaction codes cheat sheet?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS transaction codes make more sense grouped by the stage of a project than in alphabetical order. Each table below covers one phase. All codes listed are standard SAP Project System transactions that run in ECC and SAP S/4HANA.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>If you are new to the module, read the <a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">SAP PS beginner guide</a> first. It explains the objects these transactions work on. Your system may also have custom Z transactions; check with your SAP team before relying on them.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP PS transaction codes build the project structure?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Structure transactions create and change project definitions, WBS elements, networks and templates. CJ20N covers almost all of it in one screen, as the <a href="https://saisatwik.com/how-to-create-a-project-in-sap-ps-cj20n/">CJ20N walkthrough</a> shows.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Transaction</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>CJ20N</strong></td><td>Project Builder: create and change the whole project</td></tr><tr><td><strong>CJ06 / CJ07 / CJ08</strong></td><td>Create, change, display project definition</td></tr><tr><td><strong>CJ01 / CJ02 / CJ03</strong></td><td>Create, change, display work breakdown structure</td></tr><tr><td><strong>CJ11 / CJ12 / CJ13</strong></td><td>Create, change, display WBS element</td></tr><tr><td><strong>CN21 / CN22 / CN23</strong></td><td>Create, change, display network</td></tr><tr><td><strong>CJ2B / CJ2C</strong></td><td>Change, display project planning board</td></tr><tr><td><strong>CJ91 / CJ92 / CJ93</strong></td><td>Create, change, display standard WBS (template)</td></tr><tr><td><strong>CN01 / CN02 / CN03</strong></td><td>Create, change, display standard network (template)</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS structure transactions</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP PS transaction codes handle planning and budgeting?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Planning transactions record expected cost. Budget transactions record approved money. The <a href="https://saisatwik.com/sap-ps-project-cost-planning-guide/">SAP PS cost planning guide</a> and the guide to <a href="https://saisatwik.com/budgeting-and-availability-control-in-sap-ps/">budgeting and availability control</a> explain when to use each.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Transaction</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>CJ40 / CJ41</strong></td><td>Change, display overall (structure) cost plan</td></tr><tr><td><strong>CJR2 / CJR3</strong></td><td>Change, display cost element and activity input plan</td></tr><tr><td><strong>CJ30 / CJ31</strong></td><td>Change, display original budget</td></tr><tr><td><strong>CJ32 / CJ33</strong></td><td>Change, display budget release</td></tr><tr><td><strong>CJ34</strong></td><td>Budget transfer between WBS elements or projects</td></tr><tr><td><strong>CJBV</strong></td><td>Activate availability control</td></tr><tr><td><strong>CJBN</strong></td><td>Reconstruct availability control</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS planning and budgeting transactions</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP PS transaction codes are used during execution?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Execution transactions record what actually happens on the project: work done, materials needed and deliveries made.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Transaction</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>CN25</strong></td><td>Confirm a network activity</td></tr><tr><td><strong>CN27</strong></td><td>Collective confirmation</td></tr><tr><td><strong>MD51</strong></td><td>Project-driven MRP for one project</td></tr><tr><td><strong>CNS0</strong></td><td>Create delivery from project</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS execution transactions</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP PS transaction codes run the period-end close?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Period-end transactions run in a fixed order: overhead, then results analysis, then settlement. The <a href="https://saisatwik.com/sap-ps-settlement-explained/">SAP PS settlement guide</a> and the <a href="https://saisatwik.com/results-analysis-in-sap-ps-explained/">results analysis guide</a> cover the detail.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Transaction</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>CJ44 / CJ45</strong></td><td>Overhead calculation, individual and collective</td></tr><tr><td><strong>KKA2 / KKAJ</strong></td><td>Results analysis, individual and collective</td></tr><tr><td><strong>CNE1 / CNE2</strong></td><td>Progress analysis, individual and collective</td></tr><tr><td><strong>CJB2 / CJB1</strong></td><td>Generate settlement rules, individual and collective</td></tr><tr><td><strong>CJ88 / CJ8G</strong></td><td>Settlement, individual and collective</td></tr><tr><td><strong>CJIC</strong></td><td>Maintain line item settlement for assets under construction</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS period-end transactions</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which SAP PS transaction codes are best for reporting?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Reporting transactions are where most users spend their time once a project is live. CN41N alone answers most structure and status questions.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Transaction</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>CN41N</strong></td><td>Structure overview: whole project with dates and statuses</td></tr><tr><td><strong>CN42N / CN43N</strong></td><td>Project definitions and WBS elements overview</td></tr><tr><td><strong>CN47N</strong></td><td>Network activities overview</td></tr><tr><td><strong>CJI3</strong></td><td>Actual cost line items</td></tr><tr><td><strong>CJI5</strong></td><td>Commitment line items</td></tr><tr><td><strong>S_ALR_87013532</strong></td><td>Plan, actual, commitment, remaining plan and assigned values</td></tr><tr><td><strong>CJE0</strong></td><td>Run a project hierarchy report</td></tr><tr><td><strong>CNE5</strong></td><td>Progress analysis (earned value) report</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS reporting transactions</figcaption></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>CNE5 is the earned value view. The <a href="https://saisatwik.com/earned-value-management-in-sap-ps/">earned value management guide</a> explains how to read it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which configuration transaction codes should SAP PS consultants know?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Configuration transactions belong to the SAP team, not end users. These five open the profiles that shape how every project behaves.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Transaction</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>OPSA</strong></td><td>Project profile</td></tr><tr><td><strong>OPSJ</strong></td><td>Project coding mask</td></tr><tr><td><strong>OPUU</strong></td><td>Network profile</td></tr><tr><td><strong>OPS9</strong></td><td>Budget profile</td></tr><tr><td><strong>OKO7</strong></td><td>Settlement profile</td></tr></tbody></table><figcaption class="wp-element-caption">Key SAP PS configuration transactions</figcaption></figure>
<!-- /wp:table -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Which system statuses decide what SAP PS transactions allow?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Many SAP PS errors are status problems, not transaction problems. A posting fails because the WBS element is still created, not released. These system statuses matter most.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>CRTD (created).</strong> Planning allowed, actual postings blocked.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>REL (released).</strong> Actual postings allowed.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>BUDG (budgeted).</strong> A budget has been entered.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>SETC (settlement rule created).</strong> The object has a settlement rule.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>TECO (technically completed).</strong> Work finished; most new commitments blocked, costs can still post.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>CLSD (closed).</strong> No further postings.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik train teams on SAP PS transactions?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik trains SAP PS users by role, not by transaction list. A project administrator learns the structure and reporting codes. A controller learns planning, budgeting and period-end. Training runs on the client's own project templates, so the first live project looks familiar.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Role-based training is part of every engagement from the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>. Official reference documentation sits on the <a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE" target="_blank" rel="noopener">SAP Help Portal</a>, and formal courses are on <a href="https://learning.sap.com/" target="_blank" rel="noopener">SAP Learning</a>. All the codes here also run in <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>, alongside newer SAP Fiori apps.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS transaction codes</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the most important SAP PS transaction code?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJ20N, the Project Builder. It creates and changes project definitions, WBS elements, networks, activities and milestones in one screen. Most project administrators spend more time in CJ20N than in every other SAP PS transaction combined.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Which transaction shows actual costs on a project?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>CJI3 lists actual cost line items by project or WBS element. For a summary of plan against actual and commitments, use S_ALR_87013532. CJI5 lists commitment line items such as open purchase orders.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Do SAP PS transaction codes work in SAP S/4HANA?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes. The standard SAP PS transactions in this cheat sheet run in SAP S/4HANA. SAP also adds Fiori apps for project monitoring, and some detailed planning moves toward SAP Analytics Cloud.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Why does SAP PS say my WBS element has the wrong status?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The element's system status forbids the action. New elements sit in CRTD, which blocks actual postings. Release the element in CJ20N, or check whether it is already technically completed or closed.</p>
<!-- /wp:paragraph -->
`,
};
