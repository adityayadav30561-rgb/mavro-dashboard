/**
 * GCC SAP Project Controls cluster spoke. Workbook L11 (SAP EPPM
 * implementation in Oman, P2). Lead intent. UP to hub.
 */
const { toBlocks } = require('./_blocks');

module.exports = {
  title: 'SAP EPPM Implementation in Oman: A Guide for Muscat Enterprises',
  slug: 'sap-eppm-implementation-oman',
  excerpt:
    'How Omani energy, logistics and public-sector organisations implement SAP EPPM for Vision 2040 projects, including Fawtara e-invoicing, phased rollouts and partner choice.',
  date: '2026-11-08T10:00:00',
  coverAlt: 'SAP EPPM implementation in Oman with Muscat and an energy project portfolio dashboard',
  categories: ['SAP'],
  tags: ['SAP EPPM', 'SAP Implementation', 'Oman', 'Oil and Gas', 'Utilities', 'GCC'],

  content: toBlocks(`
<h2>Quick Answer</h2>

<p>SAP EPPM implementation in Oman sets up SAP's project and portfolio suite for energy companies, logistics operators and public entities delivering Oman Vision 2040 projects. Most Omani organisations start with SAP PS and Investment Management, then add portfolio scoring. The national Fawtara e-invoicing programme affects project billing. SaiSatwik implements SAP EPPM in Oman with lean, phased rollouts sized for smaller PMO teams.</p>

<h2>Why are Omani organisations implementing SAP EPPM?</h2>

<p><a href="https://www.oman2040.om/" target="_blank" rel="noopener">Oman Vision 2040</a> covers 2021 to 2040 and is the national reference for economic and social planning. It drives investment in energy transition, logistics, tourism and industry. Each of those creates capital projects that need funding control and progress reporting.</p>

<p>Omani PMO teams are often smaller than their Saudi or UAE peers. That makes integrated tools more valuable, not less. One system for capex approval, project cost and settlement replaces manual reconciliation between finance and project teams.</p>

<h2>Which SAP EPPM modules should an Omani company start with?</h2>

<p>Start small and add modules when the data is clean. The <a href="https://saisatwik.com/sap-eppm-modules-explained-ps-ppm-im-cpm-cats/">SAP EPPM modules guide</a> explains each one.</p>

<table><caption>Recommended SAP EPPM phasing for Oman</caption><thead><tr><th>Phase</th><th>Modules</th><th>Outcome</th></tr></thead><tbody><tr><td>1</td><td>SAP PS with budgets and settlement</td><td>Cost control per project</td></tr><tr><td>2</td><td>SAP Investment Management</td><td>Approved capex programme and appropriation requests</td></tr><tr><td>3</td><td>SAP PPM</td><td>Portfolio scoring and prioritisation</td></tr><tr><td>Optional</td><td>SAP CATS, SAP CPM</td><td>Time recording, contractor commercial view</td></tr></tbody></table>

<h2>How does Fawtara e-invoicing affect SAP EPPM in Oman?</h2>

<p>Oman's Tax Authority is rolling out Fawtara, the national e-invoicing system, in phases. <a href="https://www.pwc.com/m1/en/services/tax/me-tax-legal-news/2025/oman-e-Invoicing-latest-announcements-and-plans-for-implementation.html" target="_blank" rel="noopener">PwC's summary of the announcements</a> sets out the planned approach. Customer project billing in SAP PS flows through SAP sales billing, so those invoices must meet Fawtara rules.</p>

<p>Plan the e-invoicing interface inside the EPPM project. Test milestone, down-payment and resource-related billing against it before go-live. The <a href="https://saisatwik.com/milestone-billing-in-sap-ps/">milestone billing guide</a> covers the SAP side.</p>

<h2>How does an SAP EPPM implementation in Oman run?</h2>

<p>SaiSatwik follows five steps on Omani projects, adapted from the <a href="https://saisatwik.com/sap-eppm-implementation-roadmap/">SAP EPPM implementation roadmap</a>.</p>

<ol>
<li><strong>Discovery.</strong> Map project types, capex approvals and billing.</li>
<li><strong>Design.</strong> Agree profiles, programme structure and settlement paths.</li>
<li><strong>Build.</strong> Configure SAP PS and SAP IM on <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a>.</li>
<li><strong>Test.</strong> Run full cycles, including Fawtara invoice output.</li>
<li><strong>Go-live.</strong> Migrate open projects and support the first closes.</li>
</ol>

<h2>How does SaiSatwik implement SAP EPPM in Oman?</h2>

<p>SaiSatwik sizes Omani rollouts for small PMO teams: fewer project profiles, clear templates and documented settlement. India is 1.5 hours ahead of Muscat, so remote build and support cover the full Omani working day. <a href="https://saisatwik.com/contact-us/">Talk to SaiSatwik about SAP EPPM in Oman</a>, or see the <a href="https://saisatwik.com/services/sap/eppm/">SaiSatwik SAP EPPM practice</a>.</p>

<h2>Related SaiSatwik Reading</h2>

<ul>
<li><a href="https://saisatwik.com/sap-eppm-for-oil-and-gas-uae/">SAP EPPM for oil and gas in the UAE</a>. Energy capex and turnarounds.</li>
<li><a href="https://saisatwik.com/sap-eppm-implementation-partner-middle-east/">Choosing an SAP EPPM partner in the Middle East</a>. The partner scorecard.</li>
<li><a href="https://saisatwik.com/sap-investment-management-vs-sap-eppm/">SAP Investment Management vs SAP EPPM</a>. Where IM fits.</li>
</ul>

<h2>FAQs about SAP EPPM implementation in Oman</h2>

<h3>How long does SAP EPPM take to implement in Oman?</h3>

<p>A first phase with SAP PS budgets and settlement typically takes four to six months. Adding SAP Investment Management and SAP PPM in later phases spreads the full suite over about a year.</p>

<h3>Do Omani companies need all SAP EPPM modules?</h3>

<p>No. Most start with SAP PS and SAP Investment Management. SAP PPM, CATS and CPM are added when portfolio size or contract complexity justifies them.</p>

<h3>Does SAP EPPM support Oman's Fawtara e-invoicing?</h3>

<p>Project invoices pass through SAP billing, so Fawtara compliance comes from the SAP e-invoicing integration. It must be tested for project billing scenarios too.</p>

<h3>Is SAP EPPM suited to Oman energy transition projects?</h3>

<p>Yes. Renewable, hydrogen and grid projects need the same capex approval, cost control and asset settlement that SAP IM and SAP PS provide.</p>
`),
};
