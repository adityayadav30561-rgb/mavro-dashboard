// Paper-ledger chart series — validated (dataviz six checks) per surface:
//   light: on card #FBF8F1   dark: on card #1E1913
// Fixed entity→color assignment; never cycle.
export const CHART_SERIES = {
  light: { a: '#c2431f', b: '#0889a6', c: '#5f7a34' }, // vermilion · teal · olive
  dark: { a: '#d2643a', b: '#2ba3bd', c: '#7f9a4b' },
};

export function chartSeries() {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return dark ? CHART_SERIES.dark : CHART_SERIES.light;
}
