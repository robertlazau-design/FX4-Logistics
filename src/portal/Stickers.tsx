// Printable QR stickers, one per trailer and truck. Each code opens that unit's portal page.
// The portal has no logins, so the unit page shows nothing a stranger could misuse: no codes,
// just "call David".
// Loaded only on this screen, so the QR library never reaches the rest of the site.
import qrcode from 'qrcode-generator';
import { UNITS } from './data';
import { Icon, Page, Sample } from './ui';
import { FX4Logo } from '../components/Logo';

function Qr({ text, label }: { text: string; label: string }) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const q = 4; // quiet zone, in modules
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  return (
    <svg className="pt-qr" viewBox={`0 0 ${n + q * 2} ${n + q * 2}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width="100%" height="100%" fill="#fff" />
      <path d={d} fill="#0f1a2b" />
    </svg>
  );
}

export default function Stickers() {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return (
    <Page title="QR stickers" back={{ to: '/portal/office', label: 'Office' }} wide>
      <p className="pt-lede pt-noprint">
        One for every unit: the landing-gear post on trailers, inside the driver’s door on trucks. Print on outdoor label stock.
      </p>
      <div className="pt-row2 pt-noprint">
        <button className="pt-btn red" type="button" onClick={() => window.print()}>
          <Icon name="file" /> Print stickers
        </button>
      </div>
      <p className="pt-fine pt-noprint">
        These point at {origin}. Reprint once FX4’s web address is set. <Sample>Sample units</Sample>
      </p>
      <ul className="pt-stickers">
        {UNITS.map((u) => {
          const url = `${origin}/portal/unit/${u.id}`;
          return (
            <li key={u.id} className="pt-sticker">
              <Qr text={url} label={`QR code for ${u.label}`} />
              <div>
                <FX4Logo className="pt-st-logo" title="FX4 Logistics" />
                <p className="pt-st-unit">{u.label}</p>
                <p className="pt-st-kind">{u.kindLabel}</p>
                <p className="pt-st-scan">Scan for this unit’s lock, guides and problem report</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
