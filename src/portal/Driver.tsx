// The screens a driver uses: sign in, home, trailer and truck pages, report a problem,
// the team list and announcements.
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { TrailerArt } from '../components/Graphics';
import { OFFICE, PEOPLE, RULES, UNITS, isAdmin, personById, unitById, type Person, type Unit } from './data';
import { GUIDES, guideBySlug } from './guides';
import { REPORT_KINDS, actions, toSign, unseenPosts, usePortal, when, type ReportKind } from './store';
import { CallDavid, Icon, Page, Sample, Tbd } from './ui';

/* ---------- Sign in (simulated one-time code) ---------- */

export function SignIn() {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) return setErr('Enter your 10-digit phone number.');
    setErr('');
    setStep('code');
  };
  const check = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setErr('Enter the 6 numbers from the text.');
    actions.signIn('d1');
  };
  return (
    <Page title="Sign in" kicker="FX4 team portal">
      {step === 'phone' ? (
        <form className="pt-card pt-form" onSubmit={sendCode} noValidate>
          <p>We’ll text you a one-time code. This phone then stays signed in.</p>
          <label htmlFor="pt-phone">Your phone number</label>
          <input id="pt-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-describedby={err ? 'pt-err' : undefined} />
          {err && (
            <p className="pt-err" id="pt-err" role="alert">
              {err}
            </p>
          )}
          <button className="pt-btn red" type="submit">
            Text me a code
          </button>
          <p className="pt-fine">Demo: any 10-digit number works, and no text is sent.</p>
        </form>
      ) : (
        <form className="pt-card pt-form" onSubmit={check} noValidate>
          <p>Enter the 6-digit code we texted to {phone}.</p>
          <label htmlFor="pt-code">Code</label>
          <input id="pt-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-describedby={err ? 'pt-err' : undefined} />
          {err && (
            <p className="pt-err" id="pt-err" role="alert">
              {err}
            </p>
          )}
          <button className="pt-btn red" type="submit">
            Sign in
          </button>
          <p className="pt-fine">Demo: type any 6 numbers. You’ll be signed in as Driver 1; switch people in the yellow bar.</p>
        </form>
      )}
      <p className="pt-fine">
        Not on the FX4 team? This page is only for FX4 drivers and staff. Call the office at <a href={OFFICE.tel}>{OFFICE.phone}</a>.
      </p>
    </Page>
  );
}

export function AccessOff() {
  return (
    <Page title="Your access is off">
      <div className="pt-card">
        <p>Your FX4 portal access has been turned off. If you think that’s a mistake, call the office.</p>
        <a className="pt-btn" href={OFFICE.tel}>
          Call the office · {OFFICE.phone}
        </a>
      </div>
      <p className="pt-fine">Demo: Daniel or David turned this person off on the Office screen. Switch people in the yellow bar.</p>
    </Page>
  );
}

/* ---------- Home ---------- */

const BIG = [
  { to: '/portal/units', icon: 'qr', label: 'Scan my trailer', sub: 'Lock, guides and specs' },
  { to: '/portal/guides/accident', icon: 'alert', label: 'After a crash', sub: 'Step by step', red: true },
  { to: '/portal/guides/breakdown', icon: 'wrench', label: 'Breakdown', sub: 'Get safe, call David', red: true },
  { to: '/portal/guides/inspection', icon: 'clipboard', label: 'Inspection stop', sub: 'What to hand over' },
  { to: '/portal/report', icon: 'camera', label: 'Report a problem', sub: 'With photos' },
] as const;

