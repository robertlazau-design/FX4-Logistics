// The screens a driver uses: home, picking your name, trailer and truck pages, report a
// problem, the team list and announcements. There are no logins: picking a name only labels
// this phone's signatures and reports.
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { TrailerArt } from '../components/Graphics';
import { OFFICE, PEOPLE, RULES, UNITS, personById, unitById, type Unit } from './data';
import { GUIDES, guideBySlug } from './guides';
import { INSPECTION_RESULTS, REPORT_KINDS, actions, isListed, toSign, unseenPosts, usePortal, when, type InspectionResult, type ReportKind, type Towed } from './store';
import { START_STEPS } from './Start';
import { CallDavid, Icon, Page, Sample, Tbd } from './ui';

/* ---------- Who's using this phone (not a login) ---------- */

export function WhoAmI() {
  const s = usePortal();
  const nav = useNavigate();
  return (
    <Page title="Who’s using this phone?" back={{ to: '/portal', label: 'Home' }}>
      <p className="pt-lede">Pick your name once. It goes on the rules you sign and the problems you report from this phone.</p>
      <ul className="pt-names">
        {PEOPLE.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={s.me === p.id ? 'pt-on' : undefined}
              aria-pressed={s.me === p.id}
              onClick={() => {
                actions.setMe(p.id);
                nav('/portal');
              }}
            >
              <span>
                <b>{p.name}</b> {p.sample && <Sample />}
                <small>{p.title}</small>
              </span>
              {s.me === p.id && <Icon name="check" size={22} />}
            </button>
          </li>
        ))}
      </ul>
      <p className="pt-fine">
        Not on the list? Call the office at <a href={OFFICE.tel}>{OFFICE.phone}</a>.
      </p>
    </Page>
  );
}

// "Your name" for a signature or a report: remembers the choice on this phone.
export function NamePicker({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <>
      <label htmlFor={id}>Your name</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Pick your name</option>
        {PEOPLE.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.sample ? ' (sample)' : ''}
          </option>
        ))}
      </select>
    </>
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

