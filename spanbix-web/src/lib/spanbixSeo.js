// Centralized SEO constants, brand tokens, and structured-data builders for the Spanbix site.
//
// Spanbix is Career Transformation Infrastructure for Enterprise Technologies (SAP ecosystem
// upskilling, campus partnerships, placement readiness). Visual identity: deep enterprise
// navy + professional accent blue, DM Serif Display headlines + Sora UI + JetBrains Mono data.
// Aesthetic target: UpGrad / Coursera Business / LinkedIn Learning / SAP Learning Hub.

export const SPANBIX_SITE = {
  slug: 'spanbix',
  name: 'Spanbix',
  tagline: 'India\'s Premier Enterprise Career Learning Platform',
  description:
    'Spanbix is India\'s premier enterprise career learning platform — purpose-built to bridge the gap between commerce, management, and humanities graduates and the country\'s highest-paying SAP and enterprise technology roles. Structured SAP curriculum, institutional campus partnerships, placement-ready training, and certification under one product roof.',
  url: 'https://www.spanbix.com',
  logo: 'https://www.spanbix.com/spanbix/spanbix-blue.png',
  twitter: '@spanbix',
  // Short ≤155-char variant for the <meta description> / OG tag. The long-form
  // `description` above stays the canonical schema.org description (no length
  // limit there) — Google truncates page meta at ~160 chars, schema does not.
  metaDescription:
    'SAP training in India for commerce, MBA & engineering graduates. Mentor-led FICO, MM, SD & ABAP tracks with placement support. Online + Greater Noida.',
  // Verified contact + registered office — single source of truth, mirrors the
  // /contact page COORDINATES. Used to enrich the EducationalOrganization schema
  // (address / telephone / email). Keep in lockstep with ContactForm.jsx.
  email: 'contact@spanbix.com',
  phone: '+91 93107 93790',
  address: {
    street: 'Galaxy Blue Sapphire Plaza, 1415, Greater Noida West Link Rd, Sector 4',
    locality: 'Greater Noida',
    region: 'Uttar Pradesh',
    postalCode: '201009',
    country: 'IN',
  },
  centres: ['Greater Noida', 'Lucknow'],
  keywords: [
    'SAP training India',
    'SAP careers',
    'enterprise technology training',
    'SAP FICO',
    'SAP MM',
    'SAP SD',
    'SAP ABAP',
    'campus training portal',
    'BBA SAP course',
    'BCom SAP course',
    'MBA SAP course',
    'commerce graduate career',
    'tier-2 SAP training',
    'placement program',
    'campus partnership',
    'career transformation',
    'enterprise career training',
    'ERP careers',
  ],
};

// Canonical brand profiles — single source of truth for schema `sameAs` AND the
// footer social row. Keep in lockstep with Footer.jsx SOCIALS (Footer needs the
// inline brand glyphs; the URLs must match these). Real verified handles only —
// never a bare platform root (e.g. 'https://www.linkedin.com'), which reads as a
// low-quality / placeholder signal to crawlers and LLMs.
export const SPANBIX_SOCIALS = [
  'https://www.linkedin.com/company/118163985',
  'https://www.facebook.com/people/Spanbix-Training-Institute/61590494903596/',
  'https://www.instagram.com/spanbix93',
  'https://www.youtube.com/@Spanbix93',
  'https://in.pinterest.com/spanbix93/',
];

// Brand color tokens — used in component className via inline style or scoped utility wrappers.
// Per UI_VISION rules, tenant accents are baked into per-tenant components, not theme tokens.
export const SPANBIX_BRAND = {
  navy: '#102c56',          // primary surface — navbar, hero, footer, enterprise sections
  accent: '#2764e4',        // CTA, highlights, links, focus states
  accentHover: '#3b82f6',   // hover state
  surfaceLight: '#f5f8ff',  // light background
  surfaceCard: '#ffffff',   // cards
  textDark: '#0f172a',      // headings, body emphasis
  textMuted: '#64748b',     // secondary text
  border: '#dbe4f0',        // soft borders
  success: '#16a34a',
  warning: '#f59e0b',
};

// Public route prefix on the Mavro frontend. Spanbix mirrors the HRMS/Tickets multi-tenant pattern.
export const SPANBIX_BASE_PATH = '/spanbix';

