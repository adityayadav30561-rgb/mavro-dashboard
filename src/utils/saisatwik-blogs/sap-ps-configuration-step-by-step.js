/**
 * SaiSatwik blog post - SAP PS cluster spoke (configuration step by step).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K23.
 * Primary keyword: SAP PS configuration. Intent: informational (traffic
 * engine), Priority 2, geo-neutral. Anchors UP to the SAP PS hub (#5418) and
 * laterally to the planning, budgeting, settlement and tcode spokes. House
 * style: plain, direct, no em dashes, no filler, no invented transactions
 * (profiles without a well-known transaction are described by IMG area).
 */

module.exports = {
  title: 'SAP PS Configuration Step by Step: Profiles and Settings',
  slug: 'sap-ps-configuration-step-by-step',

  excerpt:
    'SAP PS configuration in order: prerequisites, project profile, coding mask, status profile, network profile, planning, budget and settlement profiles.',

  // Backdated publish (batch spread one per day from 13 Oct 2026).
  date: '2026-10-24T10:00:00',

  categories: ['SAP'],
  tags: [
    'SAP PS',
    'SAP S/4HANA',
    'SAP Implementation',
    'For CTOs',
    'Tutorial',
    'Global',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS configuration sets up the profiles that control how every project behaves. In order: confirm the FICO prerequisites, then define the project profile (OPSA), the coding mask (OPSJ), status profiles, network types and the network profile (OPUU), and the planning profile. After those come the budget profile (OPS9) and the settlement profile (OKO7), plus results analysis and investment settings where needed. The project profile ties them together, so each project type picks up the right settings automatically. SaiSatwik configures SAP PS around real project types, not generic defaults.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does SAP PS configuration involve?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Definition:</strong> SAP PS configuration is the setup, in the implementation guide under Project System, of the profiles, number ranges, statuses and control keys that decide how projects are structured, planned, budgeted and settled. End users never see it directly. They feel it in every field default and every error message.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Good configuration is invisible. A project administrator picks a project profile and gets the right numbering, budget rules and settlement receivers without thinking. Poor configuration shows up as daily workarounds and manual corrections at month end.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What must be in place before configuring SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS sits on top of the finance and logistics structures, so several objects must exist first. Missing one stops project creation in testing.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Finance structures.</strong> Company code, controlling area, profit centers and cost elements. The <a href="https://saisatwik.com/sap-ps-and-fico-integration/">SAP PS and FICO integration guide</a> explains each one.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Logistics structures.</strong> Plants, and work centers with activity types and rates if networks will carry internal labour.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Overhead and settlement basics.</strong> Costing sheets and secondary cost elements for overhead and settlement.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>A project-type list.</strong> Agreed with the business: capital, customer, internal, maintenance or R&amp;D.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How do you configure SAP PS, step by step?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP PS configuration is best done in a fixed order, because later profiles are assigned inside earlier ones. This is the sequence SaiSatwik follows on new implementations.</p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Coding mask (OPSJ).</strong> Define the project number pattern and separators, such as C-2026-001 for capital projects.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Status profiles.</strong> Add user statuses where the business needs approval gates beyond the standard system statuses.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Network types and network profile (OPUU).</strong> Set scheduling defaults, control keys and the default network type.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Planning profile.</strong> Choose planning methods, time frame and whether plans run bottom-up or top-down.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Budget profile (OPS9).</strong> Set budget time frame, availability control activation and tolerance limits.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Settlement profile (OKO7).</strong> Define allowed receivers and the allocation structure.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Results analysis settings.</strong> For customer projects: results analysis keys, versions and valuation methods.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Investment profile.</strong> For capital projects that settle to assets under construction.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Project profile (OPSA).</strong> Bring it all together: assign the profiles above and set organisational defaults.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Templates.</strong> Build standard WBS and standard networks for each project type.</li>
<!-- /wp:list-item -->
</ol>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What does each SAP PS profile control?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Each profile owns one area of behaviour. Knowing which profile owns what saves hours when something behaves unexpectedly in testing.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Profile</th><th>Transaction or area</th><th>Controls</th></tr></thead><tbody><tr><td><strong>Project profile</strong></td><td>OPSA</td><td>Defaults for each project type and the profiles it uses</td></tr><tr><td><strong>Coding mask</strong></td><td>OPSJ</td><td>Project and WBS numbering pattern</td></tr><tr><td><strong>Network profile</strong></td><td>OPUU</td><td>Network defaults, scheduling and control keys</td></tr><tr><td><strong>Planning profile</strong></td><td>IMG: Costs, Planned Costs</td><td>Planning methods, time frame, plan rules</td></tr><tr><td><strong>Budget profile</strong></td><td>OPS9</td><td>Budget time frame and availability control</td></tr><tr><td><strong>Settlement profile</strong></td><td>OKO7</td><td>Allowed receivers and allocation structure</td></tr><tr><td><strong>Status profile</strong></td><td>IMG: Status Management</td><td>User statuses and allowed business transactions</td></tr></tbody></table><figcaption class="wp-element-caption">SAP PS configuration profiles and what they control</figcaption></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Planning, budgeting and settlement each have their own guide in this series: <a href="https://saisatwik.com/sap-ps-project-cost-planning-guide/">cost planning</a>, <a href="https://saisatwik.com/budgeting-and-availability-control-in-sap-ps/">budgeting and availability control</a> and <a href="https://saisatwik.com/sap-ps-settlement-explained/">settlement</a>.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How many project profiles should a company have?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Fewer than most implementations end up with. One project profile per genuinely different project type is the rule. Capital, customer, internal and maintenance projects usually need separate profiles. Two capital projects that differ only by plant do not.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Profile sprawl is expensive later. Every extra profile multiplies test cases, training variants and reporting exceptions. The <a href="https://saisatwik.com/sap-eppm-best-practices-for-capital-projects/">SAP EPPM best practices for capital projects</a> make the same point about templates.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Why does SAP PS configuration quality matter?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Configuration decides whether SAP PS controls projects or just records them. <a href="https://www.mckinsey.com/capabilities/operations/our-insights/imagining-constructions-digital-future" target="_blank" rel="noopener">McKinsey found</a> large projects typically run 20 percent late and up to 80 percent over budget. Budget profiles with live availability control and settlement profiles that close cleanly are the system side of preventing that.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Control systems are also how complex programmes stay auditable. The <a href="https://www.gao.gov/products/gao-20-195g" target="_blank" rel="noopener">GAO Cost Estimating and Assessment Guide</a> treats documented, repeatable cost control as basic discipline. In SAP PS, that discipline lives in configuration.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik configure SAP PS?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik starts SAP PS configuration with a project-type workshop, not the IMG. Finance, project controls and operations agree the types, then each gets one project profile, one set of templates and one settlement path. Configuration is documented per profile, so the next consultant can read why each setting exists.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>The same approach runs on <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> and ECC through the <a href="https://saisatwik.com/services/sap/">SaiSatwik SAP practice</a>. Official configuration documentation is on the <a href="https://help.sap.com/docs/SAP_S4HANA_ON-PREMISE" target="_blank" rel="noopener">SAP Help Portal</a>. For a quick lookup of these and other codes, see the <a href="https://saisatwik.com/sap-ps-transaction-codes-cheat-sheet/">SAP PS transaction codes cheat sheet</a>.</p>
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
<li><a href="https://saisatwik.com/what-is-sap-ps-project-system-beginner-guide/">What is SAP PS? A beginner guide</a>. The objects this configuration controls.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-in-s4hana-key-differences/">SAP PS in S/4HANA: key differences</a>. What changes in configuration on S/4HANA.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-ps-work-breakdown-structure-wbs-explained/">SAP PS Work Breakdown Structure explained</a>. Designing structures the profiles support.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP PS configuration</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the first step in SAP PS configuration?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Confirm the finance and logistics prerequisites: company code, controlling area, profit centers, cost elements, plants and work centers. Within Project System itself, start with the coding mask and the profiles that the project profile will later reference.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What does the project profile control in SAP PS?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The project profile, maintained in OPSA, sets defaults for a project type and links the other profiles: planning, budget, settlement, network and status. Choosing a project profile when creating a project applies all of them at once.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Can SAP PS configuration be changed after go-live?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Yes, but carefully. Some settings apply only to new projects, while others affect existing ones immediately. Budget profile changes, for example, may need availability control reactivated with CJBV. Test every change on copies of live projects first.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How long does SAP PS configuration take?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>It depends on the number of project types and integrations. A focused set of three or four project types typically takes a few weeks of configuration inside a larger implementation, with most effort spent on design workshops and testing, not on the settings themselves.</p>
<!-- /wp:paragraph -->
`,
};
