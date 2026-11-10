import { useRef, useState, type FormEvent } from 'react';
import { BUSINESS, HAULS, LOCAL_TOWNS, SAFETY, SERVICE_OPTIONS, STATES, TRAILERS } from '../data/business';
import { Ph } from '../components/Ph';
import { PhotoTag, Shield, TrailerArt } from '../components/Graphics';
import RouteMap from '../components/RouteMap';
import { reducedMotion, usePlayOnScroll } from '../effects';

type Service = (typeof SERVICE_OPTIONS)[number];
type Trailer = (typeof TRAILERS)[number];
type QuoteState = { service: Service; equip: Trailer; from: string; to: string };

const RIGS: { kind: 'flatbed' | 'stepdeck' | 'dryvan' | 'hopper'; title: string; text: string; fits: string[]; equip: Trailer; cta: string; confirm?: string }[] = [
  { kind: 'flatbed', title: 'Flatbed', text: 'Lumber, steel and building materials, strapped and tarped by experienced drivers.', fits: ['Lumber', 'Steel', 'Building materials'], equip: 'Flatbed', cta: 'Get a flatbed quote' },
  { kind: 'stepdeck', title: 'Step Deck', text: 'Machinery and taller loads that need the lower deck to stay under height limits.', fits: ['Machinery', 'Tall loads', 'Equipment'], equip: 'Step deck', cta: 'Get a step deck quote' },
  { kind: 'dryvan', title: 'Dry Van', text: 'Palletized and general freight that needs to stay covered from pickup to delivery.', fits: ['Pallets', 'General freight', 'Boxed goods'], equip: 'Dry van', cta: 'Get a dry van quote' },
  { kind: 'hopper', title: 'Hopper & Farm Loads', text: 'Grain, feed and farm supplies for growers and suppliers around the region.', fits: ['Grain', 'Feed', 'Farm supplies'], equip: 'Hopper', cta: 'Get a hopper quote', confirm: 'hopper' },
];

const STEPS = [
  { title: 'Call or send the load', text: 'Pickup, delivery, what it is and when. We get back to you with a price.' },
  { title: 'We match the trailer', text: 'Flatbed, step deck, dry van or hopper, based on the load.' },
  { title: 'Our driver hauls it', text: 'Your freight stays on FX4 equipment the whole way. No hand-offs.' },
  { title: 'Delivered, or stored', text: "Straight to the site, or into our warehouse until you're ready." },
];

const scrollToContact = () => {
  document.getElementById('contact')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  setTimeout(() => document.getElementById('name')?.focus({ preventScroll: true }), reducedMotion() ? 0 : 600);
};