export function spanbixUrl(path = '') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SPANBIX_BASE_PATH}${clean === '/' ? '' : clean}`;
}

// ════════════════════════════════════════════════════════════════════════════
// Career path catalog
// ────────────────────────────────────────────────────────────────────────────
// Currently 4 active tracks: FICO, MM, SD, ABAP. Other modules (HCM,
// SuccessFactors, BASIS, Analytics) are intentionally deferred to a later
// expansion phase. Each entry carries enough metadata to drive the homepage
// card view, the listing page (/spanbix/career-paths), and the per-track
// detail page (/spanbix/career-paths/:code) including:
//   - basic info: code, name, fullName, category, audience, demand, eligibility
//   - pricing: priceIndividual (string), priceMrp (string)
//   - social proof: studentsEnrolled, rating, ratingsCount, lastUpdated, language
//   - learner copy: whatYoullLearn[], includes[], requirements[]
//   - timelines: individualTimeline[] (week-bucketed), campusTimeline[]
//     (month-bucketed, 6-month semester aligned to college placement cycles)
//   - mentor: instructor { name, title, bio }
// Campus pricing is intentionally omitted — campus engagements are negotiated
// with each college T&P / placement cell at the backend, not surfaced publicly.
// ════════════════════════════════════════════════════════════════════════════
export const SPANBIX_CAREER_PATHS = [
  {
    code: 'fico',
    name: 'SAP FICO',
    fullName: 'Finance & Controlling',
    category: 'functional',
    audience: 'For commerce, BBA, BCom, and MBA graduates',
    salaryRange: '₹6L – ₹22L',
    duration: '3 months',
    eligibility: 'No prerequisite',
    demand: 'Very High',
    beginner: true,
    summary:
      'Financial accounting, controlling, asset accounting, and treasury processes inside SAP S/4HANA — the highest-paying functional SAP track for commerce graduates.',
    highlights: [
      'Live S/4HANA sandbox',
      'Capstone + mentor reviews',
      'Placement-aligned outcomes',
      'Personality development module',
    ],
    priceIndividual: '₹49,999',
    priceMrp: '₹65,000',
    studentsEnrolled: '2,400+',
    rating: 4.8,
    ratingsCount: '420+ ratings',
    lastUpdated: 'May 2026',
    language: 'English + Hindi',
    instructor: {
      name: 'Aman Patil',
      title: 'Senior SAP FICO Consultant · S/4HANA',
      bio: 'Aman has delivered 11 SAP FICO implementations across manufacturing, BFSI, and pharma verticals over the last 9 years. Currently leads finance transformation engagements at a global SI partner.',
    },
    whatYoullLearn: [
      'Configure GL, AP, AR, and asset accounting in S/4HANA',
      'Run real month-end and year-end close on a sandbox',
      'Build cost centers, profit centers, and product costing',
      'Present a capstone recruiters can verify',
      'Build interview-ready communication via the personality development module',
    ],
    includes: [
      'Live mentor sessions + recorded library',
      'Hands-on configuration practice',
      'Mentor-reviewed capstone',
      'Mock interview + resume support',
      'Personality development module',
    ],
    requirements: [
      'Commerce or business background recommended (BBA / BCom / MBA)',
      'No prior SAP experience required',
      'Basic accounting awareness helpful (debits, credits, P&L)',
      'Laptop + reliable internet for sandbox access',
    ],
    individualTimeline: [
      {
        id: 'm1',
        title: 'Module 01 · Foundations of S/4HANA',
        meta: 'Weeks 1–2 · 14 lessons · 8h',
        topics: [
          'SAP S/4HANA architecture and Fiori UX',
          'Client, company code, business area setup',
          'Fiscal year variants and posting periods',
          'Currency configuration and exchange rates',
        ],
      },
      {
        id: 'm2',
        title: 'Module 02 · General Ledger Mastery',
        meta: 'Weeks 3–6 · 28 lessons · 22h',
        topics: [
          'New GL configuration and document splitting',
          'Parallel ledgers and group reporting',
          'Financial statement version build-out',
          'Journal posting, recurring entries, and accruals',
        ],
      },
      {
        id: 'm3',
        title: 'Module 03 · AP / AR + Automatic Payments',
        meta: 'Weeks 7–9 · 22 lessons · 18h',
        topics: [
          'Vendor and customer master configuration',
          'Payment terms, dunning, and credit management',
          'Automatic Payment Program (F110) end-to-end',
          'Reconciliation and clearing scenarios',
        ],
      },
      {
        id: 'm4',
        title: 'Module 04 · Asset Accounting + Controlling',
        meta: 'Weeks 10–12 · 20 lessons · 16h',
        topics: [
          'Chart of depreciation and asset master data',
          'Acquisition, transfer, retirement workflows',
          'Cost centers, profit centers, internal orders',
          'Product costing and CO-PA basics',
        ],
      },
      {
        id: 'm5',
        title: 'Module 05 · Integration + Reporting',
        meta: 'Weeks 13–14 · 14 lessons · 10h',
        topics: [
          'FI–SD integration: revenue recognition',
          'FI–MM integration: GR/IR and account determination',
          'Month-end and year-end close cycles',
          'Standard reports + customised analytics layers',
        ],
      },
      {
        id: 'm6',
        title: 'Module 06 · Capstone + Placement',
        meta: 'Weeks 15–16 · Project + Interviews',
        topics: [
          'End-to-end FICO implementation capstone',
          'Resume + LinkedIn rewrite for SAP roles',
          '3 mock interviews with hiring panels',
          'Hiring partner introductions',
        ],
      },
    ],
    campusTimeline: [
      {
        id: 'cm1',
        title: 'Month 01 · Bridge & Foundations',
        meta: 'Aligned to academic calendar',
        topics: [
          'Orientation + cohort kickoff for the college batch',
          'Accounting refresher tuned to commerce streams',
          'Introduction to SAP S/4HANA + Fiori',
          'Attendance + readiness baseline established',
        ],
      },
      {
        id: 'cm2',
        title: 'Month 02 · Core GL + AP/AR',
        meta: 'Cohort labs + mentor sessions',
        topics: [
          'GL configuration on the campus sandbox',
          'Vendor + customer master hands-on',
          'Payment terms + dunning workflows',
          'Mid-module assessment for placement readiness score',
        ],
      },
      {
        id: 'cm3',
        title: 'Month 03 · Asset Accounting + Controlling',
        meta: 'Hands-on intensives',
        topics: [
          'Chart of depreciation builds on the sandbox',
          'Cost centers, profit centers, internal orders',
          'Group projects on costing scenarios',
          'T&P review of cohort progress dashboards',
        ],
      },
      {
        id: 'cm4',
        title: 'Month 04 · Capstone Implementation Project',
        meta: 'College-branded capstone',
        topics: [
          'End-to-end FICO implementation capstone',
          'Group + individual deliverables',
          'Industry mentor review sessions',
          'Co-branded certificate eligibility lock-in',
        ],
      },
      {
        id: 'cm5',
        title: 'Month 05 · Interview Readiness',
        meta: 'Placement prep cycle',
        topics: [
          'Resume + LinkedIn rewrites for the SAP market',
          'Mock interviews tuned to enterprise hiring panels',
          'Salary negotiation + offer review training',
          'Hiring partner shortlist confirmation',
        ],
      },
      {
        id: 'cm6',
        title: 'Month 06 · Placement Cycle',
        meta: 'Direct hiring partner connects',
        topics: [
          'Curated openings shared with the cohort',
          'On-campus + virtual interview rounds',
          'Offer roll-outs + post-placement support',
          'Final cohort report shared with the placement cell',
        ],
      },
    ],
  },

  {
    code: 'mm',
    name: 'SAP MM',
    fullName: 'Materials Management',
    category: 'functional',
    audience: 'For commerce, BBA, and supply-chain graduates',
    salaryRange: '₹5L – ₹18L',
    duration: '3 months',
    eligibility: 'No prerequisite',
    demand: 'High',
    beginner: true,
    summary:
      'Procurement, inventory, vendor management, and supply chain operations across SAP S/4HANA — the core procure-to-pay backbone for every enterprise.',
    highlights: [
      'Procure-to-pay end-to-end',
      'Live S/4HANA sandbox',
      'Real enterprise capstone',
      'Personality development module',
    ],
    priceIndividual: '₹44,999',
    priceMrp: '₹60,000',
    studentsEnrolled: '1,850+',
    rating: 4.7,
    ratingsCount: '310+ ratings',
    lastUpdated: 'May 2026',
    language: 'English + Hindi',
    instructor: {
      name: 'Neha Iyer',
      title: 'Senior SAP MM Consultant · Supply Chain',
      bio: 'Neha has shipped 8 SAP MM deployments across manufacturing and FMCG over the last 7 years. Specialises in procure-to-pay automation, vendor evaluation, and S/4HANA sourcing.',
    },
    whatYoullLearn: [
      'Build the procure-to-pay cycle in S/4HANA',
      'Configure material master, vendor master, and purchasing org',
      'Run inventory + physical inventory + stock transfer',
      'Integrate MM with FI, SD, and PP modules',
      'Build interview-ready communication via the personality development module',
    ],
    includes: [
      'Live mentor sessions + recorded library',
      'Hands-on configuration practice',
      'Mentor-reviewed capstone',
      'Mock interview + resume support',
      'Personality development module',
    ],
    requirements: [
      'Commerce / business / supply-chain background recommended',
      'No prior SAP experience required',
      'Familiarity with basic procurement / inventory terminology helpful',
      'Laptop + reliable internet for sandbox access',
    ],
    individualTimeline: [
      {
        id: 'm1',
        title: 'Module 01 · S/4HANA Foundations + Enterprise Structure',
        meta: 'Weeks 1–2 · 12 lessons · 7h',
        topics: [
          'SAP S/4HANA architecture and Fiori for MM',
          'Plant, storage location, purchasing organisation setup',
          'Material types and number ranges',
          'Org element relationships across MM',
        ],
      },
      {
        id: 'm2',
        title: 'Module 02 · Master Data Mastery',
        meta: 'Weeks 3–4 · 16 lessons · 11h',
        topics: [
          'Material master views in detail',
          'Vendor master + partner functions',
          'Source list and quota arrangement',
          'Purchasing info records',
        ],
      },
      {
        id: 'm3',
        title: 'Module 03 · Procure-to-Pay Cycle',
        meta: 'Weeks 5–7 · 22 lessons · 16h',
        topics: [
          'Purchase requisition + release strategy',
          'RFQ, quotation, and contract handling',
          'Purchase order types and account assignment',
          'Goods receipt and invoice verification',
        ],
      },
      {
        id: 'm4',
        title: 'Module 04 · Inventory Management',
        meta: 'Weeks 8–9 · 14 lessons · 10h',
        topics: [
          'Goods movements and movement types',
          'Stock types and reservation logic',
          'Physical inventory and cycle counting',
          'Reorder point + MRP basics',
        ],
      },
      {
        id: 'm5',
        title: 'Module 05 · Pricing + Taxes + Account Determination',
        meta: 'Weeks 10–11 · 14 lessons · 10h',
        topics: [
          'Pricing procedures and condition tables',
          'Tax determination and integration with FI',
          'Account determination (OBYC)',
          'Custom condition types',
        ],
      },
      {
        id: 'm6',
        title: 'Module 06 · Special Procurement Scenarios',
        meta: 'Week 12 · 8 lessons · 6h',
        topics: [
          'Subcontracting and components issue',
          'Consignment + pipeline procurement',
          'Stock transfer orders (STO)',
          'Third-party processing',
        ],
      },
      {
        id: 'm7',
        title: 'Module 07 · Capstone + Placement',
        meta: 'Weeks 13–14 · Project + Interviews',
        topics: [
          'End-to-end MM implementation capstone',
          'Resume + LinkedIn rewrite for MM roles',
          '3 mock interviews with hiring panels',
          'Hiring partner introductions',
        ],
      },
    ],
    campusTimeline: [
      {
        id: 'cm1',
        title: 'Month 01 · Bridge & Foundations',
        meta: 'Aligned to academic calendar',
        topics: [
          'Orientation + cohort kickoff for the college batch',
          'Supply chain refresher tuned to commerce streams',
          'Introduction to SAP S/4HANA + Fiori for MM',
          'Attendance + readiness baseline established',
        ],
      },
      {
        id: 'cm2',
        title: 'Month 02 · Master Data + Procurement',
        meta: 'Cohort labs + mentor sessions',
        topics: [
          'Material + vendor master hands-on',
          'PR, PO, GR sandbox workflows',
          'Release strategy + approvals',
          'Mid-module assessment',
        ],
      },
      {
        id: 'cm3',
        title: 'Month 03 · Inventory + Pricing + Special Procurement',
        meta: 'Hands-on intensives',
        topics: [
          'Inventory + physical inventory scenarios',
          'Pricing and tax determination',
          'Subcontracting + consignment + STO',
          'T&P review of cohort progress dashboards',
        ],
      },
      {
        id: 'cm4',
        title: 'Month 04 · Capstone Implementation Project',
        meta: 'College-branded capstone',
        topics: [
          'End-to-end MM implementation capstone',
          'Group + individual deliverables',
          'Industry mentor review sessions',
          'Co-branded certificate eligibility lock-in',
        ],
      },
      {
        id: 'cm5',
        title: 'Month 05 · Interview Readiness',
        meta: 'Placement prep cycle',
        topics: [
          'Resume + LinkedIn rewrites for the SAP market',
          'Mock interviews tuned to enterprise hiring panels',
          'Salary negotiation + offer review training',
          'Hiring partner shortlist confirmation',
        ],
      },
      {
        id: 'cm6',
        title: 'Month 06 · Placement Cycle',
        meta: 'Direct hiring partner connects',
        topics: [
          'Curated openings shared with the cohort',
          'On-campus + virtual interview rounds',
          'Offer roll-outs + post-placement support',
          'Final cohort report shared with the placement cell',
        ],
      },
    ],
  },

  {
    code: 'sd',
    name: 'SAP SD',
    fullName: 'Sales & Distribution',
    category: 'functional',
    audience: 'For commerce, BBA, and MBA graduates',
    salaryRange: '₹5L – ₹19L',
    duration: '3 months',
    eligibility: 'No prerequisite',
    demand: 'High',
    beginner: true,
    summary:
      'Order-to-cash, pricing, billing, and customer fulfillment workflows across SAP S/4HANA — the revenue engine of every enterprise running SAP.',
    highlights: [
      'Order-to-cash end-to-end',
      'Pricing + billing config',
      'Mock interviews tuned to SIs',
      'Personality development module',
    ],
    priceIndividual: '₹44,999',
    priceMrp: '₹60,000',
    studentsEnrolled: '1,620+',
    rating: 4.7,
    ratingsCount: '270+ ratings',
    lastUpdated: 'May 2026',
    language: 'English + Hindi',
    instructor: {
      name: 'Rohit Sharma',
      title: 'Senior SAP SD Consultant · Order-to-Cash',
      bio: 'Rohit has led 7 SAP SD rollouts across pharma, FMCG, and global retail over the last 8 years. Specialises in pricing strategy, credit management, and S/4HANA migration.',
    },
    whatYoullLearn: [
      'Master order-to-cash in S/4HANA end-to-end',
      'Configure enterprise structure, sales areas, document types',
      'Build pricing procedures + condition records',
      'Run delivery, billing, and credit management',
      'Build interview-ready communication via the personality development module',
    ],
    includes: [
      'Live mentor sessions + recorded library',
      'Hands-on configuration practice',
      'Mentor-reviewed capstone',
      'Mock interview + resume support',
      'Personality development module',
    ],
    requirements: [
      'Commerce / business background recommended (BBA / BCom / MBA)',
      'No prior SAP experience required',
      'Awareness of basic sales / billing terminology helpful',
      'Laptop + reliable internet for sandbox access',
    ],
    individualTimeline: [
      {
        id: 'm1',
        title: 'Module 01 · S/4HANA Foundations + Enterprise Structure',
        meta: 'Weeks 1–2 · 12 lessons · 7h',
        topics: [
          'SAP S/4HANA architecture and Fiori for SD',
          'Sales org, distribution channel, division setup',
          'Sales area concept and assignments',
          'Org element relationships across SD',
        ],
      },
      {
        id: 'm2',
        title: 'Module 02 · Master Data + Customer Setup',
        meta: 'Weeks 3–4 · 16 lessons · 11h',
        topics: [
          'Customer master views in detail',
          'Material master from SD perspective',
          'Customer-material info records',
          'Partner determination and account groups',
        ],
      },
      {
        id: 'm3',
        title: 'Module 03 · Sales Document Processing',
        meta: 'Weeks 5–7 · 22 lessons · 16h',
        topics: [
          'Inquiries, quotations, contracts',
          'Standard order, rush order, cash sale',
          'Item categories and schedule lines',
          'Availability check and ATP basics',
        ],
      },
      {
        id: 'm4',
        title: 'Module 04 · Delivery + Shipping',
        meta: 'Weeks 8–9 · 14 lessons · 10h',
        topics: [
          'Delivery types and item categories',
          'Picking, packing, and post goods issue',
          'Shipping point determination',
          'Route determination + transportation basics',
        ],
      },
      {
        id: 'm5',
        title: 'Module 05 · Pricing + Billing',
        meta: 'Weeks 10–11 · 14 lessons · 10h',
        topics: [
          'Pricing procedures and condition technique',
          'Billing types and document flow',
          'Revenue recognition basics',
          'Tax determination + integration with FI',
        ],
      },
      {
        id: 'm6',
        title: 'Module 06 · Credit Management + Integrations',
        meta: 'Week 12 · 8 lessons · 6h',
        topics: [
          'Credit management configuration',
          'Output determination + EDI basics',
          'SD–MM, SD–FI integration scenarios',
          'Reporting and analytics',
        ],
      },
      {
        id: 'm7',
        title: 'Module 07 · Capstone + Placement',
        meta: 'Weeks 13–14 · Project + Interviews',
        topics: [
          'End-to-end SD implementation capstone',
          'Resume + LinkedIn rewrite for SD roles',
          '3 mock interviews with hiring panels',
          'Hiring partner introductions',
        ],
      },
    ],
    campusTimeline: [
      {
        id: 'cm1',
        title: 'Month 01 · Bridge & Foundations',
        meta: 'Aligned to academic calendar',
        topics: [
          'Orientation + cohort kickoff for the college batch',
          'Sales process refresher tuned to commerce streams',
          'Introduction to SAP S/4HANA + Fiori for SD',
          'Attendance + readiness baseline established',
        ],
      },
      {
        id: 'cm2',
        title: 'Month 02 · Customer Master + Sales Documents',
        meta: 'Cohort labs + mentor sessions',
        topics: [
          'Customer + material master hands-on',
          'Inquiry, quotation, order workflows',
          'Item categories and schedule lines',
          'Mid-module assessment',
        ],
      },
      {
        id: 'cm3',
        title: 'Month 03 · Delivery + Pricing + Billing',
        meta: 'Hands-on intensives',
        topics: [
          'Delivery and shipping configuration',
          'Pricing procedures and condition records',
          'Billing types and revenue recognition',
          'T&P review of cohort progress dashboards',
        ],
      },
      {
        id: 'cm4',
        title: 'Month 04 · Capstone Implementation Project',
        meta: 'College-branded capstone',
        topics: [
          'End-to-end SD implementation capstone',
          'Group + individual deliverables',
          'Industry mentor review sessions',
          'Co-branded certificate eligibility lock-in',
        ],
      },
      {
        id: 'cm5',
        title: 'Month 05 · Interview Readiness',
        meta: 'Placement prep cycle',
        topics: [
          'Resume + LinkedIn rewrites for the SAP market',
          'Mock interviews tuned to enterprise hiring panels',
          'Salary negotiation + offer review training',
          'Hiring partner shortlist confirmation',
        ],
      },
      {
        id: 'cm6',
        title: 'Month 06 · Placement Cycle',
        meta: 'Direct hiring partner connects',
        topics: [
          'Curated openings shared with the cohort',
          'On-campus + virtual interview rounds',
          'Offer roll-outs + post-placement support',
          'Final cohort report shared with the placement cell',
        ],
      },
    ],
  },

  {
    code: 'abap',
    name: 'SAP ABAP',
    fullName: 'Advanced Business Application Programming',
    category: 'technical',
    audience: 'For engineering and technical graduates',
    salaryRange: '₹6L – ₹24L',
    duration: '3 months',
    eligibility: 'Programming basics',
    demand: 'High',
    beginner: false,
    summary:
      'Custom development, RICEFW objects, and S/4HANA extension programming — the highest-paying technical SAP track for engineering graduates.',
    highlights: [
      'RICEFW + S/4HANA extensions',
      'Production-grade capstone',
      'Senior code reviews',
      'Personality development module',
    ],
    priceIndividual: '₹59,999',
    priceMrp: '₹78,000',
    studentsEnrolled: '1,450+',
    rating: 4.8,
    ratingsCount: '290+ ratings',
    lastUpdated: 'May 2026',
    language: 'English + Hindi',
    instructor: {
      name: 'Karthik Subramaniam',
      title: 'Senior SAP ABAP / S/4HANA Developer',
      bio: 'Karthik has delivered 14 RICEFW packages, custom Z-extensions, and S/4HANA migration objects across BFSI and manufacturing clients over the last 11 years.',
    },
    whatYoullLearn: [
      'Master ABAP workbench, Data Dictionary, internal tables',
      'Build ALV reports + module pool programs',
      'Implement OO-ABAP, BADIs, and user exits',
      'Handle BDC, LSMW, and modern data migration',
      'Ship a production-grade RICEFW capstone',
      'Build interview-ready communication via the personality development module',
    ],
    includes: [
      'Live mentor sessions + recorded library',
      'Coding labs + code reviews',
      'Mentor-reviewed capstone',
      'Mock interview + resume support',
      'Personality development module',
    ],
    requirements: [
      'Engineering / technical background recommended (BTech / BCA / MCA)',
      'Basic programming literacy (any language)',
      'Comfort with logic, loops, and data structures',
      'Laptop + reliable internet for SAP dev sandbox',
    ],
    individualTimeline: [
      {
        id: 'm1',
        title: 'Module 01 · SAP Foundations + ABAP Workbench',
        meta: 'Weeks 1–2 · 14 lessons · 9h',
        topics: [
          'SAP architecture and application server basics',
          'ABAP workbench tools (SE38, SE80)',
          'ABAP syntax, variables, control flow',
          'Transport requests and ABAP lifecycle',
        ],
      },
      {
        id: 'm2',
        title: 'Module 02 · Data Dictionary + Internal Tables',
        meta: 'Weeks 3–4 · 18 lessons · 13h',
        topics: [
          'Domains, data elements, tables, structures',
          'Search helps, lock objects, views',
          'Internal tables and work areas',
          'Open SQL + native SQL basics',
        ],
      },
      {
        id: 'm3',
        title: 'Module 03 · Modularization + Reports',
        meta: 'Weeks 5–7 · 22 lessons · 17h',
        topics: [
          'Subroutines, function modules, includes',
          'Classical and interactive reporting',
          'ALV reports (function-module + OO ALV)',
          'Selection screens and parameters',
        ],
      },
      {
        id: 'm4',
        title: 'Module 04 · Module Pool + Dialog Programming',
        meta: 'Weeks 8–10 · 22 lessons · 16h',
        topics: [
          'Screen painter and flow logic',
          'Tabstrip, table control, sub-screens',
          'PBO and PAI module structure',
          'Field validation patterns',
        ],
      },
      {
        id: 'm5',
        title: 'Module 05 · Data Migration + Forms',
        meta: 'Weeks 11–13 · 20 lessons · 15h',
        topics: [
          'BDC (call transaction + session method)',
          'LSMW workbench end-to-end',
          'SAPScript form basics',
          'SmartForms and Adobe Forms',
        ],
      },
      {
        id: 'm6',
        title: 'Module 06 · OO ABAP + Enhancements',
        meta: 'Weeks 14–16 · 22 lessons · 17h',
        topics: [
          'Classes, methods, inheritance, interfaces',
          'OO ALV and grid programming',
          'BADIs, user exits, customer enhancements',
          'Implicit + explicit enhancement framework',
        ],
      },
      {
        id: 'm7',
        title: 'Module 07 · Web Dynpro + Modern ABAP',
        meta: 'Weeks 17–18 · 16 lessons · 12h',
        topics: [
          'Web Dynpro ABAP basics',
          'CDS views and AMDP basics',
          'OData service exposure',
          'S/4HANA programming model overview',
        ],
      },
      {
        id: 'm8',
        title: 'Module 08 · Capstone RICEFW + Placement',
        meta: 'Weeks 19–20 · Project + Interviews',
        topics: [
          'Production-grade RICEFW capstone with code review',
          'Resume + GitHub rewrite for ABAP roles',
          '3 mock technical interviews with senior consultants',
          'Hiring partner introductions',
        ],
      },
    ],
    campusTimeline: [
      {
        id: 'cm1',
        title: 'Month 01 · Bridge & Foundations',
        meta: 'Aligned to academic calendar',
        topics: [
          'Orientation + cohort kickoff for the college batch',
          'Programming refresher tuned to engineering streams',
          'SAP architecture + ABAP workbench tour',
          'Attendance + readiness baseline established',
        ],
      },
      {
        id: 'cm2',
        title: 'Month 02 · DDIC + Core ABAP',
        meta: 'Lab-heavy month',
        topics: [
          'Data Dictionary objects + internal tables',
          'Open SQL hands-on labs',
          'Modularization and classical reports',
          'Mid-module code-review assessment',
        ],
      },
      {
        id: 'cm3',
        title: 'Month 03 · Dialog Programming + Data Migration',
        meta: 'Hands-on intensives',
        topics: [
          'Module pool programming workshops',
          'BDC + LSMW labs',
          'Forms (SmartForms / Adobe Forms)',
          'T&P review of cohort progress dashboards',
        ],
      },
      {
        id: 'cm4',
        title: 'Month 04 · OO ABAP + Enhancements + Modern ABAP',
        meta: 'Advanced cohort sprint',
        topics: [
          'Object-oriented ABAP design exercises',
          'BADIs, user exits, enhancement framework',
          'CDS views, AMDP, OData basics',
          'Group code-review sessions',
        ],
      },
      {
        id: 'cm5',
        title: 'Month 05 · Capstone RICEFW Project',
        meta: 'College-branded capstone',
        topics: [
          'Production-grade RICEFW capstone',
          'Senior consultant code-review sessions',
          'Co-branded certificate eligibility lock-in',
          'Project showcase day with hiring partners',
        ],
      },
      {
        id: 'cm6',
        title: 'Month 06 · Interview Readiness',
        meta: 'Placement prep cycle',
        topics: [
          'Resume + GitHub rewrites for the ABAP market',
          'Mock technical interviews with hiring panels',
          'Salary negotiation + offer review training',
          'Hiring partner shortlist confirmation',
        ],
      },
      {
        id: 'cm7',
        title: 'Month 07 · Placement Cycle',
        meta: 'Direct hiring partner connects',
        topics: [
          'Curated openings shared with the cohort',
          'On-campus + virtual interview rounds',
          'Offer roll-outs + post-placement support',
          'Final cohort report shared with the placement cell',
        ],
      },
    ],
  },

  {
    code: 'ai',
    name: 'AI Mastery',
    fullName: 'Practical AI for Work, Creation & Building',
    category: 'ai',
    audience: 'For 12th-pass students, graduates & beginners',
    salaryRange: '₹4L – ₹18L+',
    duration: '3 months',
    eligibility: '12th pass · any stream',
    demand: 'Explosive',
    beginner: true,
    summary:
      'From zero to AI-ready in 12 weeks — master prompt engineering, generative AI across text, image, video and audio, just-enough Python and machine-learning basics, AI agents and no-code automation, and ship 3 capstone projects. A practical, job-focused course on using AI effectively with 50+ tools — built for 12th-pass students and beginners with no coding background.',
    highlights: [
      'Prompt engineering — the #1 AI skill',
      '50+ AI tools across text, image, video & audio',
      '3 capstone projects + job-ready portfolio',
      'Personality development module',
    ],
    priceIndividual: '₹24,999',
    priceMrp: '₹39,000',
    studentsEnrolled: '900+',
    rating: 4.9,
    ratingsCount: '160+ ratings',
    lastUpdated: 'June 2026',
    language: 'English + Hindi',
    instructor: {
      name: 'Kabir Anand',
      title: '8+ Years AI / ML Industry Experience · Active Practitioner',
      bio: 'Kabir is a working AI/ML practitioner with 8+ years building AI products and automation systems. He teaches hands-on, tool-first, and brings in guest sessions from working AI professionals at startups and product companies.',
    },
    whatYoullLearn: [
      'Master prompt engineering — zero/one/few-shot, chain-of-thought, system prompts',
      'Generate text, images, video, and audio with 50+ AI tools',
      'Write just-enough Python and build ML models with scikit-learn',
      'Build AI agents, RAG chatbots, and no-code automations (Make / n8n)',
      'Ship 3 capstone projects + a GitHub & LinkedIn portfolio',
      'Crack interviews via the personality development module + mock rounds',
    ],
    includes: [
      '84 hrs live instruction + 60 hrs hands-on tool practice',
      'Access to 50+ AI tools (free tier + educator accounts arranged)',
      '3 capstone projects: AI chatbot, image classifier, automation agent',
      'GitHub + LinkedIn + AI-tailored resume build-out',
      '2+ recorded mock interviews with panel feedback',
      'Personality development module (every Sunday)',
    ],
    requirements: [
      '12th pass, any stream — no prior coding or tech experience',
      'No AI background needed — start from absolute basics',
      'A laptop + reliable internet',
      'Willingness to practise hands-on in every class',
    ],
    individualTimeline: [
      {
        id: 'm1',
        title: 'Module 01 · What is AI? How It Works & Why It Matters',
        meta: 'Phase 1 · Week 1',
        topics: [
          'AI, ML, deep learning & neural networks — zero jargon',
          'How LLMs (ChatGPT) are trained; tokenization',
          'Narrow vs General vs Super AI — reality vs sci-fi',
          'ChatGPT / Claude / Gemini side-by-side; your first prompt',
        ],
      },
      {
        id: 'm2',
        title: 'Module 02 · Prompt Engineering (the #1 AI skill)',
        meta: 'Phase 1 · Weeks 1–2',
        topics: [
          'Anatomy of a great prompt: role, context, task, format, constraints',
          'Zero/one/few-shot + chain-of-thought prompting',
          'System prompts, personas, and prompt chaining',
          'Advanced: Tree of Thought, ReAct, self-consistency',
        ],
      },
      {
        id: 'm3',
        title: 'Module 03 · Text Generation & AI Writing Tools',
        meta: 'Phase 2 · Week 3',
        topics: [
          'ChatGPT, Claude, Gemini, Perplexity for real writing tasks',
          'Custom GPTs, file uploads, code interpreter, browsing',
          'Notion AI, Jasper, Copy.ai for content & marketing',
          'AI for study: summaries, flashcards, practice questions',
        ],
      },
      {
        id: 'm4',
        title: 'Module 04 · AI Image Generation & Design',
        meta: 'Phase 2 · Weeks 3–4',
        topics: [
          'Diffusion models — Midjourney, DALL·E 3, Stable Diffusion',
          'Adobe Firefly, Canva AI, Leonardo, Ideogram',
          'Style, aspect ratios, inpainting, outpainting, upscaling',
          'Design a full social-media content pack',
        ],
      },
      {
        id: 'm5',
        title: 'Module 05 · AI Video, Audio & Multimodal',
        meta: 'Phase 2 · Weeks 4–5',
        topics: [
          'Text-to-video: Runway, Kling, Sora, Pika',
          'AI avatars (HeyGen, Synthesia); CapCut & Descript editing',
          'Voice & music: ElevenLabs, Murf, Suno',
          'Produce a 60-second AI explainer end-to-end',
        ],
      },
      {
        id: 'm6',
        title: 'Module 06 · Python Essentials for AI',
        meta: 'Phase 3 · Weeks 5–6',
        topics: [
          'Just-enough Python: variables, loops, functions, files',
          'NumPy, Pandas, Matplotlib; Jupyter & Google Colab',
          'Using AI (ChatGPT / Copilot) to write Python for you',
          'Analyse a real dataset and plot insights in Colab',
        ],
      },
      {
        id: 'm7',
        title: 'Module 07 · Machine Learning Concepts & Models',
        meta: 'Phase 3 · Weeks 6–7',
        topics: [
          'Supervised, unsupervised & reinforcement learning',
          'Linear regression, decision trees, random forest',
          'scikit-learn: fit / predict / evaluate; train-test split',
          'No-code ML: Google Teachable Machine & AutoML',
        ],
      },
      {
        id: 'm8',
        title: 'Module 08 · AI Automation & No-Code Workflows',
        meta: 'Phase 4 · Week 8',
        topics: [
          'Make.com, n8n, Zapier — drag-and-drop AI automation',
          'Auto-summarise email → Notion; auto-post content',
          'Airtable + AI; resume screener; news-digest bot',
          'Build: Google Form → AI summary → WhatsApp',
        ],
      },
      {
        id: 'm9',
        title: 'Module 09 · AI Agents & Advanced Systems',
        meta: 'Phase 4 · Weeks 8–9',
        topics: [
          'AI agents that take actions (OpenAI Assistants API)',
          'AutoGPT, AgentGPT, CrewAI — multi-agent systems',
          'RAG over your own docs (LlamaIndex, LangChain basics)',
          'No-code chatbots: Voiceflow, Botpress, custom GPTs',
        ],
      },
      {
        id: 'm10',
        title: 'Module 10 · AI in Industries & Real-World Use',
        meta: 'Phase 5 · Week 10',
        topics: [
          'AI in healthcare, finance, education, marketing',
          'E-commerce, HR, and creator workflows',
          'Where AI creates value (and where it does not)',
          'Present how one industry uses AI (AI-built deck)',
        ],
      },
      {
        id: 'm11',
        title: 'Module 11 · AI Ethics, Safety & Responsible AI',
        meta: 'Phase 5 · Weeks 10–11',
        topics: [
          'Hallucinations, fact-checking, and verifying AI output',
          'Bias, deepfakes, and detecting AI-generated content',
          'Copyright & data privacy (India + global reality)',
          'Responsible-AI guidelines for students & professionals',
        ],
      },
      {
        id: 'm12',
        title: 'Module 12 · Microsoft Copilot & Productivity AI',
        meta: 'Phase 5 · Week 11',
        topics: [
          'Copilot in Word, Excel, PowerPoint, Outlook, Teams',
          'Google Workspace AI (Duet) as an alternative',
          'Notion AI workspace — an AI second brain',
          'Produce a full deliverable using Office Copilot only',
        ],
      },
      {
        id: 'm13',
        title: 'Module 13 · Capstone Projects, Portfolio & Career',
        meta: 'Phase 6 · Week 12',
        topics: [
          'Capstone 1: AI chatbot (custom GPT / RAG)',
          'Capstone 2: AI image classifier deployed as a web app',
          'Capstone 3: AI automation agent (n8n / Make)',
          'Portfolio, GitHub, LinkedIn + mock interviews',
        ],
      },
    ],
    campusTimeline: [
      {
        id: 'cm1',
        title: 'Month 01 · AI Foundations & Prompting',
        meta: 'Aligned to academic calendar',
        topics: [
          'Cohort kickoff + the AI landscape for students',
          'How models work and where they fail',
          'Prompt engineering fundamentals on real tasks',
          'Readiness baseline established',
        ],
      },
      {
        id: 'cm2',
        title: 'Month 02 · Creative AI — Image, Video & Content',
        meta: 'Cohort labs + mentor sessions',
        topics: [
          'AI image and design workflows',
          'AI video, voice, and short-form content',
          'Content + research automation',
          'Mid-module assessment for readiness score',
        ],
      },
      {
        id: 'cm3',
        title: 'Month 03 · Building with AI',
        meta: 'Hands-on intensives',
        topics: [
          'Building apps with AI-assisted no/low-code tools',
          'Automations and AI agents',
          'Group projects on real problems',
          'T&P review of cohort progress',
        ],
      },
      {
        id: 'cm4',
        title: 'Month 04 · Capstone + Showcase',
        meta: 'College-branded capstone',
        topics: [
          'End-to-end AI capstone project',
          'Portfolio + showcase day',
          'Industry mentor review sessions',
          'Co-branded certificate eligibility lock-in',
        ],
      },
      {
        id: 'cm5',
        title: 'Month 05 · Readiness + Placement Support',
        meta: 'Placement prep cycle',
        topics: [
          'Resume + portfolio rewrites for AI-aware roles',
          'Mock interviews and communication training',
          'Personality development module',
          'Hiring partner introductions where applicable',
        ],
      },
    ],
  },
];

// Helper — resolve a track by code. Returns null when not found so consumer
// routes can render a clean 404 surface instead of crashing.
export function getCareerPath(code) {
  if (!code) return null;
  return SPANBIX_CAREER_PATHS.find((p) => p.code === code.toLowerCase()) || null;
}

// Campus track is its own pseudo-program surfaced in the homepage Career Paths
// pill switcher. Keeps the institutional offer visible at the same hierarchy as
// the consumer SAP tracks without diluting the SAP catalog itself.
export const SPANBIX_CAMPUS_PROGRAM = {
  code: 'campus',
  name: 'Spanbix Campus',
  fullName: 'Institutional Career Infrastructure',
  audience: 'For engineering, commerce, and management colleges',
  duration: 'Annual cohorts',
  eligibility: 'College T&P / placement cells',
  badge: 'B2B Partnership',
  tagline: 'Bring SAP-ready career infrastructure into your placement office.',
  highlights: [
    'Individual guidance even in group class',
    'Industry-aligned curriculum',
    'T&P in sync with all classes and updates',
    'Personality development module — complimentary',
  ],
};

// Market validation tile copy — Section 02 of the homepage.
// Numbers sourced from the Spanbix Strategic Proposal 2026 (Executive Summary).
export const SPANBIX_MARKET_SIGNALS = [
  { label: 'Average certified SAP consultant CTC in India', value: '₹4.7L+', unit: 'starting' },
  { label: 'Commerce graduates entering the workforce each year', value: '38M+', unit: 'graduates' },
  { label: 'Of Indian graduates aware of SAP careers', value: '<2%', unit: 'awareness gap' },
  { label: 'Size of India\'s SAP training market', value: '₹900Cr+', unit: 'addressable' },
];

// Canonical organization node. EducationalOrganization is a subtype of
// Organization, so a single EducationalOrganization node satisfies both — no
// need to emit a separate Organization node (which produced duplicate,
// conflicting entities). Stable `@id` lets other schema (WebSite.publisher,
// Course.provider) reference this one entity instead of restating it.
export function educationalOrganizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SPANBIX_SITE.url}/#organization`,
    name: SPANBIX_SITE.name,
    url: SPANBIX_SITE.url,
    logo: SPANBIX_SITE.logo,
    description: SPANBIX_SITE.description,
    email: SPANBIX_SITE.email,
    telephone: SPANBIX_SITE.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SPANBIX_SITE.address.street,
      addressLocality: SPANBIX_SITE.address.locality,
      addressRegion: SPANBIX_SITE.address.region,
      postalCode: SPANBIX_SITE.address.postalCode,
      addressCountry: SPANBIX_SITE.address.country,
    },
    areaServed: { '@type': 'Country', name: 'India' },
    founder: { '@type': 'Person', name: 'LalitMohan Parihar' },
    sameAs: SPANBIX_SOCIALS,
    // Registered entity name confirmed by the founder (July 2026).
    legalName: 'Spanbix Technologies Private Limited',
    // NOTE: foundingDate / CIN / GST intentionally omitted — not verified yet.
    // Add only with confirmed registration data, never placeholder.
  };
}

