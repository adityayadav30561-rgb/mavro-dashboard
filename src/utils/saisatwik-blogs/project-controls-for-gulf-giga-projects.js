/**
 * GCC SAP Project Controls cluster spoke. Workbook K66 (Project controls for
 * Gulf giga-projects, P2). Traffic intent (knowledge). UP to hub; lateral to
 * Saudi Vision 2030 post #5308 and SAP PS cluster.
 */
const { toBlocks } = require('./_blocks');

module.exports = {
  title: 'Project Controls for Gulf Giga-Projects: What Actually Works',
  slug: 'project-controls-for-gulf-giga-projects',
  excerpt:
    'How Gulf giga-projects in Saudi Arabia, the UAE and Qatar control cost and schedule: the six project controls functions, tools, earned value and common failure points.',
  date: '2026-11-10T09:00:00',
  coverAlt: 'Project controls for Gulf giga-projects with a desert megaproject site and cost and schedule dashboards',
  categories: ['SAP'],
  tags: ['SAP EPPM', 'SAP PS', 'Engineering and Construction', 'Middle East', 'For PMOs', 'GCC'],

  content: toBlocks(`
<h2>Quick Answer</h2>

<p>Project controls for Gulf giga-projects combine six functions: cost control, scheduling, change management, risk, progress measurement and reporting. On the largest Saudi, UAE and Qatari programmes, these run on a planning tool such as Primavera P6 linked to an ERP such as SAP PS for budgets, commitments and actual cost. The controls that work are integrated, measured weekly and owned by finance and engineering together. SaiSatwik builds the SAP side of giga-project controls in the GCC.</p>

<h2>What are project controls on a Gulf giga-project?</h2>

<p><strong>Definition:</strong> project controls are the processes and systems that measure cost and schedule against the approved baseline, forecast the outcome and trigger corrective action. On a giga-project, they span hundreds of contracts and thousands of activities.</p>

<p>Scale changes everything. Bent Flyvbjerg estimates global megaproject spending at <a href="https://arxiv.org/abs/1409.0003" target="_blank" rel="noopener">USD 6 to 9 trillion a year, around 8 percent of world GDP</a>. Gulf programmes under <a href="https://www.vision2030.gov.sa/en" target="_blank" rel="noopener">Saudi Vision 2030</a>, the <a href="https://investindubai.gov.ae/en/why-dubai/d33-agenda" target="_blank" rel="noopener">Dubai D33 agenda</a> and <a href="https://www.gco.gov.qa/en/about-qatar/national-vision2030/" target="_blank" rel="noopener">Qatar National Vision 2030</a> sit at the top of that range.</p>

<h2>Why do Gulf giga-projects overrun?</h2>

<p>The causes are rarely technical. Flyvbjerg's work describes an "iron law of megaprojects": over budget, over time, over and over again. <a href="https://www.mckinsey.com/capabilities/operations/our-insights/imagining-constructions-digital-future" target="_blank" rel="noopener">McKinsey found</a> large construction projects typically finish 20 percent late and up to 80 percent over budget.</p>

<ul>
<li><strong>Optimistic baselines.</strong> Budgets set to win approval, not to reflect risk.</li>
<li><strong>Late change capture.</strong> Scope changes are agreed on site but booked months later.</li>
<li><strong>Disconnected data.</strong> Schedule, cost and contract data live in separate tools.</li>
<li><strong>Too many interfaces.</strong> Hundreds of contractors, each reporting differently.</li>
</ul>

<h2>Which six project controls functions does a giga-project need?</h2>

<p>Every Gulf giga-project PMO needs these six functions, each with a clear system of record.</p>

<table><caption>Giga-project controls functions and systems of record</caption><thead><tr><th>Function</th><th>What it does</th><th>Typical system</th></tr></thead><tbody><tr><td>Cost control</td><td>Budget, commitments, actuals, forecast</td><td>SAP PS</td></tr><tr><td>Scheduling</td><td>Detailed schedule and critical path</td><td>Primavera P6</td></tr><tr><td>Change management</td><td>Variations, claims, budget transfers</td><td>SAP PS or CPM with workflow</td></tr><tr><td>Risk management</td><td>Risk register and contingency</td><td>Risk tool linked to cost</td></tr><tr><td>Progress measurement</td><td>Physical progress and earned value</td><td>SAP PS earned value</td></tr><tr><td>Reporting</td><td>Portfolio dashboards for leadership</td><td>SAP analytics on S/4HANA</td></tr></tbody></table>

<h2>How should SAP PS and Primavera P6 split the work?</h2>

<p>Owners and contractors in the Gulf often specify Primavera P6 for schedules. SAP PS then owns money: budgets, commitments, actual cost, billing and settlement. Progress and dates flow from P6 into SAP, so earned value uses one set of numbers.</p>

<ol>
<li><strong>Align structures.</strong> Map P6 WBS codes to SAP WBS elements once, at design.</li>
<li><strong>Transfer progress.</strong> Send percent complete from P6 to SAP weekly.</li>
<li><strong>Calculate earned value.</strong> Run SPI and CPI in SAP, as in <a href="https://saisatwik.com/earned-value-management-in-sap-ps/">earned value management in SAP PS</a>.</li>
<li><strong>Control budget.</strong> Block overspend with <a href="https://saisatwik.com/budgeting-and-availability-control-in-sap-ps/">availability control</a>.</li>
<li><strong>Report once.</strong> Build leadership dashboards from SAP, not spreadsheets.</li>
</ol>

<p>The <a href="https://www.pmi.org/standards/earned-value-management" target="_blank" rel="noopener">PMI earned value standard</a> and the <a href="https://www.gao.gov/products/gao-20-195g" target="_blank" rel="noopener">GAO cost guide</a> are the usual reference points for method.</p>

<h2>What does SaiSatwik do on Gulf giga-project controls?</h2>

<p>SaiSatwik designs and builds the SAP side of giga-project controls: WBS alignment with P6, budgets and availability control, commitment tracking, earned value and settlement to assets. Work starts from the owner's controls procedures, so the system enforces the rules the PMO already wrote.</p>

<p>See the <a href="https://saisatwik.com/sap-eppm-implementation-partner-middle-east/">guide to choosing an SAP EPPM implementation partner in the Middle East</a> and the <a href="https://saisatwik.com/services/sap/eppm/">SaiSatwik SAP EPPM practice</a>.</p>

<h2>Related SaiSatwik Reading</h2>

<ul>
<li><a href="https://saisatwik.com/why-saudi-enterprises-are-adopting-sap-eppm-for-large-project-portfolios/">Why Saudi enterprises are adopting SAP EPPM</a>. Vision 2030 portfolios.</li>
<li><a href="https://saisatwik.com/sap-ps-for-construction-saudi-arabia/">SAP PS for construction in Saudi Arabia</a>. The contractor view.</li>
<li><a href="https://saisatwik.com/sap-eppm-best-practices-for-capital-projects/">SAP EPPM best practices for capital projects</a>. Seven practices that hold.</li>
</ul>

<h2>FAQs about project controls for Gulf giga-projects</h2>

<h3>What is a giga-project?</h3>

<p>A giga-project is a programme costing in the billions of dollars, usually spanning many years and contractors. Saudi Arabia's Vision 2030 programmes are the best-known Gulf examples.</p>

<h3>What software do Gulf giga-projects use for project controls?</h3>

<p>Most combine Primavera P6 for scheduling with an ERP such as SAP for cost, commitments, billing and accounting, plus risk and document control tools linked to both.</p>

<h3>What is earned value on a giga-project?</h3>

<p>Earned value compares the value of work completed with planned value and actual cost. It produces SPI and CPI, which show schedule and cost performance per contract or package.</p>

<h3>How often should giga-project controls report?</h3>

<p>Weekly progress and cost updates are typical, with monthly forecasts and leadership reports. Daily cost visibility from SAP helps catch overspend before the monthly cycle.</p>
`),
};
