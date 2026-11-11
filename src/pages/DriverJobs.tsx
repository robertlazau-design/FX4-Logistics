// Driver Jobs: why drive for FX4, pay and home time (placeholders until the call), and the
// apply button, which opens the contact form set to "Driver job".
import { Link } from 'react-router-dom';
import { BUSINESS, SAFETY } from '../data/business';
import { quoteFor } from '../data/quote';
import { Ph } from '../components/Ph';
import { PageHero } from '../components/PageParts';
import { PHOTOS, srcSet } from '../data/photos';

export default function DriverJobs() {
  const apply = quoteFor('Driver job');
  return (
    <>
      <PageHero
        crumb="Driver Jobs"
        title="Now hiring Class A CDL drivers."
        lede="Drive our own flatbeds, step decks and dry vans for a locally owned carrier based in Wood Village, Oregon."
        slot="Photo slot: one of our drivers with their truck"
      >
        <Link className="btn btn-red magnetic" to="/contact" state={apply}>
          Apply to drive <span aria-hidden="true">›</span>
        </Link>
        <a className="btn btn-ghost" href={BUSINESS.phoneHref}>
          Call {BUSINESS.phoneDisplay}
        </a>
      </PageHero>

      <section>
        <div className="wrap two">
          <div>
            <p className="eyebrow">Why drive for FX4</p>
            <h2>Good equipment, a clean record, a local home base.</h2>
            <ul className="checks">
              <li>
                <b>Our own trucks and trailers.</b> Flatbed, step deck and dry van, owned and run by FX4.
              </li>
              <li>
                <b>Kept up by our own shop.</b> Our sister company, {BUSINESS.sister}, repairs heavy trucks and trailers at the same address. <Ph q="bridgetown">confirm</Ph>
              </li>
              <li>
                <b>A clean safety record.</b> No driver out-of-service orders in {SAFETY.inspections} roadside inspections and no reported crashes in the last two years.*
              </li>
              <li>
                <b>A local home base.</b> Right off I-84 at exit 16 in {BUSINESS.city}.
              </li>
            </ul>
            <p className="foot">*{SAFETY.source}</p>
          </div>
          <div className="photo">
            <img src={PHOTOS.driver.src} srcSet={srcSet(PHOTOS.driver)} sizes="(max-width: 980px) 100vw, 50vw" alt={PHOTOS.driver.alt} loading="lazy" decoding="async" />
          </div>
        </div>
      </section>

      {/* THE JOB */}
      <div className="hiring">
        <div className="wrap">
          <div>
            <p className="eyebrow">The job</p>
            <h2>Class A CDL driver.</h2>
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
          <Link className="btn btn-white magnetic" to="/contact" state={apply}>
            Apply to drive
          </Link>
        </div>
      </div>
    </>
  );
}
