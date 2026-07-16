/**
 * SaiSatwik blog post - SAP EPPM cluster spoke #10 (licensing).
 * Sourced from SAP-EPPM-PS-Blog-Keyword-Plan.xlsx -> Knowledge Blogs -> K06.
 * Primary keyword: SAP EPPM licensing. Secondary: SAP EPPM cost, EPPM license
 * types. Intent: informational (traffic engine), Priority 3, geo-neutral.
 * House style: plain, direct, no em dashes, no filler words. Traffic-intent
 * template from SAISATWIK_BLOG_PUBLISHING.md.
 */

module.exports = {
  title: 'SAP EPPM Licensing Explained: Models, Cost Drivers, and Fit',
  slug: 'sap-eppm-licensing-explained',

  excerpt:
    'How SAP EPPM licensing works: the per-module structure, named-user vs metric licensing, what actually drives cost, and how on-premise, private and public cloud differ.',

  categories: ['SAP'],
  tags: [
    'SAP EPPM',
    'SAP S/4HANA',
    'Enterprise Portfolio Management',
    'For CFOs',
    'For CTOs',
    'Pricing Guide',
  ],

  content: `<!-- wp:heading -->
<h2 class="wp-block-heading">Quick Answer</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP EPPM licensing is not one license. Each module (SAP PS, PPM, IM, CPM, CATS) is licensed separately, usually by named user or by a usage metric, on top of the underlying <a href="https://www.sap.com/products/erp/s4hana.html" target="_blank" rel="noopener">SAP S/4HANA</a> entitlement, and SAP publishes the framework in its <a href="https://www.sap.com/about/trust-center/agreements/pricing.html" target="_blank" rel="noopener">software pricing and licensing terms</a>. SAP PS ships inside the S/4HANA core, while SAP PPM and SAP CPM are typically priced as add-ons. The main cost drivers are how many modules you deploy, how many named users touch them, and whether you run on-premise, private cloud, or public cloud. SAP does not publish list prices, so real figures come from a quote. SaiSatwik helps clients scope the <a href="https://saisatwik.com/what-is-sap-eppm-and-why-top-enterprises-are-switching-to-it/">SAP EPPM</a> footprint to the modules and user counts they actually need, which is where most of the licensing spend is decided.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How is SAP EPPM licensed?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SAP EPPM is licensed at the module level, not as a single bundle. This surprises buyers who expect one "EPPM license" line item. In reality, the five modules carry different licensing treatment, and what you pay depends on which ones you turn on.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Module</th><th>Typical Licensing Treatment</th><th>Notes</th></tr></thead><tbody><tr><td><strong>SAP PS</strong> (Project System)</td><td>Included in the SAP S/4HANA core</td><td>Most enterprises already have the entitlement</td></tr><tr><td><strong>SAP PPM</strong> (Portfolio &amp; PM)</td><td>Separate add-on license</td><td>Priced by named user in most agreements</td></tr><tr><td><strong>SAP IM</strong> (Investment Management)</td><td>Part of the finance/controlling scope</td><td>Check whether existing FICO entitlement covers it</td></tr><tr><td><strong>SAP CPM</strong> (Commercial PM)</td><td>Separate add-on license</td><td>Common for EPC and services firms</td></tr><tr><td><strong>SAP CATS</strong> (Time Sheet)</td><td>Included with the core / HCM scope</td><td>Rarely a standalone cost</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>The practical takeaway is that SAP PS and SAP CATS are usually already paid for, while SAP PPM and SAP CPM are where new license cost appears. Confirming your existing entitlements before a quote is the fastest way to avoid paying twice.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What are the SAP EPPM licensing models?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Across the modules, SAP applies two broad licensing models. Knowing which one applies to a module changes how you forecast cost as the business grows.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Model</th><th>How It Is Counted</th><th>Best Fit</th></tr></thead><tbody><tr><td>Named-user licensing</td><td>Per individual who accesses the module, by user type (professional, functional, developer)</td><td>Modules with a defined set of project and finance users</td></tr><tr><td>Metric-based licensing</td><td>By a business measure such as spend under management or project value</td><td>Portfolio-scale usage where user counts are hard to bound</td></tr><tr><td>Subscription (cloud)</td><td>Annual subscription bundling software, infrastructure and updates</td><td>S/4HANA Cloud editions</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>Named-user licensing is the most common for EPPM add-ons. Under it, the user type matters: a professional user who configures the system costs more than a functional user who only enters timesheets or reviews dashboards. Getting the user-type mix right is a real lever on the final number.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">What drives SAP EPPM licensing cost?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Four factors move an SAP EPPM licensing quote more than anything else. None of them is the software list price, because SAP negotiates.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><strong>Module count.</strong> Every add-on module (PPM, CPM) you deploy adds a license line. Running two modules is a different quote from running all five.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Named-user count and mix.</strong> The number of users and their user types drive named-user cost. Overstating professional users is a common overspend.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Deployment model.</strong> On-premise (perpetual license plus maintenance) and cloud (annual subscription) are structured differently and are hard to compare on a single number.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><strong>Existing SAP entitlements.</strong> If SAP PS and SAP CATS are already covered by your S/4HANA and HCM licenses, only the true add-ons cost extra.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>According to <a href="https://www.gartner.com/en/information-technology/insights/software-asset-management" target="_blank" rel="noopener">Gartner software asset management research</a>, license optimisation, not price negotiation alone, is where most enterprises recover software spend. For EPPM that means scoping the module and user footprint precisely before the quote, not after.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does deployment model affect SAP EPPM licensing?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>The same EPPM modules are licensed differently depending on where they run. The deployment choice sets the commercial shape of the deal.</p>
<!-- /wp:paragraph -->

<!-- wp:table -->
<figure class="wp-block-table"><table><thead><tr><th>Deployment</th><th>License Structure</th><th>Cost Shape</th></tr></thead><tbody><tr><td>S/4HANA on-premise</td><td>Perpetual license + annual maintenance (typically ~22%)</td><td>Higher upfront, lower recurring</td></tr><tr><td>S/4HANA Cloud, private edition</td><td>Annual subscription, SAP-managed infrastructure</td><td>Predictable recurring, less upfront</td></tr><tr><td>S/4HANA Cloud, public edition</td><td>Annual subscription, standardised scope</td><td>Lowest entry, leanest feature set</td></tr></tbody></table></figure>
<!-- /wp:table -->

<!-- wp:paragraph -->
<p>The <a href="https://saisatwik.com/sap-eppm-architecture-and-integration-overview/">SAP EPPM architecture</a> is the same across all three, so the choice is commercial and operational rather than functional. Capital-project-heavy businesses that need full SAP PS and SAP IM depth usually land on private edition or on-premise.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">How does SaiSatwik help scope SAP EPPM licensing?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>SaiSatwik does not sell SAP licenses, and that is the point. The SaiSatwik team works on the buyer side: mapping which modules the business genuinely needs, auditing existing SAP entitlements so nothing is double-paid, and right-sizing the named-user mix before a quote is requested.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>That scoping work usually moves the number more than any discount negotiation, because a smaller, correct footprint is cheaper every year, not just at signing. The <a href="https://saisatwik.com/services/sap/eppm/">SaiSatwik SAP EPPM practice</a> pairs this licensing scope with the implementation plan so the two decisions stay aligned.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Related SaiSatwik Reading</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>These companion guides cover the rest of the SAP EPPM buying picture:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/what-is-sap-eppm-and-why-top-enterprises-are-switching-to-it/">What is SAP EPPM and why top enterprises are switching to it</a>. The definitional pillar for the suite being licensed.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-modules-explained-ps-ppm-im-cpm-cats/">SAP EPPM modules explained: PS, PPM, IM, CPM and CATS</a>. The module detail behind every license line.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-architecture-and-integration-overview/">SAP EPPM architecture and integration</a>. Where each licensed module sits in the landscape.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/sap-eppm-implementation-roadmap/">SAP EPPM implementation roadmap</a>. How licensing scope feeds the rollout plan.</li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="https://saisatwik.com/how-to-choose-the-right-erp-partner-for-your-business-in-2026/">How to choose the right ERP partner in 2026</a>. The buyer-side partner decision that precedes any license commitment.</li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">FAQs about SAP EPPM licensing</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Does SAP publish SAP EPPM prices?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>No. SAP does not publish EPPM list prices, and figures quoted online are estimates. Real pricing comes from a quote based on your module scope, named-user count and deployment model, and it is negotiable. Any specific rupee or dollar figure should be treated as indicative until SAP or an SAP partner confirms it.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is SAP PS licensed separately in EPPM?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Usually not. SAP PS ships inside the SAP S/4HANA core, so most enterprises already hold the entitlement. The separately licensed EPPM add-ons are typically SAP PPM and SAP CPM, which is where new license cost appears.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">What is the difference between named-user and metric licensing?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Named-user licensing charges per individual who accesses a module, priced by user type. Metric-based licensing charges by a business measure such as spend under management. Named-user is the more common EPPM model; metric licensing appears at portfolio scale where user counts are hard to bound.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">Is cloud or on-premise cheaper for SAP EPPM?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Neither is universally cheaper. On-premise is a perpetual license plus annual maintenance, so it is higher upfront and lower recurring. Cloud is an annual subscription, so it is lower upfront and predictable recurring. The right choice depends on cash-flow preference, IT operating model and how much EPPM depth the business needs.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading">How can I reduce SAP EPPM licensing cost?</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Scope precisely before requesting a quote: deploy only the modules you need, audit existing SAP entitlements so SAP PS and CATS are not double-paid, and right-size the named-user mix by user type. License optimisation at scoping time saves more, every year, than a one-time discount.</p>
<!-- /wp:paragraph -->
`,
};
