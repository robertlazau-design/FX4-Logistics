// The office side, for Daniel and David, at /portal/office (an address only they are given;
// there are no logins): what needs attention, announcements, the team list (with the
// checklist for when a driver leaves), the sign-off record, the maintenance board and the
// list of questions only Daniel can answer.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PEOPLE, RULES, UNITS, personById, unitById, type Unit } from './data';
import { GUIDES, guideBySlug } from './guides';
import { START_STEPS } from './Start';
import {
  DAY_MS,
  REPORT_STATUSES,
  actions,
  currentVersion,
  dotAccident,
  isListed,
  lastSignoff,
  toSign,
  usePortal,
  when,
  whenDay,
  type LeavingStep,
  type ReportStatus,
  type State,
} from './store';
import { Icon, Page, Sample, Std, Tbd } from './ui';

const drivers = PEOPLE.filter((p) => p.role === 'driver');

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
  const shop = UNITS.filter((u) => unitStatus(s, u) === 'In the shop').length;
  const waiting = drivers.filter((d) => toSign(s, d.id).length > 0);
  const notHelpful = Object.entries(
    s.feedback.filter((f) => !f.helped).reduce<Record<string, number>>((a, f) => ({ ...a, [f.guide]: (a[f.guide] ?? 0) + 1 }), {}),
  );
  const post = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    actions.post(s.me && personById(s.me)?.role !== 'driver' ? s.me : 'office', title.trim(), body.trim());
    setTitle('');
    setBody('');
    setPosted(true);
  };
  return (
    <Page title="Office" kicker="Daniel and David" wide>
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
        <Link className="pt-tile" to="/portal/office/sign-offs">
          <Icon name="shield" size={28} />
          <b>Sign-off record</b>
          <small>Who signed which version of each rule, and when</small>
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

const keepUntil = (t: number, months: number) => {
  const d = new Date(t);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
};
const dueSignoffs = (s: State) => s.reports.filter((r) => r.roadside && r.roadside.result !== 'No violations' && !r.roadside.certified).length;

export function Records() {
  const s = usePortal();
  const crashes = s.reports.filter((r) => r.crash);
  const inspections = s.reports.filter((r) => r.roadside);
  const now = Date.now();
  return (
    <Page title="Crashes and inspections" back={{ to: '/portal/office', label: 'Office' }} kicker="Records FX4 must keep" wide>
      <p className="pt-lede">Filled in from drivers’ crash and roadside inspection reports.</p>

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
                      <small>{unitById(r.unit)?.label}</small>
                    </td>
                    <td>{personById(r.by)?.name}</td>
                    <td>{c.hurt}</td>
                    <td>{c.deaths}</td>
                    <td>{c.towed}</td>
                    <td>{c.hazmat ? 'Yes' : 'No'}</td>
                    <td className={dot === 'Yes' ? 'pt-need' : undefined}>{dot === 'Check' ? 'Check the tow' : dot}</td>
                    <td>{c.police || <span className="pt-fine">Not given</span>}</td>
                    <td>
                      <label className="pt-check pt-check-sm">
                        <input type="checkbox" checked={!!c.copies} onChange={() => actions.copiesFiled(r.id)} />
                        <span>{c.copies ? `Filed ${whenDay(c.copies)}` : 'Not yet'}</span>
                      </label>
                    </td>
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
                      {unitById(r.unit)?.label}
                      <small>
                        {x.place}, {x.state}
                      </small>
                    </td>
                    <td>{personById(r.by)?.name}</td>
                    <td>{x.result}</td>
                    <td className={late ? 'pt-need' : undefined}>{clean ? 'Nothing to fix' : `${whenDay(due)}${late ? ', late' : ''}`}</td>
                    <td>
                      {clean ? (
                        <span className="pt-fine">Not needed</span>
                      ) : (
                        <label className="pt-check pt-check-sm">
                          <input type="checkbox" checked={!!x.certified} onChange={() => actions.certify(r.id)} />
                          <span>{x.certified ? `Signed ${whenDay(x.certified)}` : 'Not yet'}</span>
                        </label>
                      )}
                    </td>
                    <td>{whenDay(keepUntil(r.at, 12))}</td>
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
];

export function People() {
  const s = usePortal();
  return (
    <Page title="Team list" back={{ to: '/portal/office', label: 'Office' }} wide>
      <p className="pt-lede">
        The portal is one link for the whole team, with no logins, so nobody can be locked out one by one. That’s why it holds nothing a driver could misuse:
        no lock codes, load values, customer addresses or pay. When someone leaves, change the lock codes and work through the checklist.
      </p>
      <ul className="pt-peoplecards">
        {PEOPLE.map((p) => {
          const done = LEAVING.filter((l) => s.leaving[p.id]?.[l.step]).length;
          const listed = isListed(s, p.id);
          return (
            <li key={p.id} className="pt-card">
              <div className="pt-person-hd">
                <span>
                  <b>{p.name}</b> {p.sample && <Sample />}
                  <small>
                    {p.title}
                    {p.phone ? ` · ${p.phone}` : ' · through the office'}
                  </small>
                </span>
              </div>
              {p.phone && (
                <label className="pt-check">
                  <input type="checkbox" checked={listed} onChange={(e) => actions.setListed(p.id, e.target.checked)} />
                  Show this number on the Team page (they agreed)
                </label>
              )}

              {p.role === 'driver' && (
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
                            <input type="checkbox" checked={!!at} onChange={() => actions.tick(p.id, l.step)} />
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

/* ---------- Sign-off record ---------- */

export function Signoffs() {
  const s = usePortal();
  const signers = PEOPLE.filter((p) => p.role !== 'owner');
  return (
    <Page title="Sign-off record" back={{ to: '/portal/office', label: 'Office' }} wide>
      <p className="pt-lede">Every signature keeps the name picked, the exact version and the time. Publish a change and everyone signs again.</p>
      <div className="pt-tablewrap" tabIndex={0} role="region" aria-label="Sign-offs by person and rule">
        <table className="pt-table">
          <thead>
            <tr>
              <th scope="col">Person</th>
              {RULES.map((r) => (
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
                {RULES.map((r) => {
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

      <h2 className="pt-h2">Change a rule</h2>
      <div className="pt-grid2">
        {RULES.map((r) => (
          <Publish key={r.id} rule={r.id} title={r.title} />
        ))}
      </div>
    </Page>
  );
}

function Publish({ rule, title }: { rule: string; title: string }) {
  const s = usePortal();
  const [note, setNote] = useState('');
  const history = s.versions.filter((v) => v.rule === rule).sort((a, b) => b.version - a.version);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    actions.publish(rule, note.trim());
    setNote('');
  };
  return (
    <form className="pt-card pt-form" onSubmit={submit}>
      <h3>{title}</h3>
      <label htmlFor={`pub-${rule}`}>What changed?</label>
      <input id={`pub-${rule}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Example: new fuel card rule" />
      <button className="pt-btn line" type="submit">
        Publish version {currentVersion(s, rule).version + 1}
      </button>
      <ul className="pt-history">
        {history.map((v) => (
          <li key={v.version}>
            <span className="mono">v{v.version}</span> {whenDay(v.at)} · {v.note}
          </li>
        ))}
      </ul>
    </form>
  );
}

/* ---------- Maintenance board ---------- */

const FILTERS = ['Not fixed', ...REPORT_STATUSES, 'All'] as const;

export function Maintenance() {
  const s = usePortal();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Not fixed');
  const list = s.reports.filter((r) => (filter === 'All' ? true : filter === 'Not fixed' ? r.status !== 'Fixed' : r.status === filter));
  return (
    <Page title="Maintenance board" back={{ to: '/portal/office', label: 'Office' }} wide>
      <ul className="pt-unitgrid">
        {UNITS.map((u) => {
          const st = unitStatus(s, u);
          return (
            <li key={u.id}>
              <Link to={`/portal/unit/${u.id}`}>
                <b>{u.label}</b>
                <small>
                  {u.kindLabel} · <Sample />
                </small>
                <span className={cls(st)}>{st}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="pt-h2">Problem reports</h2>
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
          {list.map((r) => (
            <li key={r.id} className={r.urgent && r.status === 'Open' ? 'pt-card urgent' : 'pt-card'}>
              <div className="pt-person-hd">
                <span>
                  <b>
                    {unitById(r.unit)?.label} · {r.kind}
                  </b>
                  {r.urgent && <span className="pt-urgent">Urgent</span>} {r.sample && <Sample />}
                  <small>
                    {personById(r.by)?.name} · {when(r.at)} · {r.photos} {r.photos === 1 ? 'photo' : 'photos'}
                  </small>
                </span>
                <span className={cls(r.status)}>{r.status}</span>
              </div>
              <p>{r.text}</p>
              <label className="pt-inline">
                Status
                <select value={r.status} onChange={(e) => actions.setStatus(r.id, e.target.value as ReportStatus)}>
                  {REPORT_STATUSES.map((st) => (
                    <option key={st}>{st}</option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
