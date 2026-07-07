// Domain inks — one accent per product area so sections carry wayfinding.
// Values reference the theme's --glow-* custom properties (paper inks in
// Paper Ledger, brighter variants in Midnight Study — theme-aware for free).
//
//   command  → vermilion  (Dashboard, MBR)
//   analytics→ teal
//   content  → olive      (Blogs, Calendar)
//   leads    → madder
//   seo      → ochre
export const INKS = {
  vermilion: { var: '--glow-violet', text: 'text-violet-400' },
  teal: { var: '--glow-cyan', text: 'text-cyan-400' },
  olive: { var: '--glow-emerald', text: 'text-emerald-400' },
  ochre: { var: '--glow-amber', text: 'text-amber-400' },
  madder: { var: '--glow-rose', text: 'text-rose-400' },
};

export const inkColor = (ink, alpha) => {
  const def = INKS[ink] || INKS.vermilion;
  return alpha != null ? `hsl(var(${def.var}) / ${alpha})` : `hsl(var(${def.var}))`;
};

export const inkText = (ink) => (INKS[ink] || INKS.vermilion).text;
