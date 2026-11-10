import { DRAFT, BUSINESS } from '../data/business';
import { Ph } from './Ph';
import { PhoneIcon, Roundel } from './Graphics';

const NAV = [
  { label: 'Home', hash: 'top' },
  { label: 'Trucking', hash: 'services' },
  { label: 'Warehousing', hash: 'warehouse' },
  { label: 'About Us', hash: 'about' },
  { label: 'Service Area', hash: 'area' },
  { label: 'Driver Jobs', hash: 'drivers' },
  { label: 'Contact', hash: 'contact' },
];

// base is '' on the home page (in-page links) and '/' elsewhere (back to the home page).
export default function Header({ base, onAgenda, agendaOpen }: { base: string; onAgenda: (el: HTMLElement) => void; agendaOpen: boolean }) {
  return (
    <header>
      {DRAFT && (
        <div className="draft" role="note">
          <div className="wrap">
            <span>
              <b>Draft preview</b> by Golden Boy Productions.{' '}
              <span className="why-txt">
                <span className="ph">Yellow</span> = confirm with Daniel (numbers match the call agenda). Gray frames and drawings get swapped for the photo shoot.
              </span>
            </span>
            <button type="button" aria-controls="agenda" aria-expanded={agendaOpen} onClick={(e) => onAgenda(e.currentTarget)}>
              Call agenda ›
            </button>
          </div>
        </div>
      )}

      <div className="topbar">
        <div className="wrap">
          <span>
            {BUSINESS.street} · {BUSINESS.city}, {BUSINESS.region} {BUSINESS.zip}
          </span>
          <span className="hide-sm">
            Office: <Ph q="hours">office hours</Ph>
          </span>
          <span className="mono">
            USDOT {BUSINESS.usdot} · MC {BUSINESS.mc}
          </span>
        </div>
      </div>

      <div className="head">
        <div className="wrap">
          <a className="brand" href={`${base}#top`} aria-label="FX4 Logistics home">
            <Roundel />
            <span>
              <span className="name">{BUSINESS.name}</span>
              <span className="sub">
                Trucking &amp; Warehousing<span className="sub-x"> · {BUSINESS.city}, {BUSINESS.region}</span>
              </span>
            </span>
          </a>
          <div className="callbox">
            <div className="lbl">
              Call for a quote
              <a className="num" href={BUSINESS.phoneHref}>
                {BUSINESS.phoneDisplay}
              </a>
            </div>
            <a className="ph-icon" href={BUSINESS.phoneHref} aria-label={`Call FX4 at ${BUSINESS.phoneDisplay}`}>
              <PhoneIcon />
            </a>
            <a className="btn btn-red magnetic" href={`${base}#contact`}>
              Request a Quote
            </a>
          </div>
        </div>
      </div>

      <nav className="main" aria-label="Main">
        <ul>
          {NAV.map((n, i) => (
            <li key={n.hash}>
              <a className={i === 0 && base === '' ? 'on' : undefined} aria-current={i === 0 && base === '' ? 'page' : undefined} href={`${base}#${n.hash}`}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