export function Home({ me }: { me: Person }) {
  const s = usePortal();
  const sign = toSign(s, me.id);
  const news = unseenPosts(s, me.id);
  const [q, setQ] = useState('');
  const hits = useMemo(() => search(q), [q]);
  return (
    <Page title={`Hi, ${me.sample ? me.name : me.name.split(' ')[0]}`} kicker="FX4 team portal">
      {(sign.length > 0 || news.length > 0) && (
        <div className="pt-alerts">
          {sign.length > 0 && (
            <Link className="pt-alert red" to="/portal/rules">
              <Icon name="shield" />
              <span>
                <b>{sign.length === 1 ? '1 rule to sign' : `${sign.length} rules to sign`}</b>
                <small>{sign.map((r) => r.title).join(', ')}</small>
              </span>
              <Icon name="chevron" size={20} />
            </Link>
          )}
          {news.length > 0 && (
            <Link className="pt-alert" to="/portal/news">
              <Icon name="news" />
              <span>
                <b>{news.length === 1 ? '1 new announcement' : `${news.length} new announcements`}</b>
                <small>{news[0].title}</small>
              </span>
              <Icon name="chevron" size={20} />
            </Link>
          )}
        </div>
      )}

      <div className="pt-big">
        {BIG.map((b) => (
          <Link key={b.to} to={b.to} className={'red' in b ? 'pt-bigbtn red' : 'pt-bigbtn'}>
            <Icon name={b.icon} size={30} />
            <b>{b.label}</b>
            <small>{b.sub}</small>
          </Link>
        ))}
        <a className="pt-bigbtn navy" href={OFFICE.dispatchTel}>
          <Icon name="phone" size={30} />
          <b>Call {OFFICE.dispatcher}</b>
          <small>{OFFICE.dispatchPhone}</small>
        </a>
      </div>

      <div className="pt-search">
        <label htmlFor="pt-q">
          <Icon name="search" size={20} />
          <span className="sr">Search the portal</span>
        </label>
        <input id="pt-q" type="search" placeholder="Search: chains, tandems, lock…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {q.trim() && (
        <div className="pt-results" aria-live="polite">
          {hits.length === 0 ? (
            <p className="pt-fine">Nothing for “{q}”. Try another word, or call David.</p>
          ) : (
            <ul className="pt-list">
              {hits.map((h) => (
                <li key={h.to}>
                  <Link to={h.to}>
                    <span>
                      <b>{h.title}</b>
                      <small>{h.kind}</small>
                    </span>
                    <Icon name="chevron" size={20} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="pt-row2">
        <Link className="pt-btn line" to="/portal/guides">
          All guides
        </Link>
        <Link className="pt-btn line" to="/portal/news">
          Announcements
        </Link>
      </div>
    </Page>
  );
}

function search(q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const has = (...xs: string[]) => xs.some((x) => x.toLowerCase().includes(t));
  return [
    ...GUIDES.filter((g) => has(g.title, g.summary, ...g.steps.map((s) => s.title))).map((g) => ({ to: `/portal/guides/${g.slug}`, title: g.title, kind: 'Guide' })),
    ...UNITS.filter((u) => has(u.label, u.kindLabel, u.id)).map((u) => ({ to: `/portal/unit/${u.id}`, title: u.label, kind: `${u.kindLabel} · sample` })),
    ...RULES.filter((r) => has(r.title, ...r.points)).map((r) => ({ to: '/portal/rules', title: r.title, kind: 'Rule' })),
  ].slice(0, 8);
}

/* ---------- Trailers and trucks ---------- */

function UnitArt({ unit }: { unit: Unit }) {
  if (unit.kind === 'truck')
    return (
      <span className="pt-truck">
        <Icon name="truck" size={56} />
      </span>
    );
  return <TrailerArt kind={unit.kind} />;
}

export function Units() {
  return (
    <Page title="Scan my trailer" back={{ to: '/portal', label: 'Home' }}>
      <div className="pt-card pt-how">
        <Icon name="qr" size={32} />
        <p>
          Open your phone’s camera and point it at the FX4 sticker: on the <b>landing-gear post</b> of a trailer, or <b>inside the driver’s door</b> of a truck. It opens that unit’s page.
        </p>
      </div>
      <h2 className="pt-h2">Or pick it here</h2>
      <ul className="pt-units">
        {UNITS.map((u) => (
          <li key={u.id}>
            <Link to={`/portal/unit/${u.id}`}>
              <span className="pt-unit-art">
                <UnitArt unit={u} />
              </span>
              <span className="pt-unit-txt">
                <b>{u.label}</b>
                <small>
                  {u.kindLabel} · <Sample />
                </small>
              </span>
              <Icon name="chevron" size={20} />
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}

export function UnitPage() {
  const { id } = useParams();
  const unit = unitById(id);
  const s = usePortal();
  if (!unit)
    return (
      <Page title="Unit not found" back={{ to: '/portal/units', label: 'All units' }}>
        <p>There’s no FX4 unit with that number. Try scanning the sticker again, or call David.</p>
        <CallDavid block />
      </Page>
    );
  const open = s.reports.filter((r) => r.unit === unit.id && r.status !== 'Fixed');
  return (
    <Page title={unit.label} back={{ to: '/portal/units', label: 'All units' }} kicker={<>{unit.kindLabel} · <Sample>Sample unit</Sample></>}>
      <div className="pt-unitart">
        <UnitArt unit={unit} />
      </div>

      <section className="pt-card pt-lock" aria-labelledby="pt-lock-h">
        <h2 id="pt-lock-h">
          <Icon name="lock" /> {unit.lock.what}
        </h2>
        <p>{unit.lock.how}</p>
        <CallDavid label={unit.kind === 'truck' ? `Call ${OFFICE.dispatcher}` : `Get the code from ${OFFICE.dispatcher}`} block />
        <p className="pt-fine">Codes are never written in the portal.</p>
      </section>

      <h2 className="pt-h2">Guides for this {unit.kind === 'truck' ? 'truck' : 'trailer'}</h2>
      <ul className="pt-list">
        {unit.guides.map((slug) => {
          const g = guideBySlug(slug)!;
          return (
            <li key={slug}>
              <Link to={`/portal/guides/${slug}`}>
                <Icon name={g.icon} />
                <span>
                  <b>{g.title}</b>
                  <small>{g.summary}</small>
                </span>
                <Icon name="chevron" size={20} />
              </Link>
            </li>
          );
        })}
      </ul>

      <Link className="pt-btn red block" to="/portal/report" state={{ unit: unit.id }}>
        <Icon name="camera" /> Report a problem with {unit.label}
      </Link>

      {open.length > 0 && (
        <>
          <h2 className="pt-h2">Open problems</h2>
          <ul className="pt-reports">
            {open.map((r) => (
              <li key={r.id}>
                <span className={`pt-status s-${r.status.replace(/\s/g, '').toLowerCase()}`}>{r.status}</span>
                <p>
                  <b>{r.kind}:</b> {r.text}
                </p>
                <small>
                  {personById(r.by)?.name} · {when(r.at)}
                </small>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="pt-h2">Specs</h2>
      <dl className="pt-sheet">
        {unit.specs.map((x) => (
          <div key={x.k}>
            <dt>{x.k}</dt>
            <dd>{x.v ?? <Tbd />}</dd>
          </div>
        ))}
      </dl>
    </Page>
  );
}

/* ---------- Report a problem ---------- */

export function Report({ me }: { me: Person }) {
  const location = useLocation();
  const pre = (location.state ?? {}) as { unit?: string; kind?: ReportKind };
  const [unit, setUnit] = useState(pre.unit ?? '');
  const [kind, setKind] = useState<ReportKind>(pre.kind ?? 'Defect');
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState('');
  const [sentAt, setSentAt] = useState<number | null>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!unit) return setErr('Pick the truck or trailer.');
    if (text.trim().length < 3) return setErr('Say what’s wrong in a few words.');
    setErr('');
    actions.report({ unit, kind, text: text.trim(), urgent, by: me.id, photos: files.length });
    setSentAt(Date.now());
  };

  if (sentAt)
    return (
      <Page title="Report sent">
        <div className="pt-card pt-done">
          <Icon name="check" size={32} />
          <p>
            <b>{unitById(unit)?.label}</b>: {kind.toLowerCase()} report sent to Daniel and David at {when(sentAt)}
            {urgent ? ', marked urgent' : ''}.
          </p>
        </div>
        {urgent && <CallDavid label="Urgent? Call David too" block />}
        <div className="pt-row2">
          <button
            className="pt-btn line"
            type="button"
            onClick={() => {
              setSentAt(null);
              setText('');
              setFiles([]);
              setUrgent(false);
            }}
          >
            Send another
          </button>
          <Link className="pt-btn line" to="/portal">
            Home
          </Link>
        </div>
        <p className="pt-fine">Demo: the report is saved in this browser and shows on the Office maintenance board.</p>
      </Page>
    );

  return (
    <Page title="Report a problem" back={{ to: '/portal', label: 'Home' }}>
      <form className="pt-card pt-form" onSubmit={submit} noValidate>
        <label htmlFor="pt-unit">Truck or trailer</label>
        <select id="pt-unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="">Pick one</option>
          {UNITS.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label} (sample)
            </option>
          ))}
        </select>

        <fieldset className="pt-chips">
          <legend>What happened?</legend>
          {REPORT_KINDS.map((k) => (
            <label key={k} className={k === kind ? 'pt-on' : undefined}>
              <input type="radio" name="kind" value={k} checked={k === kind} onChange={() => setKind(k)} />
              {k}
            </label>
          ))}
        </fieldset>

        <label htmlFor="pt-text">What’s wrong?</label>
        <textarea id="pt-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Example: right rear marker light is out" />

        <label htmlFor="pt-photos">Photos</label>
        <input id="pt-photos" type="file" accept="image/*" multiple onChange={(e) => setFiles([...(e.target.files ?? [])].slice(0, 6))} />
        {previews.length > 0 && (
          <div className="pt-thumbs">
            {previews.map((src, i) => (
              <img key={src} src={src} alt={`Photo ${i + 1} of ${previews.length}`} />
            ))}
          </div>
        )}

        <label className="pt-check">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          Urgent: it isn’t safe to drive
        </label>

        {err && (
          <p className="pt-err" role="alert">
            {err}
          </p>
        )}
        <button className="pt-btn red" type="submit">
          Send to Daniel and David
        </button>
        <p className="pt-fine">Your name and the time are added for you.</p>
      </form>
    </Page>
  );
}

/* ---------- Team and business info ---------- */

export function Team() {
  const listed = PEOPLE.filter((p) => p.listed);
  const hidden = PEOPLE.length - listed.length;
  return (
    <Page title="Team" kicker={OFFICE.name}>
      <section className="pt-card" aria-labelledby="pt-office">
        <h2 id="pt-office">Office</h2>
        <a className="pt-btn block" href={OFFICE.tel}>
          <Icon name="phone" /> {OFFICE.phone}
        </a>
        <dl className="pt-sheet tight">
          <div>
            <dt>Address</dt>
            <dd>{OFFICE.address}</dd>
          </div>
          <div>
            <dt>Office</dt>
            <dd>
              <Tbd>Days?</Tbd> {OFFICE.officeHours}
            </dd>
          </div>
          <div>
            <dt>Warehouse</dt>
            <dd>
              <Tbd>Days?</Tbd> {OFFICE.warehouseHours}
            </dd>
          </div>
          <div>
            <dt>USDOT · MC</dt>
            <dd className="mono">
              {OFFICE.usdot} · {OFFICE.mc}
            </dd>
          </div>
        </dl>
      </section>

      <h2 className="pt-h2">People</h2>
      <ul className="pt-people">
        {listed.map((p) => (
          <li key={p.id}>
            <span>
              <b>{p.name}</b> {p.sample && <Sample />}
              <small>{p.title}</small>
            </span>
            {p.tel ? (
              <a className="pt-mini" href={p.tel} aria-label={`Call ${p.name}, ${p.phone}`}>
                <Icon name="phone" size={18} /> {p.phone}
              </a>
            ) : (
              <span className="pt-fine">Through the office</span>
            )}
          </li>
        ))}
      </ul>
      {hidden > 0 && <p className="pt-fine">{hidden === 1 ? '1 person has' : `${hidden} people have`} chosen not to list a number.</p>}
      <Link className="pt-btn line block" to="/portal/news">
        Announcements
      </Link>
    </Page>
  );
}

/* ---------- Announcements ---------- */

export function News({ me }: { me: Person }) {
  const s = usePortal();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const ids = s.posts.map((p) => p.id).join(',');
  useEffect(() => {
    actions.seen(me.id, ids ? ids.split(',') : []);
  }, [me.id, ids]);
  const post = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    actions.post(me.id, title.trim(), body.trim());
    setTitle('');
    setBody('');
  };
  return (
    <Page title="Announcements" back={{ to: '/portal/team', label: 'Team' }}>
      {isAdmin(me) && (
        <form className="pt-card pt-form" onSubmit={post}>
          <h2>Post to the team</h2>
          <label htmlFor="pt-nt">Headline</label>
          <input id="pt-nt" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label htmlFor="pt-nb">Details</label>
          <textarea id="pt-nb" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="pt-btn red" type="submit">
            Post
          </button>
        </form>
      )}
      <ul className="pt-posts">
        {s.posts.map((p) => (
          <li key={p.id} className="pt-card">
            <h2>
              {p.title} {p.sample && <Sample />}
            </h2>
            {p.body && <p>{p.body}</p>}
            <small>
              {personById(p.by)?.name} · {when(p.at)}
            </small>
          </li>
        ))}
      </ul>
    </Page>
  );
}