export default function Home() {
  const [quote, setQuote] = useState<QuoteState>({ service: 'Trucking (one load)', equip: 'Flatbed', from: '', to: '' });
  const [qq, setQq] = useState<{ from: string; to: string; equip: Trailer }>({ from: '', to: '', equip: 'Flatbed' });
  const [sent, setSent] = useState(false);
  const lbRef = useRef<HTMLDivElement>(null);
  usePlayOnScroll(lbRef, { threshold: 0.4 });

  const pick = (service: Service, equip?: Trailer) => setQuote((q) => ({ ...q, service, equip: equip ?? q.equip }));
  const onQuick = (e: FormEvent) => {
    e.preventDefault();
    setQuote({ service: 'Trucking (one load)', equip: qq.equip, from: qq.from, to: qq.to });
    scrollToContact();
  };
  const trucking = quote.service.startsWith('Trucking');
  const storage = quote.service.includes('storage');
  const driver = quote.service === 'Driver job';

  return (
    <>
      {/* HERO */}
      <div className="hero">
        <div className="scene" aria-hidden="true">
          {/* Stand-in scene until the shoot: dusk on I-84 through the Gorge */}
          <svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0f1a2b" />
                <stop offset=".55" stopColor="#233a5e" />
                <stop offset=".8" stopColor="#7a4a46" />
                <stop offset="1" stopColor="#c98a5c" />
              </linearGradient>
              <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2a3446" />
                <stop offset="1" stopColor="#121a27" />
              </linearGradient>
            </defs>
            <rect width="1440" height="700" fill="url(#sky)" />
            <path d="M0 395 170 330 300 360 470 300 640 352 780 318 930 360 1080 300 1240 350 1440 310V700H0Z" fill="#2c3d5b" opacity=".85" />
            <path d="M0 430 210 372 380 410 560 360 720 402 900 366 1060 404 1250 362 1440 398V700H0Z" fill="#1d2b44" />
            <path d="M0 470 260 432 520 456 760 430 1010 452 1240 428 1440 446V700H0Z" fill="#162238" />
            <path d="M560 700 700 452H740L880 700Z" fill="url(#road)" />
            <path d="M720 460V700" stroke="#e8c58e" strokeWidth="3" strokeDasharray="18 26" opacity=".7" />
            <path d="M560 700 700 452M880 700 740 452" stroke="#c9d4e2" strokeWidth="2" opacity=".35" />
            <circle cx="1030" cy="296" r="2" fill="#fff" opacity=".6" />
            <circle cx="380" cy="200" r="1.4" fill="#fff" opacity=".5" />
            <circle cx="1210" cy="160" r="1.2" fill="#fff" opacity=".5" />
          </svg>
        </div>
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
              <a className="btn btn-red magnetic" href="#contact">
                Request a Quote <span aria-hidden="true">›</span>
              </a>
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

      {/* ABOUT / WELCOME NOTE */}
      <section id="about" className="note">
        <div className="wrap two">
          <div>
            <p className="eyebrow">A note from the owner</p>
            <h2>A trucking company you can actually call.</h2>
            <p>
              FX4 Logistics is based right off I-84 at exit 16 in Wood Village. We've held our own interstate authority since 2022, and we run our own flatbeds, step decks, dry vans and hoppers. We are a carrier, not a broker, so the company you book is the company that shows up.
            </p>
            <p>
              We haul lumber, steel, machinery, building materials and farm loads across Oregon, Washington, California and the Mountain West. With our new warehouse in <Ph q="wh-city">city</Ph>, we can hold your freight until you need it and deliver it on your schedule.
            </p>
            <p>
              Our sister company, {BUSINESS.sister}, repairs heavy trucks and trailers at the same address, so our equipment gets looked after in-house. <Ph q="bridgetown">confirm</Ph>
            </p>
            <div className="sig">
              <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
                <circle cx="23" cy="23" r="22" fill="#efe9dc" stroke="#ddd6c8" />
                <circle cx="23" cy="18" r="7" fill="#c9c0b0" />
                <path d="M9 38c3-7 8-10 14-10s11 3 14 10" fill="#c9c0b0" />
              </svg>
              <div>
                <span className="line">
                  <Ph q="name">Daniel ______</Ph>
                </span>
                <small>
                  <Ph q="name">Owner</Ph> · {BUSINESS.name}
                </small>
              </div>
            </div>
          </div>
          <div className="stack">
            <div className="photo warm">
              <PhotoTag>Photo slot: Daniel and the crew in front of the trucks at the yard</PhotoTag>
            </div>
            <div className="stamp">
              <b>Same address</b>
              <span>Trucks, shop and office at 23605 NE Halsey St.</span>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPMENT */}
      <section id="services" className="cream">
        <div className="wrap">
          <div className="center">
            <p className="eyebrow">Our equipment</p>
            <h2>Pick the trailer. We'll bring the truck.</h2>
            <p className="lede">Full truckload service on our own equipment, plus storage when you need a place to keep it.</p>
          </div>
          <div className="fleet">
            {RIGS.map((r, i) => (
              <article className="rig" key={r.kind}>
                <div className="art">
                  <span className="no">0{i + 1}</span>
                  <TrailerArt kind={r.kind} />
                </div>
                <div className="body">
                  <h3>{r.title}</h3>
                  <p>
                    {r.text} {r.confirm && <Ph q={r.confirm}>confirm</Ph>}
                  </p>
                  <ul className="fits">
                    {r.fits.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <a className="more" href="#contact" onClick={() => pick('Trucking (one load)', r.equip)}>
                    {r.cta} <span aria-hidden="true">›</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
          <ul className="hauls" aria-label="What we haul">
            <li>We haul:</li>
            {HAULS.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
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

      {/* WHY + CARRIER PACKET */}
      <section>
        <div className="wrap why">
          <div>
            <p className="eyebrow">Why shippers stay with us</p>
            <h2>The company you book is the company that shows up.</h2>
            <ul className="checks">
              <li>
                <b>Our trucks, our drivers.</b> Your load isn't handed off to a carrier you've never heard of.
              </li>
              <li>
                <b>A real person answers.</b> Call <Ph q="answers">Daniel / dispatch</Ph> directly for pickup times and updates.
              </li>
              <li>
                <b>Clean driver record.</b> No driver out-of-service orders in {SAFETY.inspections} roadside inspections and no reported crashes in the last two years.*
              </li>
              <li>
                <b>Trucking and storage in one place.</b> One company, one invoice, from our dock to yours.
              </li>
              <li>
                <b>Local.</b> We're your neighbors in east Multnomah County, right off I-84.
              </li>
            </ul>
            <p className="foot">*{SAFETY.source}</p>
          </div>
          <div className="packet">
            <div className="top">
              <span>Carrier packet</span>
              <span>MC {BUSINESS.mc}</span>
            </div>
            <div className="in">
              <h3>Licensed &amp; insured</h3>
              <dl>
                <dt>USDOT</dt>
                <dd className="mono">{BUSINESS.usdot}</dd>
                <dt>MC</dt>
                <dd className="mono">{BUSINESS.mc}</dd>
                <dt>Authority</dt>
                <dd>Interstate, for hire, since {BUSINESS.authoritySince}</dd>
                <dt>Liability</dt>
                <dd>{BUSINESS.liability}</dd>
                <dt>Cargo</dt>
                <dd>
                  <Ph q="cargo">$______</Ph>
                </dd>
                <dt>Equipment</dt>
                <dd>
                  <Ph q="fleet">__ tractors, __ trailers</Ph>
                </dd>
              </dl>
              <div className="actions">
                <a className="btn btn-white" href={BUSINESS.fmcsaUrl} target="_blank" rel="noopener">
                  Look us up on FMCSA <span aria-hidden="true">↗</span>
                </a>
                <a className="btn btn-ghost" href="#contact" onClick={() => pick('Trucking (recurring lane)')}>
                  Request a carrier packet
                </a>
              </div>
              <p className="fine">Certificates of insurance and W-9 on request.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WAREHOUSE */}
      <section id="warehouse" className="cream">
        <div className="wrap two">
          <div className="lb" ref={lbRef}>
            <div className="photo warm">
              <PhotoTag>Photo/video slot: racking and dock doors, a forklift moving pallets</PhotoTag>
            </div>
            <span className="lb-bar lb-top" aria-hidden="true" />
            <span className="lb-bar lb-bot" aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Warehousing &amp; storage</p>
            <h2>Store it with us. Ship it with us.</h2>
            <p>Need somewhere to keep inventory, overflow or a job-site delivery until it's time? Store it with us and we'll truck it out when you're ready.</p>
            <div className="sheet">
              <div className="hd">
                <span>Facility data sheet</span>
                <span>FX4 · Warehouse 1</span>
              </div>
              <dl>
                <dt>Location</dt>
                <dd><Ph q="wh-city">street, city</Ph></dd>
                <dt>Size</dt>
                <dd><Ph q="wh-size">__,___ sq ft</Ph></dd>
                <dt>Dock doors</dt>
                <dd><Ph q="wh-doors">__ dock-high, __ drive-in</Ph></dd>
                <dt>Storage</dt>
                <dd><Ph q="wh-storage">racked and floor pallet space</Ph></dd>
                <dt>Services</dt>
                <dd>
                  Pallet storage, short &amp; long-term, local delivery<Ph q="wh-xdock">, cross-dock?</Ph>
                </dd>
                <dt>Security</dt>
                <dd><Ph q="wh-security">cameras, fenced yard, alarm</Ph></dd>
                <dt>Hours</dt>
                <dd><Ph q="wh-hours">Mon–Fri __ to __</Ph></dd>
              </dl>
            </div>
            <p style={{ marginTop: 20 }}>
              <a className="btn btn-red magnetic" href="#contact" onClick={() => pick('Warehousing / storage')}>
                Ask about storage space
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* SERVICE AREA */}
      <section id="area">
        <div className="wrap area">
          <div>
            <p className="eyebrow">Where we run</p>
            <h2>Portland roots. Western reach.</h2>
            <p>
              Home base is Wood Village, Oregon. Our trucks run regularly through <Ph q="states">7 states</Ph>:
            </p>
            <ul className="states">
              {STATES.map((s) => (
                <li key={s.code} className={s.home ? 'home' : undefined}>
                  {s.name} <span>{s.home ? `${s.code} · Home` : s.code}</span>
                </li>
              ))}
            </ul>
            <p className="local">Locally we serve {LOCAL_TOWNS.slice(0, -1).join(', ')}, {LOCAL_TOWNS[LOCAL_TOWNS.length - 1]} and the rest of the metro. Have a lane that runs every week? Ask about dedicated service.</p>
            <p className="local">
              Main lanes: <Ph q="lanes">top 2–3 lanes from Daniel</Ph>
            </p>
          </div>
          <RouteMap />
        </div>
      </section>

      {/* PROOF */}
      <section className="cream" style={{ padding: '72px 0' }}>
        <div className="wrap">
          <figure className="quote" style={{ margin: '0 auto' }}>
            <blockquote>
              “<Ph q="quote">A real quote from a shipper or broker FX4 works with, used with their permission.</Ph>”
            </blockquote>
            <figcaption>
              <cite>
                — <Ph q="quote">Name, Company, City</Ph>
              </cite>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* HIRING */}
      <div className="hiring" id="drivers">
        <div className="wrap">
          <div>
            <p className="eyebrow">Driver jobs</p>
            <h2>Now hiring Class A CDL drivers.</h2>
          </div>
          <dl>
            <div>
              <dt>Pay</dt>
              <dd><Ph q="pay">$___</Ph></dd>
            </div>
            <div>
              <dt>Home time</dt>
              <dd><Ph q="home">______</Ph></dd>
            </div>
            <div>
              <dt>Equipment</dt>
              <dd>Kept up by our own shop</dd>
            </div>
          </dl>
          <a className="btn btn-white magnetic" href="#contact" onClick={() => pick('Driver job')}>
            Apply to drive
          </a>
        </div>
      </div>

      {/* CONTACT / REQUEST FOR QUOTE */}
      <section id="contact">
        <div className="wrap contact">
          <div>
            <p className="eyebrow">Get a quote</p>
            <h2>Tell us about the load.</h2>
            <p>
              Send us the details and we'll get back to you <Ph q="reply">the same business day</Ph>. If it's urgent, just call.
            </p>
            <div className="info">
              <h3>{BUSINESS.name}</h3>
              <a className="big" href={BUSINESS.phoneHref}>
                {BUSINESS.phoneDisplay}
              </a>
              <dl>
                <dt>Email</dt>
                <dd><Ph q="email">dispatch@fx4logistics.com</Ph></dd>
                <dt>Address</dt>
                <dd>
                  {BUSINESS.street}
                  <br />
                  {BUSINESS.city}, {BUSINESS.region} {BUSINESS.zip}
                </dd>
                <dt>Office</dt>
                <dd><Ph q="hours">office hours</Ph></dd>
                <dt>Directions</dt>
                <dd className="exitline">
                  <Shield num="84" size={26} />
                  Right off I-84 at exit 16
                </dd>
              </dl>
            </div>
          </div>

          <div className="rfq">
            <div className="hd">
              <span>Request for quote</span>
              <span>{BUSINESS.name.replace('.', '')} · MC {BUSINESS.mc}</span>
            </div>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="grid">
                <div><label htmlFor="name">Your name</label><input id="name" autoComplete="name" /></div>
                <div><label htmlFor="company">Company</label><input id="company" autoComplete="organization" /></div>
                <div><label htmlFor="phone">Phone</label><input id="phone" type="tel" autoComplete="tel" /></div>
                <div><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" /></div>
                <div className="full">
                  <label htmlFor="service">What do you need?</label>
                  <select id="service" value={quote.service} onChange={(e) => setQuote({ ...quote, service: e.target.value as Service })}>
                    {SERVICE_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset hidden={!trucking}>
                <legend>Load details</legend>
                <div className="grid">
                  <div><label htmlFor="from">Pickup city or ZIP</label><input id="from" value={quote.from} onChange={(e) => setQuote({ ...quote, from: e.target.value })} /></div>
                  <div><label htmlFor="to">Delivery city or ZIP</label><input id="to" value={quote.to} onChange={(e) => setQuote({ ...quote, to: e.target.value })} /></div>
                  <div>
                    <label htmlFor="equip">Trailer type</label>
                    <select id="equip" value={quote.equip} onChange={(e) => setQuote({ ...quote, equip: e.target.value as Trailer })}>
                      {TRAILERS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div><label htmlFor="date">Pickup date</label><input id="date" type="date" /></div>
                  <div><label htmlFor="what">What's being shipped?</label><input id="what" /></div>
                  <div><label htmlFor="weight">Approx. weight</label><input id="weight" /></div>
                </div>
              </fieldset>

              <fieldset hidden={!storage}>
                <legend>Storage details</legend>
                <div className="grid">
                  <div><label htmlFor="pallets">About how many pallets?</label><input id="pallets" /></div>
                  <div>
                    <label htmlFor="howlong">For how long?</label>
                    <select id="howlong">
                      <option>Less than a month</option>
                      <option>1–3 months</option>
                      <option>3–12 months</option>
                      <option>Ongoing</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              <fieldset hidden={!driver}>
                <legend>About you</legend>
                <div className="grid">
                  <div>
                    <label htmlFor="cdl">CDL class</label>
                    <select id="cdl">
                      <option>Class A</option>
                      <option>Class B</option>
                      <option>Getting my CDL</option>
                    </select>
                  </div>
                  <div><label htmlFor="exp">Years driving</label><input id="exp" /></div>
                </div>
              </fieldset>

              <div style={{ marginTop: 16 }}>
                <label htmlFor="msg">Anything else we should know?</label>
                <textarea id="msg" />
              </div>
              <button className="btn btn-red send magnetic" type="submit">
                Send request <span aria-hidden="true">›</span>
              </button>
              <p className="note2">We'll only use your information to reply to you.</p>
              {sent && (
                <div className="ok" role="status">
                  Draft only: this form isn't connected yet. On the live site it goes to FX4 through Golden Boy's Web3Forms account.
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
