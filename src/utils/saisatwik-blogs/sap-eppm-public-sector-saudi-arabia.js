/**
 * GCC SAP Project Controls cluster spoke. Workbook L21 (SAP EPPM for
 * government projects in Saudi Arabia, P2). Lead intent. UP to hub.
 */
const { toBlocks } = require('./_blocks');

module.exports = {
  title: 'SAP EPPM for Government Projects in Saudi Arabia',
  slug: 'sap-eppm-public-sector-saudi-arabia',
  excerpt:
    'How Saudi ministries, authorities and government-owned companies use SAP EPPM to prioritise Vision 2030 projects, control public capex and report progress to leadership.',
  date: '2026-11-05T10:00:00',
  coverAlt: 'SAP EPPM for government projects in Saudi Arabia with a public infrastructure portfolio dashboard',
  categories: ['SAP'],
  tags: ['SAP EPPM', 'Public Sector', 'Saudi Arabia', 'For PMOs', 'Enterprise Portfolio Management', 'GCC'],

  content: toBlocks(`
<h2>Quick Answer</h2>

<p>SAP EPPM for government projects in Saudi Arabia gives ministries, authorities and government-owned companies one view of their project portfolio: which projects get funded, how budgets are spent and whether delivery is on track. SAP PPM ranks projects against Vision 2030 objectives, SAP Investment Management governs capex, and SAP PS controls execution. SaiSatwik implements SAP EPPM for Saudi public-sector portfolios with Arabic reporting and phased rollouts.</p>

<h2>Why do Saudi government entities need SAP EPPM?</h2>

<p>Saudi government entities now own more projects than at any time before. <a href="https://www.vision2030.gov.sa/en" target="_blank" rel="noopener">Vision 2030</a> sets national programmes and targets, and each entity must show how its projects contribute. A spreadsheet portfolio cannot link funding decisions, spend and outcomes.</p>

<p>Public projects also face the same overrun risk as private ones. The <a href="https://www.gao.gov/products/gao-16-89g" target="_blank" rel="noopener">GAO Schedule Assessment Guide</a> and <a href="https://www.gao.gov/products/gao-20-195g" target="_blank" rel="noopener">GAO Cost Estimating and Assessment Guide</a> are widely used public-sector references for cost and schedule discipline. SAP EPPM builds that discipline into daily work.</p>

<h2>How does SAP EPPM support a government project portfolio?</h2>

<p>SAP EPPM covers the full life of a public project, from proposal to closed asset.</p>

<ol>
<li><strong>Proposal.</strong> Departments submit project ideas in SAP PPM with cost, benefit and strategic alignment.</li>
<li><strong>Scoring and ranking.</strong> A scoring model ranks proposals against Vision 2030 objectives and available budget.</li>
<li><strong>Approval and funding.</strong> SAP Investment Management turns approved proposals into funded programme positions.</li>
<li><strong>Execution.</strong> SAP PS runs each project with budgets, procurement and progress.</li>
<li><strong>Reporting.</strong> Portfolio dashboards show spend, progress and risk for leadership.</li>
<li><strong>Closure.</strong> Completed work settles to public assets through <a href="https://saisatwik.com/sap-ps-settlement-explained/">SAP PS settlement</a>.</li>
</ol>

<h2>Which SAP EPPM features matter most to Saudi public-sector PMOs?</h2>

<p>Government PMOs in Saudi Arabia usually ask for the same core features. The table maps them to SAP components.</p>

<table><caption>Saudi public-sector needs mapped to SAP EPPM</caption><thead><tr><th>PMO need</th><th>SAP component</th></tr></thead><tbody><tr><td>Rank projects against national objectives</td><td>SAP PPM scoring and portfolio buckets</td></tr><tr><td>Multi-year capex programme</td><td>SAP Investment Management programmes</td></tr><tr><td>Stop overspend on approved budgets</td><td>SAP PS availability control</td></tr><tr><td>Contractor progress and payment</td><td>SAP PS with procurement and service entry</td></tr><tr><td>Arabic reports for leadership</td><td>SAP S/4HANA Arabic language and forms</td></tr><tr><td>Data kept in the Kingdom</td><td>Local hosting or SAP's Saudi cloud region</td></tr></tbody></table>

<h2>Does SAP EPPM meet Saudi data residency expectations?</h2>

<p>Many Saudi government clients require data to stay in the Kingdom. SAP has operated a public cloud data center in Saudi Arabia since 2018, and on-premise SAP S/4HANA can run in local data centers. Agree hosting with the entity's cybersecurity team before design, because it shapes the whole project plan.</p>

<h2>How does SaiSatwik implement SAP EPPM for Saudi government entities?</h2>

<p>SaiSatwik starts with the entity's strategy map and approval chain, then designs SAP PPM scoring and SAP IM programmes to match. Rollout is phased, usually starting with one directorate. Arabic forms and dashboards are planned from the first workshop, not added at the end.</p>

<p>See the <a href="https://saisatwik.com/services/sap/eppm/saudi-arabia/">SaiSatwik SAP EPPM Saudi Arabia service</a>, or <a href="https://saisatwik.com/contact-us/">talk to SaiSatwik about a public-sector portfolio review</a>.</p>

<h2>Related SaiSatwik Reading</h2>

<ul>
<li><a href="https://saisatwik.com/why-saudi-enterprises-are-adopting-sap-eppm-for-large-project-portfolios/">Why Saudi enterprises are adopting SAP EPPM</a>. The Vision 2030 business case.</li>
<li><a href="https://saisatwik.com/sap-ps-for-construction-saudi-arabia/">SAP PS for construction in Saudi Arabia</a>. The contractor side.</li>
<li><a href="https://saisatwik.com/project-controls-for-gulf-giga-projects/">Project controls for Gulf giga-projects</a>. Controls at mega scale.</li>
<li><a href="https://saisatwik.com/sap-eppm-implementation-partner-middle-east/">Choosing an SAP EPPM partner in the Middle East</a>. The scorecard.</li>
</ul>

<h2>FAQs about SAP EPPM for Saudi government projects</h2>

<h3>Is SAP used by Saudi government entities?</h3>

<p>Yes. SAP is widely used across Saudi ministries, authorities and government-owned companies for finance, procurement and HR. SAP EPPM extends that base to project and portfolio management.</p>

<h3>Can SAP PPM score projects against Vision 2030 objectives?</h3>

<p>Yes. SAP PPM scoring models are configurable, so criteria can mirror Vision 2030 programmes, entity strategy and risk. Ranked results feed funding decisions.</p>

<h3>Does SAP EPPM support Arabic?</h3>

<p>SAP S/4HANA supports Arabic, including right-to-left forms and reports. Government dashboards and approval documents can be delivered in Arabic and English.</p>

<h3>How long does SAP EPPM take for a Saudi government entity?</h3>

<p>A first phase covering one directorate with SAP PS and portfolio reporting typically takes six to nine months. Entity-wide rollouts with SAP PPM and SAP IM run in further phases.</p>
`),
};
