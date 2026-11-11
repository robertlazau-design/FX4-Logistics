// Warehousing: the facility data sheet (Daniel's Nov 11 answers) and how storage and trucking
// work together. Imported freight is stored only after it clears customs: FX4 is not a bonded
// warehouse or a foreign-trade zone, so never say it is.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS, WAREHOUSE } from '../data/business';
import { quoteFor } from '../data/quote';
import { Ph } from '../components/Ph';
import { PhotoTag } from '../components/Graphics';
import { PageHero, QuoteBand } from '../components/PageParts';
import { usePlayOnScroll } from '../effects';

export default function Warehousing() {
  const lbRef = useRef<HTMLDivElement>(null);
  usePlayOnScroll(lbRef, { threshold: 0.4 });
  return (
    <>
      <PageHero
        crumb="Warehousing"
        title="Store it with us. Ship it with us."
        lede="Need somewhere to keep inventory, overflow or a job-site delivery until it's time? Store it with us and we'll truck it out when you're ready."
        slot="Photo slot: the warehouse from the yard, dock doors open"
      >
        <Link className="btn btn-red magnetic" to="/contact" state={quoteFor('Warehousing / storage')}>
          Ask about storage space <span aria-hidden="true">›</span>
        </Link>
        <a className="btn btn-ghost" href={BUSINESS.phoneHref}>
          Call {BUSINESS.phoneDisplay}
        </a>
      </PageHero>

      {/* FACILITY */}
      <section>
        <div className="wrap two">
          <div className="lb" ref={lbRef}>
            <div className="photo warm">
              <PhotoTag>Photo/video slot: racking and dock doors, a forklift moving pallets</PhotoTag>
            </div>
            <span className="lb-bar lb-top" aria-hidden="true" />
            <span className="lb-bar lb-bot" aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">The warehouse</p>
            <h2>Warehouse 1 at a glance.</h2>
            <p>
              Our new {WAREHOUSE.size} warehouse at our home base in Wood Village holds your freight until you need it, and our own trucks deliver it on your schedule.
            </p>
            <div className="sheet">
              <div className="hd">
                <span>Facility data sheet</span>
                <span>FX4 · Warehouse 1</span>
              </div>
              <dl>
                <dt>Location</dt>
                <dd>
                  {WAREHOUSE.street}
                  <br />
                  {WAREHOUSE.cityLine}
                </dd>
                <dt>Size</dt>
                <dd>{WAREHOUSE.size}</dd>
                <dt>Dock doors</dt>
                <dd>{WAREHOUSE.doors}</dd>
                <dt>Storage</dt>
                <dd>{WAREHOUSE.storage}</dd>
                <dt>Services</dt>
                <dd>
                  {WAREHOUSE.services}
                </dd>
                <dt>Security</dt>
                <dd>{WAREHOUSE.security}</dd>
                <dt>Hours</dt>
                <dd>
                  <Ph q="days">Daily?</Ph> {WAREHOUSE.hours}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ONE COMPANY */}
      <section className="cream">
        <div className="wrap why">
          <div>
            <p className="eyebrow">Trucking + storage</p>
            <h2>One company from our dock to yours.</h2>
            <ul className="checks">
              <li>
                <b>Short and long-term pallet storage.</b> Inventory, overflow or a job-site delivery that isn't ready yet.
              </li>
              <li>
                <b>Imported freight, once it clears customs.</b> Your customs broker clears it, then we store it and truck it out when you're ready.
              </li>
              <li>
                <b>Local delivery on our own trucks.</b> When you're ready, the same company brings it out. <Link to="/trucking">Our trailers</Link>
              </li>
              <li>
                <b>One invoice.</b> Trucking and storage booked with one company.
              </li>
            </ul>
          </div>
          <div className="packet">
            <div className="top">
              <span>Storage request</span>
              <span>What we'll ask</span>
            </div>
            <div className="in">
              <h3>Have these handy</h3>
              <dl>
                <dt>Pallets</dt>
                <dd>About how many</dd>
                <dt>How long</dt>
                <dd>Under a month to ongoing</dd>
                <dt>In &amp; out</dt>
                <dd>Where it's coming from and going</dd>
                <dt>Imported?</dt>
                <dd>Cleared through customs first</dd>
              </dl>
              <div className="actions">
                <Link className="btn btn-white" to="/contact" state={quoteFor('Warehousing / storage')}>
                  Ask about storage space
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuoteBand title="Need a place to keep it?" text="Tell us what you're storing and for how long." cta="Ask about storage space" state={quoteFor('Warehousing / storage')} />
    </>
  );
}
