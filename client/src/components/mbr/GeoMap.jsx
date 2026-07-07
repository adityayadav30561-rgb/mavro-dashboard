import { useEffect, useMemo, useState } from 'react';

// World choropleth for the MBR Geography section. Zero map libraries —
// equirectangular projection of a bundled 110m GeoJSON, colored by users.
//
// Color: sequential single hue (violet) via an opacity ramp over the card
// surface — lightness stays monotonic and the same ramp works in both themes.
// Countries absent from the 110m geometry (microstates: Singapore, Hong Kong…)
// render as centroid dots so real traffic never silently disappears.

const VIOLET = '263 70% 58%';

// GA4 country name → GeoJSON `properties.name` (110m naming quirks)
const NAME_ALIASES = {
  'United States': 'United States of America',
  'Tanzania': 'United Republic of Tanzania',
  'Serbia': 'Republic of Serbia',
  'Congo - Kinshasa': 'Democratic Republic of the Congo',
  'Congo - Brazzaville': 'Republic of the Congo',
  'Myanmar (Burma)': 'Myanmar',
  "Côte d'Ivoire": 'Ivory Coast',
  'Czechia': 'Czech Republic',
  'North Macedonia': 'Macedonia',
  'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
  'Trinidad & Tobago': 'Trinidad and Tobago',
  'Timor-Leste': 'East Timor',
  'Eswatini': 'Swaziland',
  'Guinea-Bissau': 'Guinea Bissau',
  'Bahamas': 'The Bahamas',
};

// Centroids for GA4 countries the 110m geometry drops (microstates)
const MICRO_CENTROIDS = {
  'Singapore': [103.82, 1.35],
  'Hong Kong': [114.17, 22.32],
  'Macao': [113.55, 22.19],
  'Bahrain': [50.55, 26.05],
  'Malta': [14.4, 35.9],
  'Maldives': [73.5, 4.2],
  'Mauritius': [57.55, -20.3],
  'Seychelles': [55.45, -4.68],
  'Andorra': [1.6, 42.55],
  'Liechtenstein': [9.55, 47.16],
  'Monaco': [7.42, 43.73],
  'San Marino': [12.46, 43.94],
  'Comoros': [43.87, -11.88],
  'Cape Verde': [-23.6, 15.1],
  'Barbados': [-59.54, 13.16],
};

// Projection: equirectangular, latitude clipped to [-58, 84] (drops Antarctica)
const W = 900;
const LAT_MAX = 84;
const LAT_MIN = -58;
const H = Math.round((W * (LAT_MAX - LAT_MIN)) / 360);
const px = (lon) => (((lon + 180) / 360) * W);
const py = (lat) => (((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H);

function ringToPath(ring) {
  let d = '';
  for (let i = 0; i < ring.length; i += 1) {
    const x = px(ring[i][0]).toFixed(1);
    const y = py(ring[i][1]).toFixed(1);
    d += (i === 0 ? 'M' : 'L') + x + ',' + y;
  }
  return d + 'Z';
}

function featureToPath(feature) {
  const g = feature.geometry;
  if (!g) return '';
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  let d = '';
  polys.forEach((poly) => poly.forEach((ring) => { d += ringToPath(ring); }));
  return d;
}

export default function GeoMap({ countries }) {
  const [world, setWorld] = useState(null);
  const [hover, setHover] = useState(null); // { name, users, sessions, x, y }

  useEffect(() => {
    let alive = true;
    import('@/assets/world-countries.geo.json').then((mod) => {
      if (alive) setWorld(mod.default || mod);
    });
    return () => { alive = false; };
  }, []);

  // GeoJSON-name → { users, sessions } + unmatched list
  const { byGeoName, dots, maxUsers } = useMemo(() => {
    const rows = (countries || []).filter((c) => c.country && c.country !== '(not set)');
    const geoNames = new Set((world?.features || []).map((f) => f.properties?.name));
    const map = new Map();
    const dotRows = [];
    let max = 0;
    rows.forEach((c) => {
      max = Math.max(max, c.users);
      const geoName = geoNames.has(c.country) ? c.country : NAME_ALIASES[c.country];
      if (geoName && geoNames.has(geoName)) {
        map.set(geoName, c);
      } else if (MICRO_CENTROIDS[c.country]) {
        dotRows.push({ ...c, lonlat: MICRO_CENTROIDS[c.country] });
      }
    });
    return { byGeoName: map, dots: dotRows, maxUsers: max };
  }, [countries, world]);

  // Sqrt ramp — traffic is heavily skewed; linear would leave all but the
  // top country nearly invisible.
  const alphaFor = (users) => {
    if (!users || maxUsers === 0) return 0;
    return 0.12 + 0.78 * Math.sqrt(users / maxUsers);
  };

  const paths = useMemo(() => {
    if (!world) return [];
    return world.features
      .filter((f) => f.properties?.name !== 'Antarctica')
      .map((f) => ({ name: f.properties?.name || f.id, d: featureToPath(f) }));
  }, [world]);

  if (!world) {
    return <div className="h-[300px] flex items-center justify-center text-[11px] text-muted-foreground">Loading map…</div>;
  }

  const onEnter = (evt, name, data) => {
    const rect = evt.currentTarget.ownerSVGElement.parentNode.getBoundingClientRect();
    setHover({
      name,
      users: data?.users || 0,
      sessions: data?.sessions || 0,
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    });
  };

  return (
    <div className="relative px-3 pb-4 pt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Users by country map">
        {paths.map((p) => {
          const data = byGeoName.get(p.name);
          return (
            <path
              key={p.name}
              d={p.d}
              fill={data ? `hsl(${VIOLET} / ${alphaFor(data.users).toFixed(2)})` : 'hsl(var(--foreground) / 0.05)'}
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              onMouseMove={(e) => onEnter(e, p.name, data)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: data ? 'pointer' : 'default' }}
            />
          );
        })}
        {dots.map((d) => (
          <circle
            key={d.country}
            cx={px(d.lonlat[0])}
            cy={py(d.lonlat[1])}
            r={5 + 6 * Math.sqrt(d.users / (maxUsers || 1))}
            fill={`hsl(${VIOLET} / ${alphaFor(d.users).toFixed(2)})`}
            stroke={`hsl(${VIOLET})`}
            strokeWidth="1"
            onMouseMove={(e) => onEnter(e, d.country, d)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-popover/95 backdrop-blur-xl border border-border px-3 py-2 text-[11px] shadow-xl"
          style={{ left: Math.min(hover.x + 12, 999), top: hover.y + 12 }}
        >
          <p className="font-semibold">{hover.name}</p>
          {hover.users > 0 ? (
            <p className="text-muted-foreground mt-0.5">
              <span className="font-mono font-semibold text-foreground">{hover.users}</span> users ·{' '}
              <span className="font-mono font-semibold text-foreground">{hover.sessions}</span> sessions
            </p>
          ) : (
            <p className="text-muted-foreground mt-0.5">No traffic this month</p>
          )}
        </div>
      )}

      {/* Legend — sequential ramp, low → high */}
      <div className="flex items-center gap-2 px-2 mt-1">
        <span className="text-[10px] text-muted-foreground">0</span>
        <div
          className="h-1.5 w-28 rounded-full"
          style={{ background: `linear-gradient(to right, hsl(${VIOLET} / 0.12), hsl(${VIOLET} / 0.9))` }}
        />
        <span className="text-[10px] text-muted-foreground font-mono">{maxUsers} users</span>
        {dots.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">● dots = countries too small for the map outline</span>
        )}
      </div>
    </div>
  );
}
