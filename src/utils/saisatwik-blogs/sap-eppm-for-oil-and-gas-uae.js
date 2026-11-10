/**
 * GCC SAP Project Controls cluster spoke. Workbook L19 (SAP EPPM for oil and
 * gas in the UAE, P1). Lead intent. UP to hub.
 */
const { toBlocks } = require('./_blocks');

module.exports = {
  title: 'SAP EPPM for Oil and Gas in the UAE: Capex, Turnarounds, JVs',
  slug: 'sap-eppm-for-oil-and-gas-uae',
  excerpt:
    'How UAE oil and gas operators and contractors use SAP EPPM to control upstream capex, plan turnarounds and shutdowns, and split costs across joint-venture partners.',
  date: '2026-11-04T10:00:00',
  coverAlt: 'SAP EPPM for oil and gas in the UAE with an offshore platform and capex dashboards',
  categories: ['SAP'],
  tags: ['SAP EPPM', 'SAP Investment Management', 'Oil and Gas', 'UAE', 'For CFOs', 'GCC'],

  content: toBlocks(`
<h2>Quick Answer</h2>

<p>SAP EPPM for oil and gas in the UAE gives operators and contractors one system for capital approval, project execution and cost settlement. SAP Investment Management governs the capex programme, SAP PS runs each project and turnaround, and SAP PPM ranks competing projects. UAE oil and gas projects add joint-venture cost splits and long asset lives. SaiSatwik implements SAP EPPM for energy companies and their EPC contractors in Abu Dhabi and Dubai.</p>

<h2>What does SAP EPPM cover for a UAE oil and gas company?</h2>

<p><strong>Definition:</strong> <a href="https://www.sap.com/products/erp/enterprise-portfolio-project-management.html" target="_blank" rel="noopener">SAP Enterprise Portfolio and Project Management</a> is SAP's suite for selecting, funding, executing and closing projects. In oil and gas, it spans field development, plant upgrades, drilling-related capex and planned shutdowns.</p>

<p>The <a href="https://saisatwik.com/sap-eppm-modules-explained-ps-ppm-im-cpm-cats/">SAP EPPM modules guide</a> explains each component. The table below shows how each one maps to oil and gas work.</p>

<table><caption>SAP EPPM modules mapped to oil and gas work</caption><thead><tr><th>Module</th><th>Oil and gas use</th></tr></thead><tbody><tr><td><strong>SAP Investment Management</strong></td><td>Annual capex programme, appropriation requests, approval gates</td></tr><tr><td><strong>SAP PPM</strong></td><td>Ranking projects across fields and assets</td></tr><tr><td><strong>SAP PS</strong></td><td>Executing projects and turnarounds, cost and progress</td></tr><tr><td><strong>SAP CPM</strong></td><td>Contractor-side commercial view of each contract</td></tr><tr><td><strong>SAP CATS</strong></td><td>Field and contractor time against projects</td></tr></tbody></table>

<h2>How does SAP EPPM control turnarounds and shutdowns in the UAE?</h2>

<p>A turnaround is a short, expensive project where every lost day costs production. SAP PS models it with a WBS per unit and networks for each work pack. Plant maintenance orders link to the turnaround project, so all spend rolls up in one place.</p>

<ol>
<li><strong>Scope freeze.</strong> Lock the work list early, with change control on additions.</li>
<li><strong>Budget per unit.</strong> Set WBS budgets with availability control so late additions need approval.</li>
<li><strong>Daily cost and progress.</strong> Confirm activities daily and compare earned value with plan.</li>
<li><strong>Settlement split.</strong> Separate capital from maintenance cost before settlement, as covered in <a href="https://saisatwik.com/sap-ps-settlement-explained/">SAP PS settlement</a>.</li>
</ol>

<h2>How does SAP EPPM handle joint-venture cost splits?</h2>

<p>Many UAE upstream assets run as joint ventures with international partners. Project costs must be split by equity share and billed to partners. SAP joint venture accounting works alongside SAP PS, so each WBS carries the venture and equity group. Partner billing then follows from posted project costs.</p>

<p>Design this split before configuration. Retrofitting venture codes onto live projects is slow and error-prone.</p>

<h2>Why does capex governance matter for UAE energy projects?</h2>

<p>Energy megaprojects overrun often. Bent Flyvbjerg's research estimates global megaproject spending at <a href="https://arxiv.org/abs/1409.0003" target="_blank" rel="noopener">USD 6 to 9 trillion a year, about 8 percent of world GDP</a>, with cost overruns the norm. The <a href="https://www.gao.gov/products/gao-20-195g" target="_blank" rel="noopener">GAO Cost Estimating and Assessment Guide</a> sets out the documented cost discipline that large programmes need.</p>

<p>SAP Investment Management puts that discipline into the system. Appropriation requests carry the business case, approved amounts become budgets, and spend above the approved figure needs a supplement.</p>

<h2>How does SaiSatwik deliver SAP EPPM for UAE oil and gas?</h2>

<p>SaiSatwik starts with the capex approval flow and turnaround calendar, then designs SAP IM and SAP PS around them. Joint-venture splits and the capital versus maintenance boundary are agreed with finance first. Build runs remotely with full overlap of the UAE working day.</p>

<p>See the <a href="https://saisatwik.com/services/sap/eppm/">SaiSatwik SAP EPPM practice</a> or <a href="https://saisatwik.com/contact-us/">talk to SaiSatwik about an energy capex review</a>.</p>

<h2>Related SaiSatwik Reading</h2>

<ul>
<li><a href="https://saisatwik.com/sap-eppm-implementation-partner-middle-east/">Choosing an SAP EPPM implementation partner in the Middle East</a>. The partner scorecard.</li>
<li><a href="https://saisatwik.com/sap-ps-implementation-uae/">SAP PS implementation in the UAE</a>. Scope and timelines.</li>
<li><a href="https://saisatwik.com/sap-investment-management-vs-sap-eppm/">SAP Investment Management vs SAP EPPM</a>. Where IM fits.</li>
<li><a href="https://saisatwik.com/sap-eppm-implementation-oman/">SAP EPPM implementation in Oman</a>. Another energy-led market.</li>
</ul>

<h2>FAQs about SAP EPPM for oil and gas in the UAE</h2>

<h3>Is SAP EPPM used in the oil and gas industry?</h3>

<p>Yes. Oil and gas companies use SAP EPPM to govern capex programmes, run field and plant projects, and manage turnarounds, because those projects need tight links between budgets, procurement, maintenance and asset accounting.</p>

<h3>Can SAP PS manage a refinery turnaround?</h3>

<p>Yes. SAP PS structures the turnaround by unit and work pack, links maintenance orders, controls budget with availability control and reports progress and earned value daily.</p>

<h3>How does SAP handle joint-venture partner billing on projects?</h3>

<p>SAP joint venture accounting assigns venture and equity data to project objects. Posted costs are then split by equity share and billed to non-operating partners.</p>

<h3>What is the difference between capex and opex in SAP PS?</h3>

<p>Capital spend settles to assets under construction and then to fixed assets. Operating spend settles to cost centers or orders. Turnarounds often mix both, so the split must be clear before settlement.</p>
`),
};