export function Home() {
  const s = usePortal();
  const me = personById(s.me ?? '');
  const sign = me ? toSign(s, me.id) : [];
  const news = unseenPosts(s);
  const [q, setQ] = useState('');
  const hits = useMemo(() => search(q), [q]);
  return (
    <Page title={me ? `Hi, ${me.sample ? me.name : me.name.split(' ')[0]}` : 'FX4 Team'} kicker="FX4 team portal">
      {(!me || sign.length > 0 || news.length > 0) && (
        <div className="pt-alerts">
          {!me && (
            <Link className="pt-alert" to="/portal/start">
              <Icon name="flag" />
              <span>
                <b>New here? Start here</b>
                <small>Pick your name, sign the rules, meet your truck</small>
              </span>
              <Icon name="chevron" size={20} />
            </Link>
          )}
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
      <Link className="pt-btn line block" to="/portal/start">
        <Icon name="flag" /> New here? Start here
      </Link>
    </Page>
  );
}

function search(q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const has = (...xs: (string | undefined)[]) => xs.some((x) => x?.toLowerCase().includes(t));
  const start = START_STEPS.some((st) => has(st.title, st.text, st.daniel)) || has('new here start first week');
  return [
    ...GUIDES.filter((g) => has(g.title, g.summary, g.keywords, ...g.steps.flatMap((s) => [s.title, s.text]))).map((g) => ({ to: `/portal/guides/${g.slug}`, title: g.title, kind: 'Guide' })),
    ...(start ? [{ to: '/portal/start', title: 'New here? Start here', kind: 'First week' }] : []),
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

export function Report() {
  const s = usePortal();
  const location = useLocation();
  const [by, setBy] = useState(s.me ?? '');
  const pre = (location.state ?? {}) as { unit?: string; kind?: ReportKind };
  const [unit, setUnit] = useState(pre.unit ?? '');
  const [kind, setKind] = useState<ReportKind>(pre.kind ?? 'Defect');
  const [text, setText] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState('');
  const [sentAt, setSentAt] = useState<number | null>(null);
  // Crash and roadside inspection details (the accident register and the 15-day sign-off)
  const [place, setPlace] = useState('');
  const [usState, setUsState] = useState('');
  const [hurt, setHurt] = useState('0');
  const [deaths, setDeaths] = useState('0');
  const [towed, setTowed] = useState<Towed | ''>('');
  const [hazmat, setHazmat] = useState(false);
  const [police, setPolice] = useState('');
  const [result, setResult] = useState<InspectionResult | ''>('');
  const crash = kind === 'Crash';
  const roadside = kind === 'Roadside inspection';
  const count = (v: string) => Math.max(0, Math.floor(Number(v)) || 0);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!by) return setErr('Pick your name.');
    if (!unit) return setErr('Pick the truck or trailer.');
    if ((crash || roadside) && (!place.trim() || !usState.trim())) return setErr('Say the town and state where it happened.');
    if (crash && !towed) return setErr('Say whether any vehicle was towed away.');
    if (roadside && !result) return setErr('Pick the inspection result.');
    if (text.trim().length < 3) return setErr('Say what’s wrong in a few words.');
    setErr('');
    actions.report({
      unit,
      kind,
      text: text.trim(),
      urgent,
      by,
      photos: files.length,
      crash: crash && towed ? { place: place.trim(), state: usState.trim().toUpperCase(), hurt: count(hurt), deaths: count(deaths), towed, hazmat, police: police.trim() } : undefined,
      roadside: roadside && result ? { place: place.trim(), state: usState.trim().toUpperCase(), result } : undefined,
    });
    setSentAt(Date.now());
  };

  if (sentAt)
    return (
      <Page title="Report saved">
        <div className="pt-card pt-done">
          <Icon name="check" size={32} />
          <p>
            <b>{unitById(unit)?.label}</b>: {kind.toLowerCase()} report saved at {when(sentAt)}
            {urgent ? ', marked urgent' : ''}. It’s on the office {crash ? 'maintenance board and the accident record' : roadside ? 'inspection record, with its 15-day deadline' : 'maintenance board'}.
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
        <p className="pt-fine">Demo: nothing was sent. The report is saved in this browser only, and the office side on this same browser shows it. In the real portal, Daniel and David get it right away.</p>
      </Page>
    );

  return (
    <Page title="Report a problem" back={{ to: '/portal', label: 'Home' }}>
      <form className="pt-card pt-form" onSubmit={submit} noValidate>
        <NamePicker id="pt-by" value={by} onChange={setBy} />

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

        {(crash || roadside) && (
          <fieldset className="pt-sub">
            <legend>{crash ? 'For FX4’s accident record' : 'For FX4’s inspection record'}</legend>
            <div className="pt-two">
              <div>
                <label htmlFor="pt-place">{roadside ? 'Where (town or port of entry)' : 'Town or city'}</label>
                <input id="pt-place" value={place} onChange={(e) => setPlace(e.target.value)} />
              </div>
              <div>
                <label htmlFor="pt-state">State</label>
                <input id="pt-state" value={usState} maxLength={2} autoCapitalize="characters" placeholder="OR" onChange={(e) => setUsState(e.target.value)} />
              </div>
            </div>
            {crash && (
              <>
                <div className="pt-two">
                  <div>
                    <label htmlFor="pt-hurt">People hurt and taken for treatment</label>
                    <input id="pt-hurt" inputMode="numeric" value={hurt} onChange={(e) => setHurt(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="pt-deaths">Deaths</label>
                    <input id="pt-deaths" inputMode="numeric" value={deaths} onChange={(e) => setDeaths(e.target.value)} />
                  </div>
                </div>
                <fieldset className="pt-chips">
                  <legend>Was any vehicle towed away?</legend>
                  {(['Yes', 'No', 'Not sure'] as Towed[]).map((t) => (
                    <label key={t} className={t === towed ? 'pt-on' : undefined}>
                      <input type="radio" name="towed" value={t} checked={t === towed} onChange={() => setTowed(t)} />
                      {t}
                    </label>
                  ))}
                </fieldset>
                <label className="pt-check">
                  <input type="checkbox" checked={hazmat} onChange={(e) => setHazmat(e.target.checked)} />
                  Hazardous materials spilled (not counting fuel)
                </label>
                <label htmlFor="pt-police">Police report number, if you have it</label>
                <input id="pt-police" value={police} onChange={(e) => setPolice(e.target.value)} />
                <p className="pt-fine">
                  <Tbd>From Daniel</Tbd> His insurer’s wording for what to say and write about a crash.
                </p>
              </>
            )}
            {roadside && (
              <>
                <fieldset className="pt-chips">
                  <legend>Result</legend>
                  {INSPECTION_RESULTS.map((r) => (
                    <label key={r} className={r === result ? 'pt-on' : undefined}>
                      <input type="radio" name="result" value={r} checked={r === result} onChange={() => setResult(r)} />
                      {r}
                    </label>
                  ))}
                </fieldset>
                <p className="pt-fine">Add a photo of the inspection report below. FX4 has to sign off any repairs within 15 days.</p>
              </>
            )}
          </fieldset>
        )}

        <label htmlFor="pt-text">{crash ? 'What happened?' : roadside ? 'What did they find?' : 'What’s wrong?'}</label>
        <textarea id="pt-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={crash ? 'What happened, in order' : roadside ? 'Example: one violation, clearance light out' : 'Example: right rear marker light is out'} />

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
          Send report
        </button>
        <p className="pt-fine">The time is added for you. Demo: it’s saved in this browser only.</p>
      </form>
    </Page>
  );
}

/* ---------- Team and business info ---------- */

export function Team() {
  const s = usePortal();
  const listed = PEOPLE.filter((p) => isListed(s, p.id));
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
      <p className="pt-fine">
        Numbers show only for people who agreed to list them. Anyone with the portal link can see this page.
        {hidden > 0 ? ` ${hidden === 1 ? '1 person isn’t' : `${hidden} people aren’t`} listed.` : ''}
      </p>
      <Link className="pt-btn line block" to="/portal/news">
        Announcements
      </Link>
    </Page>
  );
}

/* ---------- Announcements ---------- */

export function News() {
  const s = usePortal();
  const ids = s.posts.map((p) => p.id).join(',');
  useEffect(() => {
    actions.seen(ids ? ids.split(',') : []);
  }, [ids]);
  return (
    <Page title="Announcements" back={{ to: '/portal/team', label: 'Team' }}>
      <ul className="pt-posts">
        {s.posts.map((p) => (
          <li key={p.id} className="pt-card">
            <h2>
              {p.title} {p.sample && <Sample />}
            </h2>
            {p.body && <p>{p.body}</p>}
            <small>
              {personById(p.by)?.name ?? 'FX4 office'} · {when(p.at)}
            </small>
          </li>
        ))}
      </ul>
    </Page>
  );
}
