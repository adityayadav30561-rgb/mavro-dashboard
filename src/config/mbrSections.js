/**
 * Manual MBR workstream section definitions — single source of truth for the
 * admin tiles (form fields + table columns) AND the Excel export sheets.
 * Served to the frontend via GET /api/mbr/sections.
 *
 * Column: { key, label, width (excel col width), type: 'text'|'date'|'select', options? }
 */
const MBR_SECTIONS = [
  {
    key: 'ppts_videos',
    label: 'PPTs & Videos',
    sheet: 'PPTs & Videos',
    description: 'Decks and videos delivered this period',
    columns: [
      { key: 'type', label: 'Type', width: 10, type: 'select', options: ['PPT', 'Video', 'Doc', 'Other'] },
      { key: 'title', label: 'Title', width: 38 },
      { key: 'topic', label: 'Topic / Theme', width: 44 },
      { key: 'status', label: 'Status', width: 14, type: 'select', options: ['Delivered', 'In Making', 'On Hold', 'Planned'] },
      { key: 'notes', label: 'Notes', width: 52 },
    ],
  },
  {
    key: 'work_log',
    label: 'Work Log',
    sheet: 'Work Log',
    description: 'SEO / development tasks shipped — with risk & impact analysis',
    columns: [
      { key: 'date', label: 'Date', width: 12, type: 'date' },
      { key: 'project', label: 'Project', width: 16, type: 'select', options: ['Spanbix SEO', 'Spanbix Dev', 'SaiSatwik SEO', 'LMS', 'Dashboard', 'Other'] },
      { key: 'category', label: 'Category', width: 18 },
      { key: 'work', label: 'Work Done', width: 60 },
      { key: 'risk', label: 'Risk if Skipped', width: 52 },
      { key: 'outcome', label: 'Outcome / Impact', width: 52 },
    ],
  },
  {
    key: 'other_projects',
    label: 'Other Projects',
    sheet: 'Other Projects',
    description: 'Everything else — client sites, tooling, one-offs',
    columns: [
      { key: 'project', label: 'Project', width: 26 },
      { key: 'status', label: 'Status', width: 18, type: 'select', options: ['Delivered', 'In Progress', 'Awaiting Client', 'On Hold', 'Planned'] },
      { key: 'notes', label: 'Notes / Detail', width: 70 },
    ],
  },
  {
    key: 'manual_leads',
    label: 'Leads (manual / LinkedIn)',
    sheet: 'Leads Log',
    description: 'Leads captured outside the website forms (LinkedIn outreach, referrals) — merged into the export Leads Log',
    columns: [
      { key: 'date', label: 'Date', width: 14, type: 'date' },
      { key: 'name', label: 'Name', width: 22 },
      { key: 'contact', label: 'Email / Phone', width: 28 },
      { key: 'service', label: 'Service', width: 30 },
      { key: 'source', label: 'Source', width: 16 },
      { key: 'notes', label: 'Notes', width: 56 },
    ],
  },
];

const sectionByKey = (key) => MBR_SECTIONS.find((s) => s.key === key) || null;

module.exports = { MBR_SECTIONS, sectionByKey };
