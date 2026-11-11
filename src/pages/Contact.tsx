// Contact: the contact box and the request-for-quote form. Other pages link here with some
// fields filled in (React Router state, see src/data/quote.ts): the home quick quote fills the
// route and trailer, the trailer cards pick a trailer, Driver Jobs picks "Driver job".
// The form isn't connected yet: before launch it goes to Robert's Web3Forms account (never
// the client's), and it is never submitted as a test.
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BUSINESS, SERVICE_OPTIONS, TRAILERS } from '../data/business';
import { QUOTE_DEFAULT, type QuoteNav, type QuoteState, type Service, type Trailer } from '../data/quote';
import { Ph } from '../components/Ph';
import { Shield } from '../components/Graphics';
import { PageHero } from '../components/PageParts';
import { reducedMotion } from '../effects';

export default function Contact() {
  const location = useLocation();
  const [quote, setQuote] = useState<QuoteState>(QUOTE_DEFAULT);
  const [sent, setSent] = useState(false);
  const [imported, setImported] = useState('No');
  const formRef = useRef<HTMLDivElement>(null);

  // Prefill from the page that sent the visitor here. Applied after hydration so the
  // prerendered form and the first client render always match.
  useEffect(() => {
    const nav = location.state as QuoteNav | null;
    if (!nav?.quote) return;
    setQuote({ ...QUOTE_DEFAULT, ...nav.quote });
    setSent(false);
    const t = window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      if (nav.focus) document.getElementById('name')?.focus({ preventScroll: true });
    }, 30);
    return () => clearTimeout(t);
  }, [location.key]);

  const trucking = quote.service.startsWith('Trucking');
  const storage = quote.service.includes('storage');
  const driver = quote.service === 'Driver job';

  return (
    <>
      <PageHero
        crumb="Contact"
        title="Request a quote."
        lede={
          <>
            Trucking, storage or a driving job. Call <span className="nw">{BUSINESS.phoneDisplay}</span> or send the details below.
          </>
        }
      >
        <a className="btn btn-ghost" href={BUSINESS.phoneHref}>
          Call {BUSINESS.phoneDisplay}
        </a>
      </PageHero>

      <section id="contact">
        <div className="wrap contact">
          <div>
            <p className="eyebrow">Get a quote</p>
            <h2>Tell us about the load.</h2>
            <p>
              Send us the details and we'll get back to you {BUSINESS.reply}. If it's urgent, just call.
            </p>
            <div className="info">
              <h3>{BUSINESS.name}</h3>
              <a className="big" href={BUSINESS.phoneHref}>
                {BUSINESS.phoneDisplay}
              </a>
              <dl>
                <dt>Email</dt>
                <dd><Ph q="email">email to come</Ph></dd>
                <dt>Dispatch</dt>
                <dd>
                  {BUSINESS.dispatcher} · <a href={BUSINESS.dispatchHref}>{BUSINESS.dispatchDisplay}</a>
                </dd>
                <dt>Address</dt>
                <dd>
                  {BUSINESS.street}
                  <br />
                  {BUSINESS.city}, {BUSINESS.region} {BUSINESS.zip}
                </dd>
                <dt>Office</dt>
                <dd><Ph q="days">Mon–Fri</Ph> {BUSINESS.hours}</dd>
                <dt>Directions</dt>
                <dd className="exitline">
                  <Shield num="84" size={26} />
                  Right off I-84 at exit 16
                </dd>
              </dl>
            </div>
          </div>

          <div className="rfq" ref={formRef}>
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
                  <div>
                    <label htmlFor="imported">Is it imported?</label>
                    <select id="imported" value={imported} onChange={(e) => setImported(e.target.value)}>
                      <option>No</option>
                      <option>Yes, it has cleared customs</option>
                      <option>Yes, not cleared yet</option>
                    </select>
                  </div>
                </div>
                {imported === 'Yes, not cleared yet' && (
                  <p className="note2" role="status">
                    We store imported freight once it has cleared customs. Your customs broker handles that first, then we take it from there.
                  </p>
                )}
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