// Deprecated alias — kept so any straggling importer keeps working, but it now
// returns the SAME consolidated EducationalOrganization node. Do not add a
// second, plain-Organization node to a page; emit educationalOrganizationLd once.
export function organizationLd() {
  return educationalOrganizationLd();
}

// Homepage WebSite node + sitelinks SearchAction. Makes the site eligible for a
// Google sitelinks search box and gives LLMs an explicit search entry point.
// `target` points at the blog search surface; `{search_term_string}` is the
// required Google token.
export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SPANBIX_SITE.url}/#website`,
    url: SPANBIX_SITE.url,
    name: SPANBIX_SITE.name,
    description: SPANBIX_SITE.description,
    publisher: { '@id': `${SPANBIX_SITE.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SPANBIX_SITE.url}/blog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function faqLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

// Google Course rich-result eligibility needs BOTH hasCourseInstance and offers.
//   - hasCourseInstance: how the course actually runs (online, instructor-led,
//     ~3-month workload). courseWorkload is an ISO-8601 duration (P3M).
//   - offers: required node, but we deliberately omit the numeric `price` —
//     Spanbix policy is "no pricing on the public site / crawlable surface"
//     (enrolment is a conversation, see CourseDetailView Campus-mode rule). The
//     Offer still carries currency + availability + the enrol URL, which is
//     valid schema; it just won't surface a price chip. Add price ONLY on
//     explicit approval to flip pricing public.
export function courseLd(course) {
  const courseUrl = `${SPANBIX_SITE.url}/career-paths/${course.code}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.summary,
    url: courseUrl,
    // Self-contained provider (not an @id ref) — course pages don't emit the
    // organization node, so a bare @id would dangle. Homepage WebSite.publisher
    // CAN use @id because the org node is present there.
    provider: {
      '@type': 'EducationalOrganization',
      name: SPANBIX_SITE.name,
      url: SPANBIX_SITE.url,
      sameAs: SPANBIX_SOCIALS,
    },
    inLanguage: ['en', 'hi'],
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: 'P3M',
      location: {
        '@type': 'VirtualLocation',
        url: courseUrl,
      },
      instructor: course.instructor?.name
        ? { '@type': 'Person', name: course.instructor.name }
        : undefined,
    },
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${SPANBIX_SITE.url}/contact`,
    },
  };
}

export function blogPostingLd(blog, url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.excerpt,
    image: blog.ogImage || blog.featuredImage,
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    author: blog.author?.name
      ? {
          '@type': 'Person',
          name: blog.author.name,
          ...(blog.author.jobTitle && { jobTitle: blog.author.jobTitle }),
          ...(blog.author.bio && { description: blog.author.bio }),
          ...(blog.author.avatar && { image: blog.author.avatar }),
          ...(blog.author.linkedinUrl && {
            url: blog.author.linkedinUrl,
            sameAs: [blog.author.linkedinUrl],
          }),
        }
      : { '@type': 'Organization', name: SPANBIX_SITE.name },
    publisher: {
      '@type': 'Organization',
      name: SPANBIX_SITE.name,
      logo: { '@type': 'ImageObject', url: SPANBIX_SITE.logo },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

// schema.org/FAQPage — emitted only when a blog ships a structured `faq`
// array. The questions/answers MUST mirror a visible FAQ section in the
// article body (Google rich-result policy). Answers are plain text; strip any
// HTML before passing in so the markup stays valid.
export function faqPageLd(faq) {
  if (!Array.isArray(faq) || faq.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq
      .filter((f) => f && f.question && f.answer)
      .map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
  };
}

export function blogListLd(blogs, baseUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: blogs.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${baseUrl}/${b.slug}`,
      name: b.title,
    })),
  };
}

