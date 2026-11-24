// The office side, for Daniel and David, at /portal/office. Live, they sign in with Google and
// only the accounts on the office list get in; the server checks every office action. Here:
// what needs attention, announcements, the team list (with the checklist for when a driver
// leaves and switching a phone off), trucks and trailers, the sign-off record and handbook,
// the maintenance board, crashes and inspections, and the questions only Daniel can answer.
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { UNIT_DEFAULTS } from './data';
import { GUIDES, guideBySlug } from './guides';
import { START_STEPS } from './Start';
import {
  DAY_MS,
  REPORT_STATUSES,
  ROLES,
  UNIT_KINDS,
  actions,
  currentVersion,
  dotAccident,
  exportUrl,
  isListed,
  keepUntil,
  lastSignoff,
  nameOf,
  photoUrl,
  toSign,
  unitOf,
  useMeta,
  usePortal,
  when,
  whenDay,
  type LeavingStep,
  type Person,
  type ReportStatus,
  type Role,
  type State,
  type Unit,
  type UnitKind,
} from './store';
import { Icon, Page, Sample, Std, Tbd } from './ui';

const driversOf = (s: State) => s.people.filter((p) => p.role === 'driver' && p.active !== false);
const useDemo = () => useMeta().mode !== 'live';

/* ---------- Office sign-in (live) ---------- */

type GoogleId = {
  accounts: { id: { initialize(o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }): void; renderButton(el: HTMLElement, o: Record<string, unknown>): void } };
};
let gis: Promise<GoogleId> | null = null;
const loadGis = () =>
  (gis ??= new Promise<GoogleId>((ok, no) => {
    const el = document.createElement('script');
    el.src = 'https://accounts.google.com/gsi/client';
    el.async = true;
    el.onload = () => ok((window as unknown as { google: GoogleId }).google);
    el.onerror = () => {
      gis = null;
      no(new Error('Google sign-in didn’t load'));
    };
    document.head.appendChild(el);
  }));

// Every office screen sits behind this. In the demo it lets everyone through.
export function OfficeGate({ children }: { children: ReactNode }) {
  const m = useMeta();
  if (m.mode !== 'live' || m.session.kind === 'office') return <>{children}</>;
  return <OfficeSignIn />;
}

function OfficeSignIn() {
  const m = useMeta();
  const box = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState('');
  const client = m.ready.google;
  useEffect(() => {
    if (!client || !box.current) return;
    let gone = false;
    loadGis()
      .then((g) => {
        if (gone || !box.current) return;
        g.accounts.id.initialize({
          client_id: client,
          callback: async ({ credential }) => {
            const r = await actions.officeSignIn(credential);
            if (!r.ok) setErr(r.error);
          },
        });
        g.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 280 });
      })
      .catch(() => setErr('Google sign-in didn’t load. Check the signal and try again.'));
    return () => {
      gone = true;
    };
  }, [client]);
  return (
    <Page title="Office sign-in" back={{ to: '/portal', label: 'Portal home' }}>
      <p className="pt-lede">The office side is for Daniel and David. Sign in with your FX4 Google account.</p>
      {client ? <div className="pt-google" ref={box} /> : <p className="pt-err">Office sign-in isn’t switched on yet.</p>}
      {err && (
        <p className="pt-err" role="alert">
          {err}
        </p>
      )}
      <p className="pt-fine">Only the accounts on the office list get in. Drivers use the driver side on their own phones.</p>
    </Page>
  );
}

function unitStatus(s: State, u: Unit) {
  const live = s.reports.filter((r) => r.unit === u.id && r.status !== 'Fixed');
  if (live.some((r) => r.status === 'In the shop')) return 'In the shop';
  if (live.length) return 'Needs a look';
  return 'OK';
}
const cls = (status: string) => `pt-status s-${status.replace(/\s/g, '').toLowerCase()}`;

