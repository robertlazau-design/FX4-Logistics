import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DRAFT, BUSINESS } from '../data/business';
import { NAV } from '../data/pages';
import { Ph } from './Ph';
import { PhoneIcon, Roundel } from './Graphics';

export default function Header({ onAgenda, agendaOpen }: { onAgenda: (el: HTMLElement) => void; agendaOpen: boolean }) {
  const { pathname } = useLocation();
  const listRef = useRef<HTMLUListElement>(null);
  // On phones the menu scrolls sideways: keep the current page's item in view.
  useEffect(() => {
    const ul = listRef.current;
    const on = ul?.querySelector<HTMLElement>('a.on');
    if (!ul || !on) return;
    const right = on.offsetLeft + on.offsetWidth;
    if (on.offsetLeft < ul.scrollLeft || right > ul.scrollLeft + ul.clientWidth) ul.scrollLeft = Math.max(0, on.offsetLeft - 20);
  }, [pathname]);
  return (
    <header>
      <a className="skip" href="#main">
        Skip to content
      </a>
      {DRAFT && (
        <div className="draft" role="note">
          <div className="wrap">
            <span>
              <b>Draft preview</b> by Golden Boy Productions.{' '}
              <span className="why-txt">
                <span className="ph">Yellow</span> = confirm with Daniel (numbers match the call agenda). Gray frames and drawings are stand-ins until there are photos for them.
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
            Office: <Ph q="days">Mon–Fri</Ph> {BUSINESS.hours}
          </span>
          <span className="mono">
            USDOT {BUSINESS.usdot} · MC {BUSINESS.mc}
          </span>
        </div>
      </div>

      <div className="head">
        <div className="wrap">
          <Link className="brand" to="/" aria-label="FX4 Logistics home">
            <Roundel />
            <span>
              <span className="name">{BUSINESS.name}</span>
              <span className="sub">
                Trucking &amp; Warehousing<span className="sub-x"> · {BUSINESS.city}, {BUSINESS.region}</span>
              </span>
            </span>
          </Link>
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
            <Link className="btn btn-red magnetic" to="/contact">
              Request a Quote
            </Link>
          </div>
        </div>
      </div>

      <nav className="main" aria-label="Main">
        <ul ref={listRef}>
          {NAV.map((n) => {
            const on = pathname === n.path;
            return (
              <li key={n.path}>
                <Link className={on ? 'on' : undefined} aria-current={on ? 'page' : undefined} to={n.path}>
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
