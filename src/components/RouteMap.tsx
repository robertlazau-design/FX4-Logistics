// Schematic route map (not to scale): the interstates out of Wood Village.
// I-5 north to Washington and south to California, I-84 east to Idaho and on to Utah,
// I-15 up to Montana, I-80 across to Wyoming and west to Nevada and the Bay Area, and I-25
// down to Colorado. The lines draw in the first time the map
// scrolls into view (usePlayOnScroll); without JavaScript or with reduced motion they're
// simply drawn.
import { useRef, type CSSProperties } from 'react';
import { usePlayOnScroll } from '../effects';

const ROUTES: { d: string; color: string; delay: number }[] = [
  { d: 'M118 192C112 150 104 112 96 70', color: '#c9d4e2', delay: 0.1 },
  { d: 'M118 192C108 260 96 330 86 430', color: '#c9d4e2', delay: 0.2 },
  { d: 'M118 192C170 200 220 230 300 246', color: '#e8c58e', delay: 0.35 },
  { d: 'M300 246C330 290 352 330 372 378', color: '#e8c58e', delay: 0.7 },
  { d: 'M300 246C336 196 380 150 420 104', color: '#9fb0c6', delay: 0.9 },
  { d: 'M372 378C410 350 448 330 486 316', color: '#9fb0c6', delay: 1.05 },
  { d: 'M372 378C320 368 274 366 228 368', color: '#c9d4e2', delay: 1.1 },
  { d: 'M228 368C180 392 130 412 86 430', color: '#c9d4e2', delay: 1.25 },
  { d: 'M486 316C498 350 506 386 508 420', color: '#9fb0c6', delay: 1.3 },
];
const SHIELDS = [
  { x: 88, y: 112, n: '5' },
  { x: 80, y: 300, n: '5' },
  { x: 196, y: 196, n: '84' },
  { x: 330, y: 296, n: '84' },
  { x: 362, y: 150, n: '15' },
  { x: 424, y: 326, n: '80' },
  { x: 286, y: 336, n: '80' },
  { x: 504, y: 352, n: '25' },
];
const NODES = [
  { cx: 96, cy: 70, label: 'WA', tx: 112, ty: 74, color: '#c9d4e2', delay: 0.4 },
  { cx: 86, cy: 430, label: 'CA', tx: 102, ty: 434, color: '#c9d4e2', delay: 0.5 },
  { cx: 300, cy: 246, label: 'ID', tx: 314, ty: 238, color: '#e8c58e', delay: 0.6 },
  { cx: 372, cy: 378, label: 'UT', tx: 386, ty: 398, color: '#e8c58e', delay: 0.95 },
  { cx: 420, cy: 104, label: 'MT', tx: 436, ty: 108, color: '#9fb0c6', delay: 1.1 },
  { cx: 486, cy: 316, label: 'WY', tx: 470, ty: 296, color: '#9fb0c6', delay: 1.25 },
  { cx: 228, cy: 368, label: 'NV', tx: 206, ty: 394, color: '#c9d4e2', delay: 1.35 },
  { cx: 508, cy: 420, label: 'CO', tx: 476, ty: 446, color: '#9fb0c6', delay: 1.5 },
];

const css = (vars: Record<string, string>) => vars as CSSProperties;

export default function RouteMap() {
  const ref = useRef<HTMLDivElement>(null);
  usePlayOnScroll(ref, {
    prepare: (el) =>
      el.querySelectorAll<SVGPathElement>('.route').forEach((r) => {
        try {
          r.style.setProperty('--len', String(Math.ceil(r.getTotalLength()) + 2));
        } catch {
          /* keep the default length */
        }
      }),
  });
  return (
    <div className="map" ref={ref}>
      <svg viewBox="0 0 560 470" role="img" aria-labelledby="mapT mapD">
        <title id="mapT">Route map</title>
        <desc id="mapD">From Wood Village, Oregon: I-5 north to Washington and south to California, I-84 east to Idaho and Utah, I-15 to Montana, I-80 to Wyoming and west to Nevada and San Francisco, and I-25 to Colorado.</desc>
        <path d="M0 78H560M0 156H560M0 234H560M0 312H560M0 390H560M80 0V470M190 0V470M300 0V470M410 0V470M520 0V470" stroke="#2a3b57" strokeWidth="1" opacity=".6" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {ROUTES.map((r) => (
            <path key={r.d} className="route" style={css({ '--len': '300', '--d': `${r.delay}s` })} d={r.d} stroke={r.color} strokeWidth="3.5" />
          ))}
        </g>
        <g className="shieldg" style={css({ '--d': '.5s' })} fontFamily="IBM Plex Mono, monospace" fontWeight="600" textAnchor="middle" fill="#fff">
          {SHIELDS.map((s) => (
            <g key={`${s.x}-${s.y}`} transform={`translate(${s.x} ${s.y})`}>
              <use href="#shield" width="30" height="32" />
              <text x="15" y="22" fontSize="10">
                {s.n}
              </text>
            </g>
          ))}
        </g>
        <g fontFamily="IBM Plex Mono, monospace" fontSize="13" fontWeight="600" letterSpacing="1.5">
          {NODES.map((n) => (
            <g key={n.label} className="node" style={css({ '--d': `${n.delay}s` })}>
              <circle cx={n.cx} cy={n.cy} r="7" fill="#0f1a2b" stroke={n.color} strokeWidth="2.5" />
              <text x={n.tx} y={n.ty} fill={n.color}>
                {n.label}
              </text>
            </g>
          ))}
        </g>
        <g>
          <circle cx="118" cy="192" r="16" fill="#a8332a" opacity=".25" />
          <circle cx="118" cy="192" r="9" fill="#a8332a" stroke="#fff" strokeWidth="2.5" />
          <text x="138" y="150" fontFamily="Zilla Slab, Georgia, serif" fontWeight="700" fontSize="17" fill="#fff">
            Wood Village, OR
          </text>
          <text x="138" y="168" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="1.5" fill="#9fb0c6">
            HOME BASE · I-84 EXIT 16
          </text>
        </g>
      </svg>
      <p className="legend">
        Schematic, not to scale
      </p>
    </div>
  );
}
