// Building blocks shared by the inner pages: the page hero (with the breadcrumb and the one
// <h1>) and the quote band near the bottom of each page.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS, DRAFT } from '../data/business';
import type { QuoteNav } from '../data/quote';
import { PhotoTag, Scene, Shield } from './Graphics';
import { Pic } from './Pic';
import type { Photo } from '../data/photos';

// A real photo behind a hero (the Home hero and the inner-page heroes). Loads first: it's the LCP.
export function HeroPhoto({ photo }: { photo: Photo }) {
  return <Pic photo={photo} sizes="100vw" className="bgphoto" priority />;
}

// `kicker` is a short line set above the <h1> (Warehousing keeps its tagline there, so the
// heading itself can say what the page is and where).
export function PageHero({ crumb, kicker, title, lede, slot, photo, children }: { crumb: string; kicker?: string; title: ReactNode; lede?: ReactNode; slot?: string; photo?: Photo; children?: ReactNode }) {
  return (
    <div className={photo ? 'phero has-photo' : 'phero'} data-spot="hero">
      {photo ? <HeroPhoto photo={photo} /> : <Scene id="ph" />}
      {DRAFT && slot && !photo && (
        <div className="slot">
          <PhotoTag>{slot}</PhotoTag>
        </div>
      )}
      <div className="wrap inner">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Shield num="84" size={28} />
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li aria-current="page">{crumb}</li>
          </ol>
        </nav>
        {kicker && <p className="eyebrow">{kicker}</p>}
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {children && <div className="actions">{children}</div>}
      </div>
    </div>
  );
}

export function QuoteBand({
  eyebrow = 'Get a quote',
  title,
  text,
  cta = 'Request a Quote',
  state,
  tone = 'dark',
}: {
  eyebrow?: string;
  title: string;
  text?: ReactNode;
  cta?: string;
  state?: QuoteNav;
  tone?: 'dark' | 'light';
}) {
  return (
    <div className={`band ${tone}`} data-spot="quote-band">
      <div className="wrap">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        <div className="actions">
          <Link className="btn btn-red magnetic" to="/contact" state={state}>
            {cta} <span aria-hidden="true">›</span>
          </Link>
          <a className={`btn ${tone === 'dark' ? 'btn-ghost' : 'btn-line'}`} href={BUSINESS.phoneHref}>
            Call {BUSINESS.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  );
}
