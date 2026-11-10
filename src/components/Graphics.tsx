import type { ReactNode } from 'react';

// Shared drawings: the Interstate shield, the tractor used by the trailer drawings, a wheel,
// the FX4 roundel (stand-in until Daniel sends the real logo) and small icons.
export function Sprites() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <symbol id="shield" viewBox="0 0 40 42">
          <path d="M4 3.5Q20 .5 36 3.5 38.6 19 33.4 28.3 28 37.4 20 41 12 37.4 6.6 28.3 1.4 19 4 3.5Z" fill="#1d4f91" stroke="#fff" strokeWidth="2" />
          <path d="M4 3.5Q20 .5 36 3.5L36.6 12H3.4Z" fill="#c8102e" />
        </symbol>
        <g id="cab">
          <path d="M0 52V28q0-3 3-3h12l8 12h6q3 0 3 3v12z" fill="#fffdf8" stroke="#1d3150" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M17 28.5l6 8.5h-6z" fill="#c9d4e2" stroke="#1d3150" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M-2 40h4M3 25V14" stroke="#1d3150" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="4" y="31" width="8" height="2.2" rx="1" fill="#a8332a" />
        </g>
        <g id="wheel">
          <circle r="6.6" fill="#1d3150" />
          <circle r="2.6" fill="#efe9dc" />
        </g>
      </defs>
    </svg>
  );
}

export function Shield({ num, size = 34 }: { num: string; size?: number }) {
  const h = Math.round(size * 1.06);
  return (
    <svg className="shield" style={{ width: size, height: h }} viewBox="0 0 34 36" aria-hidden="true">
      <use href="#shield" width="34" height="36" />
      <text x="17" y="27" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fontSize="13" fill="#fff">
        {num}
      </text>
    </svg>
  );
}

export function Roundel() {
  return (
    <svg className="roundel" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#1d3150" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="#fff" strokeWidth="1.4" opacity=".55" />
      <text x="32" y="37.5" textAnchor="middle" fontFamily="Zilla Slab, Georgia, serif" fontWeight="700" fontSize="19" fill="#fff" letterSpacing=".5">
        FX4
      </text>
      <rect x="21" y="42" width="22" height="2.6" fill="#a8332a" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5f666e" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h3l2-2h6l2 2h3v12H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

// "Photo slot" label on the stand-in frames until the photo shoot.
export function PhotoTag({ children }: { children: string }) {
  return (
    <span className="tag">
      <CameraIcon />
      {children}
    </span>
  );
}

// Side-profile line drawings of the four trailer types (stand-ins until the shoot).
const Rig = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 300 86" aria-hidden="true">
    <g className="truck">
      {children}
      <path d="M192 50h40" stroke="#1d3150" strokeWidth="3" strokeLinecap="round" />
      <use href="#cab" x="224" y="0" />
      <use href="#wheel" x="30" y="56" />
      <use href="#wheel" x="46" y="56" />
      <use href="#wheel" x="198" y="56" />
      <use href="#wheel" x="213" y="56" />
      <use href="#wheel" x="247" y="56" />
      <path d="M4 64h292" stroke="#c9c0b0" strokeWidth="1.5" />
    </g>
  </svg>
);

export function TrailerArt({ kind }: { kind: 'flatbed' | 'stepdeck' | 'dryvan' | 'hopper' }) {
  if (kind === 'flatbed')
    return (
      <Rig>
        <rect x="14" y="40" width="186" height="8" rx="1.5" fill="#fffdf8" stroke="#1d3150" strokeWidth="2.2" />
        <g fill="#e6c79c" stroke="#1d3150" strokeWidth="1.6">
          <rect x="22" y="26" width="52" height="14" />
          <rect x="78" y="22" width="52" height="18" />
          <rect x="134" y="26" width="58" height="14" />
        </g>
        <path d="M48 26v14M104 22v18M163 26v14" stroke="#a8332a" strokeWidth="1.6" />
      </Rig>
    );
  if (kind === 'stepdeck')
    return (
      <Rig>
        <path d="M14 46h112v-8h76v10H14z" fill="#fffdf8" stroke="#1d3150" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M126 38V22h46l10 16z" fill="#c9d4e2" stroke="#1d3150" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M28 46V30h40l14 16" fill="none" stroke="#1d3150" strokeWidth="1.8" strokeLinejoin="round" />
        <circle cx="40" cy="42" r="4" fill="#1d3150" />
        <circle cx="62" cy="42" r="4" fill="#1d3150" />
      </Rig>
    );
  if (kind === 'dryvan')
    return (
      <Rig>
        <rect x="14" y="10" width="190" height="38" rx="2" fill="#fffdf8" stroke="#1d3150" strokeWidth="2.2" />
        <path d="M14 18h190" stroke="#ddd6c8" strokeWidth="1.4" />
        <text x="109" y="37" textAnchor="middle" fontFamily="Zilla Slab, Georgia, serif" fontWeight="700" fontSize="15" fill="#1d3150" letterSpacing="1">
          FX4 LOGISTICS
        </text>
        <rect x="96" y="40" width="26" height="2.4" fill="#a8332a" />
      </Rig>
    );
  return (
    <Rig>
      <path d="M14 16h190v16l-14 16h-30l-12-14h-24l-12 14H82L70 34H46L34 48H26L14 34z" fill="#fffdf8" stroke="#1d3150" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M20 16q89-10 178 0" fill="none" stroke="#1d3150" strokeWidth="1.6" />
      <path d="M14 24h190" stroke="#ddd6c8" strokeWidth="1.4" />
    </Rig>
  );
}
