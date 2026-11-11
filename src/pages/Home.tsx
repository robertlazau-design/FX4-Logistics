// Home: the short overview. Hero with the bill-of-lading quick quote, the safety strip, one
// highway sign per page, how booking works, and the quote band. The details live on the
// other pages (src/pages/*).
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BUSINESS, SAFETY, TRAILERS } from '../data/business';
import { quoteFor, type QuoteNav, type Trailer } from '../data/quote';
import { Ph } from '../components/Ph';
import { ExitArrow, PhotoTag, Scene, Shield } from '../components/Graphics';
import { QuoteBand } from '../components/PageParts';

const SIGNS = [
  { exit: 1, to: '/trucking', title: 'Trucking', text: 'Flatbed, step deck and dry van, on our own trucks with our own drivers.', go: 'See our trailers' },
  { exit: 2, to: '/warehousing', title: 'Warehousing', text: 'Store it with us until you need it, then we truck it out.', go: 'See the warehouse' },
  { exit: 3, to: '/service-area', title: 'Service Area', text: 'Portland roots, with trucks running across the western states.', go: 'See where we run' },
  { exit: 4, to: '/driver-jobs', title: 'Driver Jobs', text: 'Now hiring Class A CDL drivers to run our own equipment.', go: 'See the job' },
];

const STEPS = [
  { title: 'Call or send the load', text: 'Pickup, delivery, what it is and when. We get back to you with a price.' },
  { title: 'We match the trailer', text: 'Flatbed, step deck, dry van or hopper, based on the load.' },
  { title: 'Our driver hauls it', text: 'Your freight stays on FX4 equipment the whole way. No hand-offs.' },
  { title: 'Delivered, or stored', text: "Straight to the site, or into our warehouse until you're ready." },
];

export default function Home() {
  const navigate = useNavigate();
  const [qq, setQq] = useState<{ from: string; to: string; equip: Trailer }>({ from: '', to: '', equip: 'Flatbed' });
  const onQuick = (e: FormEvent) => {
    e.preventDefault();
    const state: QuoteNav = { quote: { service: 'Trucking (one load)', ...qq }, focus: true };
    navigate('/contact', { state });
  };

  return (
    <>
      {/* HERO */}
      <div className="hero">
        <Scene id="hero" />
        <div className="sweep" aria-hidden="true">
          <span />
        </div>
        <div className="slot">
          <PhotoTag>Photo/video slot: an FX4 flatbed rolling down I-84 in the Gorge</PhotoTag>
        </div>

        <div className="wrap inner">
          <div>
            <div className="exit">
              <Shield num="84" />
              <span>Exit 16 · Wood Village, Oregon</span>
            </div>
            <h1>
              Flatbed, dry van &amp; warehousing <em>from the Portland&nbsp;area.</em>
            </h1>
            <p className="lede">A locally owned carrier, not a broker. Your freight rides on our own trucks with our own drivers, and now we can store it for you too.</p>
            <div className="actions">
              <Link className="btn btn-red magnetic" to="/contact" state={quoteFor('Trucking (one load)')}>
                Request a Quote <span aria-hidden="true">›</span>
              </Link>
              <a className="btn btn-ghost" href={BUSINESS.phoneHref}>
                Call {BUSINESS.phoneDisplay}
              </a>
            </div>
            <div className="decal">
              <span>{BUSINESS.name}</span>
              <span>
                USDOT<b>{BUSINESS.usdot}</b>
              </span>
              <span>
                MC<b>{BUSINESS.mc}</b>
              </span>
            </div>
          </div>

          <div className="bol" role="region" aria-labelledby="qqTitle">
            <div className="bar">
              <span>Quick quote</span>
              <span>Bill of lading · No. ____</span>
            </div>
            <div className="body">
              <h2 id="qqTitle">Where's it going?</h2>
              <p className="small">Three answers and we'll take it from there.</p>
              <form onSubmit={onQuick} noValidate>
                <div className="route">
                  <div className="cell">
                    <label htmlFor="qqFrom">Pickup · city or ZIP</label>
                    <input id="qqFrom" autoComplete="off" placeholder="e.g. Troutdale, OR" value={qq.from} onChange={(e) => setQq({ ...qq, from: e.target.value })} />
                  </div>
                  <div className="cell">
                    <label htmlFor="qqTo">Delivery · city or ZIP</label>
                    <input id="qqTo" autoComplete="off" placeholder="e.g. Boise, ID" value={qq.to} onChange={(e) => setQq({ ...qq, to: e.target.value })} />
                  </div>
                  <div className="cell">
                    <label htmlFor="qqEquip">Trailer</label>
                    <select id="qqEquip" value={qq.equip} onChange={(e) => setQq({ ...qq, equip: e.target.value as Trailer })}>
                      {TRAILERS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="btn btn-red magnetic" type="submit">
                  Start my quote <span aria-hidden="true">›</span>
                </button>
                <p className="fine">
                  Or call <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* TRUST STRIP */}
      <div className="trust" role="region" aria-label="FX4 at a glance">
        <ul className="wrap">
          <li>
            <span className="big">{SAFETY.crashes}</span>
            <span className="what">crashes reported in the last two years*</span>
          </li>
          <li>
            <span className="big">
              {SAFETY.driverOos}
              <small>/{SAFETY.inspections}</small>
            </span>
            <span className="what">driver out-of-service orders in roadside inspections*</span>
          </li>
          <li>
            <span className="big">{BUSINESS.authoritySince}</span>
            <span className="what">our own interstate authority since</span>
          </li>
          <li>
            <span className="big">{SAFETY.trucksOnRecord}</span>
            <span className="what">
              trucks on our FMCSA record* <Ph q="fleet">confirm</Ph>
            </span>
          </li>
          <li className="src">*{SAFETY.source}</li>
        </ul>
      </div>

      {/* ONE SIGN PER PAGE */}
      <section className="exits">
        <div className="wrap">
          <div className="center">
            <p className="eyebrow">What we do</p>
            <h2>Pick your exit.</h2>
            <p className="lede">Trucking on our own equipment, storage when you need it, and driving jobs for Class A drivers.</p>
          </div>
          <ul className="signs">
            {SIGNS.map((s) => (
              <li key={s.to}>
                <Link className="sign" to={s.to}>
                  <span className="tab">Exit {s.exit}</span>
                  <span className="t">{s.title}</span>
                  <span className="s">{s.text}</span>
                  <span className="go">
                    {s.go}
                    <ExitArrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="also">
            Also: <Link to="/about">about FX4</Link> · <Link to="/contact">contact &amp; directions</Link>
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="steps" role="region" aria-label="How booking works">
        <div className="wrap">
          <p className="eyebrow">From call to delivery</p>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="n">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <QuoteBand
        tone="light"
        title="Tell us about the load."
        text={
          <>
            Call <span className="nw">{BUSINESS.phoneDisplay}</span> or send the details, and we'll get back to you with a price.
          </>
        }
        state={quoteFor('Trucking (one load)')}
      />
    </>
  );
}