export function AdminHome() {
  const s = usePortal();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posted, setPosted] = useState(false);
  const open = s.reports.filter((r) => r.status !== 'Fixed');
  const urgent = open.filter((r) => r.urgent && r.status === 'Open').length;
  const m = useMeta();
  const shop = s.units.filter((u) => unitStatus(s, u) === 'In the shop').length;
  const waiting = driversOf(s).filter((d) => toSign(s, d.id).length > 0);
  const notHelpful = Object.entries(
    s.feedback.filter((f) => !f.helped).reduce<Record<string, number>>((a, f) => ({ ...a, [f.guide]: (a[f.guide] ?? 0) + 1 }), {}),
  );
  const post = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    void actions.post('office', title.trim(), body.trim());
    setTitle('');
    setBody('');
    setPosted(true);
  };
  return (
    <Page title="Office" kicker={m.session.kind === 'office' ? `Signed in as ${m.session.email}` : 'Daniel and David'} wide>
      {m.mode === 'live' && !m.ready.mail && (
        <p className="pt-err" role="note">
          Email alerts for urgent reports and crashes aren’t switched on yet. Check this page for new reports.
        </p>
      )}
      <div className="pt-stats">
        <Link to="/portal/office/maintenance" className={urgent ? 'pt-stat red' : 'pt-stat'}>
          <b>{open.length}</b>
          <span>Open problems{urgent ? ` · ${urgent} urgent` : ''}</span>
        </Link>
        <Link to="/portal/office/maintenance" className="pt-stat">
          <b>{shop}</b>
          <span>{shop === 1 ? 'Unit in the shop' : 'Units in the shop'}</span>
        </Link>
        <Link to="/portal/office/sign-offs" className={waiting.length ? 'pt-stat red' : 'pt-stat'}>
          <b>{waiting.length}</b>
          <span>{waiting.length === 1 ? 'Driver hasn’t signed' : 'Drivers haven’t signed'}</span>
        </Link>
        <Link to="/portal/news" className="pt-stat">
          <b>{s.posts.length}</b>
          <span>{s.posts.length === 1 ? 'Announcement' : 'Announcements'}</span>
        </Link>
      </div>

      <div className="pt-adminlinks">
        <Link className="pt-tile" to="/portal/office/team">
          <Icon name="users" size={28} />
          <b>Team list</b>
          <small>Whose numbers show, and the checklist for when a driver leaves</small>
        </Link>
        <Link className="pt-tile" to="/portal/office/units">
          <Icon name="truck" size={28} />
          <b>Trucks and trailers</b>
          <small>Add a unit, its lock (never the code), guides and specs</small>
        </Link>
        <Link className="pt-tile" to="/portal/office/sign-offs">
          <Icon name="shield" size={28} />
          <b>Handbook and sign-offs</b>
          <small>Change a rule, and who signed which version, and when</small>
        </Link>
        <Link className="pt-tile" to="/portal/office/maintenance">
          <Icon name="board" size={28} />
          <b>Maintenance board</b>
          <small>Every problem report, with photos, time and who sent it</small>
        </Link>
        <Link className="pt-tile" to="/portal/office/stickers">
          <Icon name="qr" size={28} />
          <b>QR stickers</b>
          <small>Print one for every trailer and truck</small>
        </Link>
        <Link className="pt-tile" to="/portal/office/records">
          <Icon name="clipboard" size={28} />
          <b>Crashes and inspections{dueSignoffs(s) ? ` · ${dueSignoffs(s)} to sign off` : ''}</b>
          <small>The accident register and the 15-day sign-off for roadside inspections</small>
        </Link>
        <Link className="pt-tile" to="/portal/office/questions">
          <Icon name="question" size={28} />
          <b>Questions for Daniel · {questionSummary()}</b>
          <small>Standard answers to confirm, and what only FX4 can answer</small>
        </Link>
      </div>

      <div className="pt-grid2">
        <form className="pt-card pt-form" onSubmit={post}>
          <h2>Post an announcement</h2>
          <label htmlFor="pt-nt">Headline</label>
          <input id="pt-nt" value={title} onChange={(e) => { setTitle(e.target.value); setPosted(false); }} />
          <label htmlFor="pt-nb">Details</label>
          <textarea id="pt-nb" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          <button className="pt-btn red" type="submit">
            Post to the team
          </button>
          <p className="pt-fine" aria-live="polite">{posted ? 'Posted. It shows as new on every home screen.' : 'Shows as new on every home screen.'}</p>
        </form>
        {notHelpful.length > 0 && (
          <section className="pt-card">
            <h2>Guides drivers said didn’t help</h2>
            <ul className="pt-plain">
              {notHelpful.map(([slug, n]) => (
                <li key={slug}>
                  <Link to={`/portal/guides/${slug}`}>{guideBySlug(slug)?.title}</Link> · {n} {n === 1 ? 'time' : 'times'}
                </li>
              ))}
            </ul>
            <p className="pt-fine">These are the questions still reaching your phone. Fix the guide and the calls drop.</p>
          </section>
        )}
      </div>
    </Page>
  );
}

/* ---------- Crashes and roadside inspections ---------- */

// Live: download a record as a spreadsheet file, for an auditor or the insurer.
function Exports() {
  if (useDemo()) return null;
  return (
    <div className="pt-row2 pt-exports">
      <a className="pt-btn line" href={exportUrl('accidents')} download>
        <Icon name="file" /> Accident register (CSV)
      </a>
      <a className="pt-btn line" href={exportUrl('inspections')} download>
        <Icon name="file" /> Roadside inspections (CSV)
      </a>
    </div>
  );
}

const dueSignoffs = (s: State) => s.reports.filter((r) => r.roadside && r.roadside.result !== 'No violations' && !r.roadside.certified).length;

