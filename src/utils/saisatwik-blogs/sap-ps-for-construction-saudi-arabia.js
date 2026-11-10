/**
 * GCC SAP Project Controls cluster spoke. Workbook L18 (SAP PS for construction
 * companies in Saudi Arabia, P1). Lead intent. UP to hub.
 */
const { toBlocks } = require('./_blocks');

module.exports = {
  title: 'SAP PS for Construction Companies in Saudi Arabia',
  slug: 'sap-ps-for-construction-saudi-arabia',
  excerpt:
    'How Saudi construction and EPC companies use SAP PS for Vision 2030 projects: budgets, subcontractor control, milestone billing, ZATCA e-invoicing and earned value.',
  date: '2026-11-03T10:00:00',
  coverAlt: 'SAP PS for construction companies in Saudi Arabia with Riyadh cranes and a project dashboard',
  categories: ['SAP'],
  tags: ['SAP PS', 'SAP Implementation', 'Saudi Arabia', 'Engineering and Construction', 'For CFOs', 'GCC'],

  content: toBlocks(`
<h2>Quick Answer</h2>

<p>SAP PS for construction companies in Saudi Arabia controls each contract as a project: budget by WBS, subcontractor commitments, milestone billing to the client and earned value against the schedule. Saudi contractors also need ZATCA-compliant e-invoices from project billing and Arabic outputs for government clients. SaiSatwik implements SAP PS for Saudi construction and EPC companies, with design workshops in the Kingdom and build support from India.</p>

<h2>Why do Saudi construction companies need SAP PS?</h2>

<p>Saudi construction volume has jumped under <a href="https://www.vision2030.gov.sa/en" target="_blank" rel="noopener">Vision 2030</a>. Contractors now run more large projects at once, often for the same few government and giga-project clients. Spreadsheet cost reports cannot keep up with that volume.</p>

<p>Margins are thin and overruns are normal. <a href="https://www.mckinsey.com/capabilities/operations/our-insights/imagining-constructions-digital-future" target="_blank" rel="noopener">McKinsey found</a> that large construction projects typically finish 20 percent late and up to 80 percent over budget. SAP PS gives Saudi contractors committed cost, actual cost and billed revenue per project, every day.</p>

<h2>How does SAP PS model a construction project in Saudi Arabia?</h2>

<p>A typical Saudi contract maps to SAP PS objects as follows. The <a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS WBS guide</a> explains the design rules.</p>

<table><caption>Saudi construction contract mapped to SAP PS</caption><thead><tr><th>Contract element</th><th>SAP PS object</th></tr></thead><tbody><tr><td>Contract or package</td><td>Project definition</td></tr><tr><td>Building, zone or discipline</td><td>WBS element</td></tr><tr><td>Site activities and subcontract work</td><td>Network activities</td></tr><tr><td>Client payment milestones</td><td>Billing plan on the billing WBS</td></tr><tr><td>Subcontractor purchase orders</td><td>Commitments on the WBS</td></tr><tr><td>Retention and advance payments</td><td>Down payments and billing plan items</td></tr></tbody></table>

<h2>What does SAP PS control on a Saudi construction site?</h2>

<p>SAP PS covers the five controls that Saudi contractors ask about most.</p>

<ol>
<li><strong>Budget and availability control.</strong> Purchase orders that would exceed the WBS budget are warned or blocked. See <a href="https://saisatwik.com/budgeting-and-availability-control-in-sap-ps/">availability control in SAP PS</a>.</li>
<li><strong>Subcontractor commitments.</strong> Every subcontract shows as committed cost before invoices arrive.</li>
<li><strong>Milestone billing.</strong> Client payment certificates follow milestones, as covered in the <a href="https://saisatwik.com/milestone-billing-in-sap-ps/">milestone billing guide</a>.</li>
<li><strong>Revenue recognition.</strong> Results analysis matches revenue to progress under <a href="https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers/" target="_blank" rel="noopener">IFRS 15</a>, which Saudi listed companies apply.</li>
<li><strong>Earned value.</strong> SPI and CPI per package, explained in <a href="https://saisatwik.com/earned-value-management-in-sap-ps/">earned value management in SAP PS</a>.</li>
</ol>

<h2>How does ZATCA e-invoicing affect SAP PS for Saudi contractors?</h2>

<p>Saudi Arabia's Zakat, Tax and Customs Authority began the <a href="https://zatca.gov.sa/en/MediaCenter/News/Pages/E-Invoicing-Phase-2-ntegration.aspx" target="_blank" rel="noopener">integration phase of e-invoicing (Phase 2) on 1 January 2023</a>, rolling it out in waves. In this phase, invoicing systems connect to ZATCA's FATOORA platform. Milestone invoices from SAP PS pass through SAP billing, so that output must be compliant.</p>

<p>SaiSatwik tests ZATCA output for every billing scenario: milestones, down payments, retention release and resource-related billing.</p>

<h2>Should Saudi contractors use SAP PS with Primavera P6?</h2>

<p>Many Saudi EPC contractors keep Primavera P6 for detailed scheduling, because clients specify it. SAP PS then holds budgets, costs and billing, with progress transferred from P6. The <a href="https://saisatwik.com/project-controls-for-gulf-giga-projects/">guide to project controls for Gulf giga-projects</a> covers how the two tools split the work.</p>

<h2>How does SaiSatwik implement SAP PS for construction in Saudi Arabia?</h2>

<p>SaiSatwik starts with one live contract as the reference project, then designs profiles from it. Testing runs full cycles per project type, including ZATCA output and Arabic forms. India is 2.5 hours ahead of Riyadh, so SaiSatwik's build team covers the full Saudi working day.</p>

<p>See <a href="https://saisatwik.com/sap-eppm-consultants-in-saudi-arabia/">SAP EPPM consultants in Saudi Arabia</a> and the <a href="https://saisatwik.com/services/sap/eppm/saudi-arabia/">SaiSatwik SAP EPPM Saudi Arabia service</a>. Or <a href="https://saisatwik.com/contact-us/">talk to SaiSatwik about a contractor scoping workshop</a>.</p>

<h2>Related SaiSatwik Reading</h2>

<ul>
<li><a href="https://saisatwik.com/sap-eppm-implementation-partner-middle-east/">Choosing an SAP EPPM implementation partner in the Middle East</a>. The full scorecard.</li>
<li><a href="https://saisatwik.com/sap-eppm-public-sector-saudi-arabia/">SAP EPPM for government projects in Saudi Arabia</a>. The project-owner side.</li>
<li><a href="https://saisatwik.com/why-saudi-enterprises-are-adopting-sap-eppm-for-large-project-portfolios/">Why Saudi enterprises are adopting SAP EPPM</a>. The portfolio view.</li>
</ul>

<h2>FAQs about SAP PS for construction in Saudi Arabia</h2>

<h3>Is SAP PS good for construction companies?</h3>

<p>Yes, for contractors running several large projects. SAP PS links budgets, procurement, billing and accounting per project, so committed cost and margin are visible daily. Very small contractors may find a lighter ERP easier.</p>

<h3>Can SAP PS handle retention in Saudi construction contracts?</h3>

<p>Yes. Retention is handled through billing plan items and down-payment or retention postings, so retention receivable and its release are tracked per project and per client.</p>

<h3>Does SAP PS produce ZATCA-compliant invoices?</h3>

<p>SAP PS creates billing documents through SAP sales billing. Compliance comes from the e-invoicing integration between SAP and ZATCA's FATOORA platform, which must cover project billing scenarios too.</p>

<h3>How long does SAP PS take for a Saudi contractor?</h3>

<p>A focused rollout covering budgets, commitments, milestone billing and settlement typically takes five to seven months. Results analysis, P6 integration and many open contracts extend the timeline.</p>
`),
};
