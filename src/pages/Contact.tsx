// Contact: the contact box and the request-for-quote form. Other pages link here with some
// fields filled in (React Router state, see src/data/quote.ts): the home quick quote fills the
// route and trailer, the trailer cards pick a trailer, Driver Jobs picks "Driver job".
// The form sends through Robert's Web3Forms account (never the client's) to dispatch@fx4logistics.com.
// The access key is the VITE_WEB3FORMS_ACCESS_KEY environment variable in Vercel, which Robert sets;
// it never goes in the code. Never submit this form as a test.
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BUSINESS, SERVICE_OPTIONS, TRAILERS } from '../data/business';
import { QUOTE_DEFAULT, type QuoteNav, type QuoteState, type Service, type Trailer } from '../data/quote';
import { Shield } from '../components/Graphics';
import { PageHero } from '../components/PageParts';
import { reducedMotion } from '../effects';

const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined;
type Status = 'idle' | 'sending' | 'sent' | 'missing' | 'error';

export default function Contact() {
  const location = useLocation();
  const [quote, setQuote] = useState<QuoteState>(QUOTE_DEFAULT);
  const [status, setStatus] = useState<Status>('idle');
  const [imported, setImported] = useState('No');
  const formRef = useRef<HTMLDivElement>(null);

  // Prefill from the page that sent the visitor here. Applied after hydration so the
  // prerendered form and the first client render always match.
  useEffect(() => {
    const nav = location.state as QuoteNav | null;
    if (!nav?.quote) return;
    setQuote({ ...QUOTE_DEFAULT, ...nav.quote });
    setStatus('idle');
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
                <dd><a href={BUSINESS.emailHref}>{BUSINESS.email}</a></dd>
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
                <dd>{BUSINESS.days} {BUSINESS.hours}</dd>
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
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const v = (id: string) =>
                  (form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('#' + id)?.value ?? '').trim();
                if ((form.querySelector<HTMLInputElement>('#botcheck'))?.checked) return;
                if (!v('name') || (!v('phone') && !v('email'))) {
                  setStatus('missing');
                  return;
                }
                if (!ACCESS_KEY) {
                  setStatus('error');
                  return;
                }
                const data: Record<string, string> = {
                  access_key: ACCESS_KEY,
                  subject: 'Website request: ' + quote.service,
                  from_name: 'FX4 Logistics website',
                  Name: v('name'),
                  Company: v('company'),
                  Phone: v('phone'),
                  Email: v('email'),
                  'What they need': quote.service,
                };
                if (v('email')) data.replyto = v('email');
                if (trucking) {
                  Object.assign(data, { Pickup: v('from'), Delivery: v('to'), Trailer: v('equip'), 'Pickup date': v('date'), Freight: v('what'), Weight: v('weight') });
                }
                if (storage) Object.assign(data, { Pallets: v('pallets'), 'How long': v('howlong'), Imported: imported });
                if (driver) Object.assign(data, { 'CDL class': v('cdl'), 'Years driving': v('exp') });
                data.Message = v('msg');
                setStatus('sending');
                try {
                  const res = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(data),
                  });
                  const json = (await res.json().catch(() => null)) as { success?: boolean } | null;
                  if (res.ok && json?.success) {
                    form.reset();
                    setQuote(QUOTE_DEFAULT);
                    setImported('No');
                    setStatus('sent');
                  } else {
                    setStatus('error');
                  }
                } catch {
                  setStatus('error');
                }
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
              <input id="botcheck" type="checkbox" tabIndex={-1} autoComplete="off" hidden aria-hidden="true" />
              <button className="btn btn-red send magnetic" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send request'} <span aria-hidden="true">›</span>
              </button>
              <p className="note2">We'll only use your information to reply to you.</p>
              <div aria-live="polite">
                {status === 'sent' && (
                  <div className="ok done" role="status">
                    Thanks, we got it. We'll get back to you {BUSINESS.reply}.
                  </div>
                )}
                {status === 'missing' && (
                  <div className="ok err" role="alert">
                    Please add your name and a phone number or email so we can reply.
                  </div>
                )}
                {status === 'error' && (
                  <div className="ok err" role="alert">
                    That didn't go through. Please call <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a> or email{' '}
                    <a href={BUSINESS.emailHref}>{BUSINESS.email}</a>.
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