// ──────── Faculty roster ────────
// Single source of truth for mentor cards. Imported by Mentors carousel on
// homepage / about page AND by the mentor carousel on each course detail page.
export const SPANBIX_MENTORS = [
  {
    name: 'LalitMohan Parihar',
    role: 'Senior SAP Consultant',
    exp: '15+',
    tag: 'SAP MM · SD',
    image: '/spanbix/lalit.png',
    currently: 'Highly experienced in SAP MM and SD. Multiple MNC implementations, supervised large cross-functional rollouts.',
  },
  {
    name: 'Abhishek Singh',
    role: 'Senior SAP Consultant',
    exp: '15+',
    tag: 'SAP SD · ABAP',
    image: '/spanbix/abhishek.png',
    currently: 'Highly experienced in SAP SD and ABAP. Worked across multiple MNCs on full-cycle implementations.',
  },
  {
    name: 'Aman Verma',
    role: 'SAP Consultant',
    exp: '5+',
    tag: 'SAP MM',
    image: '/spanbix/aman%20verma.png',
    currently: 'Strong delivery experience in SAP MM. Multiple implementation projects across MNC clients.',
  },
  {
    name: 'Mayank Rastogi',
    role: 'SAP Consultant',
    exp: '5+',
    tag: 'SAP ABAP',
    image: '/spanbix/mayank%20rastogi.png',
    currently: 'Hands-on SAP ABAP developer. Multiple implementation projects with global delivery teams.',
  },
];
