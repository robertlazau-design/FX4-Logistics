// Trucking: the four trailer types, what we haul, and the carrier packet brokers look for.
import { Link } from 'react-router-dom';
import { BUSINESS, HAULS, SAFETY } from '../data/business';
import { quoteFor, type Trailer } from '../data/quote';
import { TrailerArt } from '../components/Graphics';
import { PageHero, QuoteBand } from '../components/PageParts';
import { PHOTOS, srcSet } from '../data/photos';

const RIGS: { kind: 'flatbed' | 'stepdeck' | 'dryvan' | 'hopper'; title: string; text: string; fits: string[]; equip: Trailer; cta: string }[] = [
  { kind: 'flatbed', title: 'Flatbed', text: 'Lumber, steel and building materials, strapped and tarped by experienced drivers.', fits: ['Lumber', 'Steel', 'Building materials'], equip: 'Flatbed', cta: 'Get a flatbed quote' },
  { kind: 'stepdeck', title: 'Step Deck', text: 'Machinery and taller loads that need the lower deck to stay under height limits.', fits: ['Machinery', 'Tall loads', 'Equipment'], equip: 'Step deck', cta: 'Get a step deck quote' },
  { kind: 'dryvan', title: 'Dry Van', text: 'Palletized and general freight that needs to stay covered from pickup to delivery.', fits: ['Pallets', 'General freight', 'Boxed goods'], equip: 'Dry van', cta: 'Get a dry van quote' },
];

export default function Trucking() {
  return (
    <>
      <PageHero
        crumb="Trucking"
        title="Flatbed, step deck & dry van trucking."
        lede="Full truckload service on our own trucks with our own drivers. Lumber, steel, machinery and building materials."
        photo={PHOTOS.trucking}
      >
        <Link className="btn btn-red magnetic" to="/contact" state={quoteFor('Trucking (one load)')}>
          Get a trucking quote <span aria-hidden="true">›</span>
        </Link>
        <a className="btn btn-ghost" href={BUSINESS.phoneHref}>
          Call {BUSINESS.phoneDisplay}
        </a>
      </PageHero>

      {/* EQUIPMENT */}
      <section className="cream">
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
                    {r.text}
                  </p>
                  <ul className="fits">
                    {r.fits.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <Link className="more" to="/contact" state={quoteFor('Trucking (one load)', r.equip)}>
                    {r.cta} <span aria-hidden="true">›</span>
                  </Link>
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

      {/* ON THE ROAD: FX4's own trucks */}
      <section className="onroad">
        <div className="wrap">
          <p className="eyebrow">On the road</p>
          <h2>Our trucks, our drivers, all year.</h2>
          <div className="road">
            {PHOTOS.road.map((ph) => (
              <figure key={ph.src}>
                <img src={ph.src} srcSet={srcSet(ph)} sizes="(max-width: 640px) 100vw, 33vw" alt={ph.alt} loading="lazy" decoding="async" />
              </figure>
            ))}
          </div>
        </div>
      </section>

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
                <b>A real person answers.</b> Call {BUSINESS.dispatcher} in dispatch at <a className="nw" href={BUSINESS.dispatchHref}>{BUSINESS.dispatchDisplay}</a> for pickup times and updates.
              </li>
              <li>
                <b>Clean driver record.</b> No driver out-of-service orders in {SAFETY.inspections} roadside inspections and no reported crashes in the last two years.*
              </li>
              <li>
                <b>Trucking and storage in one place.</b> One company, one invoice, from our dock to yours. <Link to="/warehousing">About storage</Link>
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
                  {BUSINESS.cargo}
                </dd>
                <dt>Equipment</dt>
                <dd>
                  {BUSINESS.fleetText}
                </dd>
              </dl>
              <div className="actions">
                <a className="btn btn-white" href={BUSINESS.fmcsaUrl} target="_blank" rel="noopener">
                  Look us up on FMCSA <span aria-hidden="true">↗</span>
                </a>
                <Link className="btn btn-ghost" to="/contact" state={quoteFor('Trucking (recurring lane)')}>
                  Request a carrier packet
                </Link>
              </div>
              <p className="fine">Certificates of insurance and W-9 on request.</p>
            </div>
          </div>
        </div>
      </section>

      <QuoteBand title="Tell us about the load." text="Pickup, delivery, what it is and when. We get back to you with a price." cta="Get a trucking quote" state={quoteFor('Trucking (one load)')} />
    </>
  );
}
