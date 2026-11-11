// About Us: the owner's note, the company data sheet and (once there is one) a real quote
// from a shipper or broker.
import { BUSINESS } from '../data/business';
import { quoteFor } from '../data/quote';
import { Ph } from '../components/Ph';
import { PhotoTag, Shield } from '../components/Graphics';
import { PageHero, QuoteBand } from '../components/PageParts';

export default function About() {
  return (
    <>
      <PageHero
        crumb="About Us"
        title="A trucking company you can actually call."
        lede="A locally owned carrier, not a broker, right off I-84 at exit 16 in Wood Village, Oregon."
        slot="Photo slot: the yard on NE Halsey St with the trucks lined up"
      />

      {/* OWNER'S NOTE */}
      <section className="note">
        <div className="wrap two">
          <div>
            <p className="eyebrow">A note from the owner</p>
            <h2>Locally owned. Not a broker.</h2>
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

      {/* COMPANY SHEET + PROOF */}
      <section className="cream">
        <div className="wrap two top">
          <div>
            <p className="eyebrow">The paperwork</p>
            <h2>Company data sheet.</h2>
            <div className="sheet">
              <div className="hd">
                <span>{BUSINESS.name}</span>
                <span>MC {BUSINESS.mc}</span>
              </div>
              <dl>
                <dt>Home base</dt>
                <dd>
                  {BUSINESS.street}, {BUSINESS.city}, {BUSINESS.region} {BUSINESS.zip}
                </dd>
                <dt>Directions</dt>
                <dd className="exitline">
                  <Shield num="84" size={24} /> Right off I-84 at exit 16
                </dd>
                <dt>Authority</dt>
                <dd>Interstate, for hire, since {BUSINESS.authoritySince}</dd>
                <dt>USDOT</dt>
                <dd className="mono">{BUSINESS.usdot}</dd>
                <dt>MC</dt>
                <dd className="mono">{BUSINESS.mc}</dd>
                <dt>Sister company</dt>
                <dd>{BUSINESS.sister}, heavy truck &amp; trailer repair</dd>
              </dl>
            </div>
          </div>
          <div>
            <p className="eyebrow">In their words</p>
            <h2>What shippers say.</h2>
            <figure className="quote">
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
        </div>
      </section>

      <QuoteBand title="Tell us about the load." text="Call us or send the details, and we'll get back to you with a price." state={quoteFor('Trucking (one load)')} />
    </>
  );
}
