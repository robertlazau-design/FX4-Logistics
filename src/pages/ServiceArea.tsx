// Service Area: the states, the local towns, the main lanes and the route map.
import { BUSINESS, LANES, LOCAL_TOWNS, STATES } from '../data/business';
import { quoteFor } from '../data/quote';
import { Ph } from '../components/Ph';
import RouteMap from '../components/RouteMap';
import { PageHero, QuoteBand } from '../components/PageParts';
import { PHOTOS } from '../data/photos';

export default function ServiceArea() {
  return (
    <>
      <PageHero crumb="Service Area" title="Portland roots. Western reach." lede={`Home base is ${BUSINESS.city}, Oregon, right off I-84 at exit 16.`} photo={PHOTOS.serviceArea} />

      <section>
        <div className="wrap area">
          <div>
            <p className="eyebrow">Where we run</p>
            <h2>Out of Wood Village, across the West.</h2>
            <p>
              Home base is Wood Village, Oregon. Our trucks run regularly through {STATES.length} states:
            </p>
            <ul className="states">
              {STATES.map((s) => (
                <li key={s.code} className={s.home ? 'home' : undefined}>
                  {s.name} <span>{s.home ? `${s.code} · Home` : s.code}</span>
                  {s.confirm && <Ph q={s.confirm}>confirm</Ph>}
                </li>
              ))}
            </ul>
            <p className="local">Locally we serve {LOCAL_TOWNS.slice(0, -1).join(', ')}, {LOCAL_TOWNS[LOCAL_TOWNS.length - 1]} and the rest of the metro.</p>
            <p className="local">
              Main lanes: {LANES.join(' · ')}
            </p>
          </div>
          <RouteMap />
        </div>
      </section>

      <QuoteBand eyebrow="Dedicated service" title="Have a lane that runs every week?" text="Ask about dedicated service on a regular lane." cta="Ask about a lane" state={quoteFor('Trucking (recurring lane)')} />
    </>
  );
}