export function Records() {
  const s = usePortal();
  const crashes = s.reports.filter((r) => r.crash);
  const inspections = s.reports.filter((r) => r.roadside);
  const now = Date.now();
  return (
    <Page title="Crashes and inspections" back={{ to: '/portal/office', label: 'Office' }} kicker="Records FX4 must keep" wide>
      <p className="pt-lede">Filled in from drivers’ crash and roadside inspection reports. Nothing here can be deleted.</p>
      <Exports />

      <h2 className="pt-h2">Accident register</h2>
      <p className="pt-fine">
        Only DOT accidents go on the register: a death, someone treated away from the scene, or a vehicle towed away (49 CFR 390.5). Keep it 3 years, with copies of the police and insurer
        reports (49 CFR 390.15).
      </p>
      {crashes.length === 0 ? (
        <p>No crashes reported.</p>
      ) : (
        <div className="pt-tablewrap" tabIndex={0} role="region" aria-label="Accident register">
          <table className="pt-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Where</th>
                <th scope="col">Driver</th>
                <th scope="col">Treated away from scene</th>
                <th scope="col">Deaths</th>
                <th scope="col">Towed</th>
                <th scope="col">Hazmat spilled</th>
                <th scope="col">DOT accident?</th>
                <th scope="col">Police report</th>
                <th scope="col">Copies filed</th>
                <th scope="col">Keep until</th>
              </tr>
            </thead>
            <tbody>
              {crashes.map((r) => {
                const c = r.crash!;
                const dot = dotAccident(c);
                return (
                  <tr key={r.id}>
                    <td>
                      {whenDay(r.at)}
                      {r.sample && <small>Sample</small>}
                    </td>
                    <td>
                      {c.place}, {c.state}
                      <small>{unitOf(s, r.unit)?.label}</small>
                    </td>
                    <td>{nameOf(s, r.by)}</td>
                    <td>{c.hurt}</td>
                    <td>{c.deaths}</td>
                    <td>{c.towed}</td>
                    <td>{c.hazmat ? 'Yes' : 'No'}</td>
                    <td className={dot === 'Yes' ? 'pt-need' : undefined}>{dot === 'Check' ? 'Check the tow' : dot}</td>
                    <td>{c.police || <span className="pt-fine">Not given</span>}</td>
                    <td>
                      <label className="pt-check pt-check-sm">
                        <input type="checkbox" checked={!!c.copies} onChange={() => void actions.copiesFiled(r.id)} />
                        <span>{c.copies ? `Filed ${whenDay(c.copies)}` : 'Not yet'}</span>
                      </label>
                    </td>
                    <td>{whenDay(keepUntil(r).at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="pt-h2">Roadside inspections</h2>
      <p className="pt-fine">
        Sign off the repairs within 15 days of the inspection, send the form back if the state asks, and keep a copy for 12 months (49 CFR 396.9(d)).
      </p>
      {inspections.length === 0 ? (
        <p>No roadside inspections reported.</p>
      ) : (
        <div className="pt-tablewrap" tabIndex={0} role="region" aria-label="Roadside inspections">
          <table className="pt-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Unit and place</th>
                <th scope="col">Driver</th>
                <th scope="col">Result</th>
                <th scope="col">Sign off by</th>
                <th scope="col">Repairs signed off</th>
                <th scope="col">Keep until</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((r) => {
                const x = r.roadside!;
                const due = r.at + 15 * DAY_MS;
                const clean = x.result === 'No violations';
                const late = !clean && !x.certified && now > due;
                return (
                  <tr key={r.id}>
                    <td>
                      {whenDay(r.at)}
                      {r.sample && <small>Sample</small>}
                    </td>
                    <td>
                      {unitOf(s, r.unit)?.label}
                      <small>
                        {x.place}, {x.state}
                      </small>
                    </td>
                    <td>{nameOf(s, r.by)}</td>
                    <td>{x.result}</td>
                    <td className={late ? 'pt-need' : undefined}>{clean ? 'Nothing to fix' : `${whenDay(due)}${late ? ', late' : ''}`}</td>
                    <td>
                      {clean ? (
                        <span className="pt-fine">Not needed</span>
                      ) : (
                        <label className="pt-check pt-check-sm">
                          <input type="checkbox" checked={!!x.certified} onChange={() => void actions.certify(r.id)} />
                          <span>{x.certified ? `Signed ${whenDay(x.certified)}` : 'Not yet'}</span>
                        </label>
                      )}
                    </td>
                    <td>{whenDay(keepUntil(r).at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}

/* ---------- Questions for Daniel ---------- */

// Things only FX4 can answer that aren't tied to one guide step. The guide and first-week
// questions are collected from guides.ts and Start.tsx, so this list stays in step with the screens.
// std: the industry-standard answer the portal shows until Daniel confirms or changes it
// (Robert, Nov 16, 2026). No std means there's no standard answer: only FX4 can fill it in.
type Question = { q: string; std?: string };

const PORTAL_QUESTIONS: { group: string; items: Question[] }[] = [
  {
    group: 'Trucks and trailers',
    items: [
      { q: 'The real unit list: each truck and trailer number and type.' },
      {
        q: 'Which lock is on each trailer (kingpin, gladhand or door padlock).',
        std: 'A kingpin lock on every parked trailer, plus a padlock or seal on van doors.',
      },
      {
        q: 'Which trailers have sliding tandems.',
        std: 'Most dry vans have sliding tandems; most flatbeds and step decks have fixed or spread axles.',
      },
      { q: 'Specs for each unit: length, axles, empty weight and plate for trailers; make and year, plate, ELD and fuel card for trucks.' },
    ],
  },
  {
    group: 'Office and rules',
    items: [
      {
        q: 'FX4’s drug and alcohol testing policy, for the rules.',
        std: 'The federal rules as written (49 CFR part 382): tests before hire, at random, after certain crashes, on reasonable suspicion, and before and after a return to duty, plus a Clearinghouse check before hire and every year.',
      },
      { q: 'The handbook and the sign-off wording, reviewed by FX4’s lawyer.' },
      {
        q: 'Does FX4 file IFTA fuel tax reports? It changes which fuel records drivers keep.',
        std: 'Yes. An interstate truck over 26,000 lb, or with 3 or more axles, needs an IFTA license. Drivers keep every fuel receipt; the ELD tracks miles by state.',
      },
      {
        q: 'The 10 things drivers call about most. They become the next guides.',
        std: 'Load details and appointment changes, waits at the dock, unloading fees, breakdowns, pay, fuel card problems, ELD problems, where to park, paperwork and home time.',
      },
    ],
  },
];

function startQuestions(): Question[] {
  return START_STEPS.filter((st) => st.daniel).map((st) => ({ q: `${st.title}: ${st.daniel}`, std: st.std }));
}

function guideQuestions() {
  return GUIDES.map((g) => ({
    guide: g,
    items: [
      ...g.steps.filter((st) => st.daniel).map((st): Question => ({ q: `${st.title}: ${st.daniel}`, std: st.std })),
      ...(g.fx4 ? [{ q: g.fx4, std: g.fx4Std }] : []),
    ],
  })).filter((x) => x.items.length > 0);
}

function questionCounts() {
  const all = [...startQuestions(), ...guideQuestions().flatMap((x) => x.items), ...PORTAL_QUESTIONS.flatMap((x) => x.items)];
  const confirm = all.filter((x) => x.std).length;
  return { confirm, open: all.length - confirm };
}

function questionSummary() {
  const { confirm, open } = questionCounts();
  return `${confirm} to confirm · ${open} open`;
}

function QuestionList({ items }: { items: Question[] }) {
  return (
    <ul className="pt-plain">
      {items.map((it) => (
        <li key={it.q}>
          {it.q}
          {it.std ? (
            <span className="pt-std-a">
              <Std /> {it.std}
            </span>
          ) : (
            <>
              {' '}
              <Tbd>Open</Tbd>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export function Questions() {
  return (
    <Page title="Questions for Daniel" back={{ to: '/portal/office', label: 'Office' }} kicker={questionSummary()} wide>
      <p className="pt-lede">
        Every spot in the portal only FX4 can answer. Most now show the industry-standard answer, marked “Standard, to confirm”: keep it or change it. The ones marked “Open” have no standard answer.
      </p>
      <div className="pt-grid2">
        <section className="pt-card">
          <h2>A new driver’s first week</h2>
          <QuestionList items={startQuestions()} />
          <p className="pt-fine">
            Shows on <Link to="/portal/start">New here? Start here</Link>.
          </p>
        </section>
        {PORTAL_QUESTIONS.map((q) => (
          <section className="pt-card" key={q.group}>
            <h2>{q.group}</h2>
            <QuestionList items={q.items} />
          </section>
        ))}
      </div>
      <h2 className="pt-h2">Guides</h2>
      <div className="pt-grid2">
        {guideQuestions().map(({ guide, items }) => (
          <section className="pt-card" key={guide.slug}>
            <h3>
              <Link to={`/portal/guides/${guide.slug}`}>{guide.title}</Link>
            </h3>
            <QuestionList items={items} />
          </section>
        ))}
      </div>
    </Page>
  );
}

/* ---------- Team list ---------- */

const LEAVING: { step: LeavingStep; label: string }[] = [
  { step: 'codes', label: 'Lock codes changed' },
  { step: 'keys', label: 'Keys back' },
  { step: 'fuel', label: 'Fuel card back' },
  { step: 'files', label: 'Driver file updated' },
  { step: 'phone', label: 'Phone sign-in switched off' },
];
const ROLE_LABEL: Record<Role, string> = { driver: 'Driver', dispatch: 'Dispatch', owner: 'Owner' };
const blankPerson = { name: '', role: 'driver' as Role, title: 'Class A driver', phone: '', listed: false, active: true };

function PersonForm({ person, onDone }: { person?: Person; onDone: () => void }) {
  const [f, setF] = useState(() => (person ? { name: person.name, role: person.role, title: person.title, phone: person.phone ?? '', listed: person.listed, active: person.active !== false } : blankPerson));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const key = person?.id ?? 'new';
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Add their name.');
    if (f.phone.trim() && f.phone.replace(/\D/g, '').replace(/^1/, '').length !== 10) return setErr('Use a 10-digit US cell number, like (503) 555-0101.');
    setBusy(true);
    const r = await actions.savePerson({ id: person?.id, ...f, name: f.name.trim(), title: f.title.trim() });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    onDone();
  };
  return (
    <form className="pt-form pt-personform" onSubmit={submit} noValidate>
      <div className="pt-two">
        <div>
          <label htmlFor={`pf-name-${key}`}>Name</label>
          <input id={`pf-name-${key}`} value={f.name} autoComplete="off" onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`pf-role-${key}`}>Role</label>
          <select id={`pf-role-${key}`} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="pt-two">
        <div>
          <label htmlFor={`pf-title-${key}`}>Job title</label>
          <input id={`pf-title-${key}`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`pf-phone-${key}`}>Cell number (sign-in codes go here)</label>
          <input id={`pf-phone-${key}`} inputMode="tel" autoComplete="off" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="(503) 555-0101" />
        </div>
      </div>
      <label className="pt-check">
        <input type="checkbox" checked={f.listed} disabled={!f.phone.trim()} onChange={(e) => setF({ ...f, listed: e.target.checked })} />
        Show this number on the Team page (they agreed)
      </label>
      {person && (
        <label className="pt-check">
          <input type="checkbox" checked={!f.active} onChange={(e) => setF({ ...f, active: !e.target.checked })} />
          Left FX4: take them off the sign-in list and switch off their phones (their records stay)
        </label>
      )}
      {person?.phone && f.phone !== person.phone && <p className="pt-fine">A new number switches off the phones signed in under the old one.</p>}
      {err && (
        <p className="pt-err" role="alert">
          {err}
        </p>
      )}
      <div className="pt-row2">
        <button className="pt-btn red" type="submit" disabled={busy}>
          {busy ? 'Saving…' : person ? 'Save' : 'Add to the team'}
        </button>
        <button className="pt-btn line" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function People() {
  const s = usePortal();
  const demo = useDemo();
  const [editing, setEditing] = useState<string | null>(null);
  const phones = (pid: string) => (s.devices ?? []).filter((d) => d.person === pid);
  return (
    <Page title="Team list" back={{ to: '/portal/office', label: 'Office' }} wide>
      <p className="pt-lede">
        Drivers sign in once per phone with a code texted to the number here. The portal still holds nothing a driver could misuse: no lock codes, load values, customer addresses or pay.
        When someone leaves, switch off their phone, change the lock codes and work through the checklist.
      </p>
      {editing === 'new' ? (
        <section className="pt-card">
          <h2>Add someone</h2>
          <PersonForm onDone={() => setEditing(null)} />
        </section>
      ) : (
        <button className="pt-btn red" type="button" onClick={() => setEditing('new')}>
          <Icon name="users" /> Add someone
        </button>
      )}
      <ul className="pt-peoplecards">
        {s.people.map((p) => {
          const done = LEAVING.filter((l) => s.leaving[p.id]?.[l.step]).length;
          const listed = isListed(s, p.id);
          const on = phones(p.id);
          const gone = p.active === false;
          return (
            <li key={p.id} className={gone ? 'pt-card pt-gone' : 'pt-card'}>
              <div className="pt-person-hd">
                <span>
                  <b>{p.name}</b> {p.sample && <Sample />} {gone && <span className="pt-tbd">Left FX4</span>}
                  <small>
                    {p.title || ROLE_LABEL[p.role]}
                    {p.phone ? ` · ${p.phone}` : ' · no cell number yet'}
                  </small>
                </span>
                {editing !== p.id && (
                  <button className="pt-mini" type="button" onClick={() => setEditing(p.id)}>
                    Edit
                  </button>
                )}
              </div>
              {editing === p.id ? (
                <PersonForm person={p} onDone={() => setEditing(null)} />
              ) : (
                <>
                  {p.phone && !gone && (
                    <label className="pt-check">
                      <input type="checkbox" checked={listed} onChange={(e) => void actions.setListed(p.id, e.target.checked)} />
                      Show this number on the Team page (they agreed)
                    </label>
                  )}
                  {!demo && p.role !== 'owner' && (
                    <p className="pt-phones">
                      <span>{on.length === 0 ? 'Not signed in on any phone' : on.length === 1 ? `Signed in on 1 phone since ${whenDay(on[0].at)}` : `Signed in on ${on.length} phones`}</span>
                      {on.length > 0 && (
                        <button className="pt-mini" type="button" onClick={() => void actions.phoneOff(p.id)}>
                          <Icon name="power" size={16} /> Switch off
                        </button>
                      )}
                    </p>
                  )}
                </>
              )}

              {p.role === 'driver' && editing !== p.id && (
                <details className="pt-leaving">
                  <summary>
                    When a driver leaves · {done} of {LEAVING.length} done
                  </summary>
                  <ul>
                    {LEAVING.map((l) => {
                      const at = s.leaving[p.id]?.[l.step];
                      return (
                        <li key={l.step}>
                          <label className="pt-check">
                            <input type="checkbox" checked={!!at} onChange={() => void actions.tick(p.id, l.step)} />
                            {l.label}
                          </label>
                          {at ? <small>{when(at)}</small> : null}
                        </li>
                      );
                    })}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </Page>
  );
}

/* ---------- Trucks and trailers ---------- */

type UnitDraft = { id: string; kind: UnitKind; label: string; what: string; how: string; specs: { k: string; v?: string }[]; guides: string[]; active: boolean };
const draftFor = (kind: UnitKind, id = ''): UnitDraft => {
  const d = UNIT_DEFAULTS[kind];
  return { id, kind, label: id ? `${d.short} ${id}` : '', what: d.lock.what, how: d.lock.how, specs: d.specs.map((k) => ({ k })), guides: d.guides, active: true };
};
const draftOf = (u: Unit): UnitDraft => ({ id: u.id, kind: u.kind, label: u.label, what: u.lock.what, how: u.lock.how, specs: u.specs, guides: u.guides, active: u.active !== false });

function UnitForm({ unit, onDone }: { unit?: Unit; onDone: () => void }) {
  const [f, setF] = useState<UnitDraft>(() => (unit ? draftOf(unit) : draftFor('flatbed')));
  const [labelTouched, setLabelTouched] = useState(!!unit);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const key = unit?.id ?? 'new';
  const setKind = (kind: UnitKind) => {
    const d = draftFor(kind, f.id);
    setF({ ...d, label: labelTouched ? f.label : d.label, specs: unit ? f.specs : d.specs });
  };
  const setId = (id: string) => setF({ ...f, id, label: labelTouched ? f.label : id ? `${UNIT_DEFAULTS[f.kind].short} ${id}` : '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9-]{1,12}$/.test(f.id.trim())) return setErr('Use the unit number painted on it: letters, numbers and dashes.');
    if (!f.label.trim()) return setErr('Add the name drivers see, like Flatbed 201.');
    setBusy(true);
    const r = await actions.saveUnit({
      id: f.id.trim(),
      isNew: !unit,
      kind: f.kind,
      label: f.label.trim(),
      lock: { what: f.what.trim(), how: f.how.trim() },
      guides: f.guides,
      specs: f.specs.map((x) => (x.v?.trim() ? { k: x.k, v: x.v.trim() } : { k: x.k })),
      active: f.active,
    });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    onDone();
  };
  return (
    <form className="pt-form pt-unitform" onSubmit={submit} noValidate>
      <div className="pt-two">
        <div>
          <label htmlFor={`uf-id-${key}`}>Unit number</label>
          <input id={`uf-id-${key}`} value={f.id} disabled={!!unit} onChange={(e) => setId(e.target.value)} placeholder="201" />
        </div>
        <div>
          <label htmlFor={`uf-kind-${key}`}>Kind</label>
          <select id={`uf-kind-${key}`} value={f.kind} onChange={(e) => setKind(e.target.value as UnitKind)}>
            {UNIT_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label htmlFor={`uf-label-${key}`}>Name drivers see</label>
      <input
        id={`uf-label-${key}`}
        value={f.label}
        onChange={(e) => {
          setLabelTouched(true);
          setF({ ...f, label: e.target.value });
        }}
      />
      <div className="pt-two">
        <div>
          <label htmlFor={`uf-what-${key}`}>Lock</label>
          <input id={`uf-what-${key}`} value={f.what} onChange={(e) => setF({ ...f, what: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`uf-how-${key}`}>How a driver gets the code or key</label>
          <input id={`uf-how-${key}`} value={f.how} onChange={(e) => setF({ ...f, how: e.target.value })} />
        </div>
      </div>
      <p className="pt-fine">Never the code itself: drivers get codes from Daniel or David by phone. The lock lines start as the standard answer; change them to match the unit.</p>
      <fieldset className="pt-sub">
        <legend>Specs (leave a blank to show “To fill in”)</legend>
        <div className="pt-two">
          {f.specs.map((x, i) => (
            <div key={x.k}>
              <label htmlFor={`uf-spec-${key}-${i}`}>{x.k}</label>
              <input id={`uf-spec-${key}-${i}`} value={x.v ?? ''} onChange={(e) => setF({ ...f, specs: f.specs.map((y, j) => (j === i ? { k: y.k, v: e.target.value } : y)) })} />
            </div>
          ))}
        </div>
      </fieldset>
      <p className="pt-fine">Guides on its page: {f.guides.map((g) => guideBySlug(g)?.title ?? g).join(', ')}.</p>
      {unit && (
        <label className="pt-check">
          <input type="checkbox" checked={!f.active} onChange={(e) => setF({ ...f, active: !e.target.checked })} />
          Sold or out of service: hide it from drivers (its reports stay)
        </label>
      )}
      {err && (
        <p className="pt-err" role="alert">
          {err}
        </p>
      )}
      <div className="pt-row2">
        <button className="pt-btn red" type="submit" disabled={busy}>
          {busy ? 'Saving…' : unit ? 'Save' : 'Add the unit'}
        </button>
        <button className="pt-btn line" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function UnitsAdmin() {
  const s = usePortal();
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Page title="Trucks and trailers" back={{ to: '/portal/office', label: 'Office' }} wide>
      <p className="pt-lede">Each unit gets a page drivers open from its QR sticker: the lock (never the code), its guides, open problems and specs.</p>
      {editing === 'new' ? (
        <section className="pt-card">
          <h2>Add a unit</h2>
          <UnitForm onDone={() => setEditing(null)} />
        </section>
      ) : (
        <div className="pt-row2">
          <button className="pt-btn red" type="button" onClick={() => setEditing('new')}>
            <Icon name="truck" /> Add a unit
          </button>
          <Link className="pt-btn line" to="/portal/office/stickers">
            <Icon name="qr" /> Print stickers
          </Link>
        </div>
      )}
      <ul className="pt-peoplecards">
        {s.units.map((u) => (
          <li key={u.id} className={u.active === false ? 'pt-card pt-gone' : 'pt-card'}>
            <div className="pt-person-hd">
              <span>
                <b>{u.label}</b> {u.sample && <Sample />} {u.active === false && <span className="pt-tbd">Hidden from drivers</span>}
                <small>
                  {u.kindLabel} · {u.lock.what} · {u.specs.filter((x) => !x.v).length ? `${u.specs.filter((x) => !x.v).length} specs to fill in` : 'specs filled in'}
                </small>
              </span>
              {editing !== u.id && (
                <button className="pt-mini" type="button" onClick={() => setEditing(u.id)}>
                  Edit
                </button>
              )}
            </div>
            {editing === u.id && <UnitForm unit={u} onDone={() => setEditing(null)} />}
          </li>
        ))}
      </ul>
    </Page>
  );
}

/* ---------- Handbook and sign-off record ---------- */

export function Signoffs() {
  const s = usePortal();
  const demo = useDemo();
  const signers = s.people.filter((p) => p.role !== 'owner' && p.active !== false);
  const [adding, setAdding] = useState(false);
  return (
    <Page title="Handbook and sign-offs" back={{ to: '/portal/office', label: 'Office' }} wide>
      <p className="pt-lede">Every signature keeps who signed, the exact version and the time. Change a rule and everyone signs again.</p>
      {!demo && (
        <div className="pt-row2 pt-exports">
          <a className="pt-btn line" href={exportUrl('signoffs')} download>
            <Icon name="file" /> Sign-off record (CSV)
          </a>
        </div>
      )}
      {s.rules.length === 0 ? (
        <p className="pt-fine">No rules yet. Add FX4’s handbook below, one rule at a time. Have FX4’s lawyer review the wording first.</p>
      ) : (
        <div className="pt-tablewrap" tabIndex={0} role="region" aria-label="Sign-offs by person and rule">
          <table className="pt-table">
            <thead>
              <tr>
                <th scope="col">Person</th>
                {s.rules.map((r) => (
                  <th key={r.id} scope="col">
                    {r.title}
                    <small>v{currentVersion(s, r.id).version}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {signers.map((p) => (
                <tr key={p.id}>
                  <th scope="row">{p.name}</th>
                  {s.rules.map((r) => {
                    const cur = currentVersion(s, r.id).version;
                    const last = lastSignoff(s, p.id, r.id);
                    const ok = (last?.version ?? 0) >= cur;
                    return (
                      <td key={r.id} className={ok ? 'pt-ok' : 'pt-need'}>
                        {ok ? (
                          <>
                            <Icon name="check" size={16} /> v{last!.version}
                            <small>{whenDay(last!.at)}</small>
                          </>
                        ) : (
                          <>
                            Needs v{cur}
                            {last && <small>Signed v{last.version}</small>}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="pt-h2">Change a rule</h2>
      <div className="pt-grid2">
        {s.rules.map((r) => (
          <RuleEditor key={r.id} rule={r.id} />
        ))}
        {adding ? (
          <RuleEditor onDone={() => setAdding(false)} />
        ) : (
          <button className="pt-btn line" type="button" onClick={() => setAdding(true)}>
            <Icon name="shield" /> Add a rule
          </button>
        )}
      </div>
    </Page>
  );
}

// Edit a rule's wording, or write a new one. Saving publishes a new version for everyone to sign.
function RuleEditor({ rule, onDone }: { rule?: string; onDone?: () => void }) {
  const s = usePortal();
  const cur = s.rules.find((r) => r.id === rule);
  const [title, setTitle] = useState(cur?.title ?? '');
  const [text, setText] = useState(cur?.points.join('\n') ?? '');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const key = rule ?? 'new';
  const history = rule ? s.versions.filter((v) => v.rule === rule).sort((a, b) => b.version - a.version) : [];
  const next = rule ? currentVersion(s, rule).version + 1 : 1;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const points = text.split('\n').map((x) => x.trim()).filter(Boolean);
    if (!title.trim() || !points.length) return setErr('Give the rule a title and at least one line.');
    if (rule && !note.trim()) return setErr('Say what changed, so drivers see it when they sign again.');
    setBusy(true);
    const r = await actions.saveRule({ rule, title: title.trim(), points, note: note.trim() });
    setBusy(false);
    if (!r.ok) return setErr(r.error);
    setNote('');
    setErr('');
    onDone?.();
  };
  return (
    <form className="pt-card pt-form" onSubmit={submit} noValidate>
      <h3>{cur?.title ?? 'New rule'}</h3>
      <label htmlFor={`re-title-${key}`}>Title</label>
      <input id={`re-title-${key}`} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor={`re-text-${key}`}>The rule, one point per line</label>
      <textarea id={`re-text-${key}`} rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      <label htmlFor={`re-note-${key}`}>{rule ? 'What changed?' : 'Note (optional)'}</label>
      <input id={`re-note-${key}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder={rule ? 'Example: new fuel card rule' : 'First version'} />
      {err && (
        <p className="pt-err" role="alert">
          {err}
        </p>
      )}
      <div className="pt-row2">
        <button className="pt-btn line" type="submit" disabled={busy}>
          {busy ? 'Publishing…' : `Publish version ${next}`}
        </button>
        {onDone && (
          <button className="pt-btn line" type="button" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
      {history.length > 0 && (
        <ul className="pt-history">
          {history.map((v) => (
            <li key={v.version}>
              <span className="mono">v{v.version}</span> {whenDay(v.at)} · {v.note}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

/* ---------- Maintenance board ---------- */

const FILTERS = ['Not fixed', ...REPORT_STATUSES, 'All'] as const;

export function Maintenance() {
  const s = usePortal();
  const demo = useDemo();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Not fixed');
  const list = s.reports.filter((r) => (filter === 'All' ? true : filter === 'Not fixed' ? r.status !== 'Fixed' : r.status === filter));
  return (
    <Page title="Maintenance board" back={{ to: '/portal/office', label: 'Office' }} wide>
      <ul className="pt-unitgrid">
        {s.units
          .filter((u) => u.active !== false)
          .map((u) => {
            const st = unitStatus(s, u);
            return (
              <li key={u.id}>
                <Link to={`/portal/unit/${u.id}`}>
                  <b>{u.label}</b>
                  <small>
                    {u.kindLabel}
                    {u.sample && (
                      <>
                        {' · '}
                        <Sample />
                      </>
                    )}
                  </small>
                  <span className={cls(st)}>{st}</span>
                </Link>
              </li>
            );
          })}
      </ul>

      <h2 className="pt-h2">Problem reports</h2>
      {!demo && (
        <div className="pt-row2 pt-exports">
          <a className="pt-btn line" href={exportUrl('reports')} download>
            <Icon name="file" /> Every report (CSV)
          </a>
        </div>
      )}
      <div className="pt-filter" role="group" aria-label="Show reports">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="pt-fine">No reports here.</p>
      ) : (
        <ul className="pt-reportcards">
          {list.map((r) => {
            const keep = keepUntil(r);
            return (
              <li key={r.id} className={r.urgent && r.status === 'Open' ? 'pt-card urgent' : 'pt-card'}>
                <div className="pt-person-hd">
                  <span>
                    <b>
                      {unitOf(s, r.unit)?.label ?? r.unit} · {r.kind}
                    </b>
                    {r.urgent && <span className="pt-urgent">Urgent</span>} {r.sample && <Sample />}
                    <small>
                      {nameOf(s, r.by)} · {when(r.at)} · {r.photos} {r.photos === 1 ? 'photo' : 'photos'}
                    </small>
                  </span>
                  <span className={cls(r.status)}>{r.status}</span>
                </div>
                <p>{r.text}</p>
                {r.photoIds && r.photoIds.length > 0 && (
                  <div className="pt-thumbs">
                    {r.photoIds.map((pid, i) => (
                      <a key={pid} href={photoUrl(pid)} target="_blank" rel="noreferrer">
                        <img src={photoUrl(pid)} alt={`Photo ${i + 1} of ${r.photoIds!.length} from ${nameOf(s, r.by)}`} loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
                <label className="pt-inline">
                  Status
                  <select value={r.status} onChange={(e) => void actions.setStatus(r.id, e.target.value as ReportStatus)}>
                    {REPORT_STATUSES.map((st) => (
                      <option key={st}>{st}</option>
                    ))}
                  </select>
                </label>
                <p className="pt-fine">
                  Keep at least until {whenDay(keep.at)}: {keep.why}. Nothing here can be deleted.
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
