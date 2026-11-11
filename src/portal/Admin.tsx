// The office side, for Daniel and David: what needs attention, people and access (with the
// checklist for when a driver leaves), the sign-off record, and the maintenance board.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PEOPLE, RULES, UNITS, personById, unitById, type Unit } from './data';
import { guideBySlug } from './guides';
import {
  REPORT_STATUSES,
  actions,
  currentVersion,
  lastSignoff,
  toSign,
  usePortal,
  when,
  whenDay,
  type LeavingStep,
  type ReportStatus,
  type State,
} from './store';
import { Icon, Page, Sample } from './ui';

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
  const open = s.reports.filter((r) => r.status !== 'Fixed');
  const urgent = open.filter((r) => r.urgent && r.status === 'Open').length;
  const shop = UNITS.filter((u) => unitStatus(s, u) === 'In the shop').length;
  const waiting = drivers.filter((d) => !s.off[d.id] && toSign(s, d.id).length > 0);
  const off = Object.keys(s.off).length;
  const notHelpful = Object.entries(
    s.feedback.filter((f) => !f.helped).reduce<Record<string, number>>((a, f) => ({ ...a, [f.guide]: (a[f.guide] ?? 0) + 1 }), {}),
  );
  return (
    <Page title="Office" kicker="Daniel and David" wide>
      <div className="pt-stats">
        <Link to="/portal/admin/maintenance" className={urgent ? 'pt-stat red' : 'pt-stat'}>
          <b>{open.length}</b>
          <span>Open problems{urgent ? ` · ${urgent} urgent` : ''}</span>
        </Link>
        <Link to="/portal/admin/maintenance" className="pt-stat">
          <b>{shop}</b>
          <span>{shop === 1 ? 'Unit in the shop' : 'Units in the shop'}</span>
        </Link>
        <Link to="/portal/admin/sign-offs" className={waiting.length ? 'pt-stat red' : 'pt-stat'}>
          <b>{waiting.length}</b>
          <span>{waiting.length === 1 ? 'Driver hasn’t signed' : 'Drivers haven’t signed'}</span>
        </Link>
        <Link to="/portal/admin/people" className="pt-stat">
          <b>{off}</b>
          <span>Access turned off</span>
        </Link>
      </div>

      <div className="pt-adminlinks">
        <Link className="pt-tile" to="/portal/admin/people">
          <Icon name="users" size={28} />
          <b>People and access</b>
          <small>Turn someone off, and the checklist for when a driver leaves</small>
        </Link>
        <Link className="pt-tile" to="/portal/admin/sign-offs">
          <Icon name="shield" size={28} />
          <b>Sign-off record</b>
          <small>Who signed which version of each rule, and when</small>
        </Link>
        <Link className="pt-tile" to="/portal/admin/maintenance">
          <Icon name="board" size={28} />
          <b>Maintenance board</b>
          <small>Every problem report, with photos, time and who sent it</small>
        </Link>
        <Link className="pt-tile" to="/portal/admin/stickers">
          <Icon name="qr" size={28} />
          <b>QR stickers</b>
          <small>Print one for every trailer and truck</small>
        </Link>
        <Link className="pt-tile" to="/portal/news">
          <Icon name="news" size={28} />
          <b>Post an announcement</b>
          <small>Shows as new on every driver’s home screen</small>
        </Link>
      </div>

      {notHelpful.length > 0 && (
        <section className="pt-card">
          <h2>Guides drivers said didn’t help</h2>
          <ul className="pt-plain">
            {notHelpful.map(([slug, n]) => (
              <li key={slug}>
                <Link to={`/portal/guides/${slug}`}>{guideBySlug(slug)?.title}</Link> · {n} {n === 1 ? 'driver' : 'drivers'}
              </li>
            ))}
          </ul>
          <p className="pt-fine">These are the questions still reaching your phone. Fix the guide and the calls drop.</p>
        </section>
      )}
    </Page>
  );
}

/* ---------- People and access ---------- */

const LEAVING: { step: LeavingStep; label: string }[] = [
  { step: 'access', label: 'Portal access off' },
  { step: 'codes', label: 'Lock codes changed' },
  { step: 'keys', label: 'Keys back' },
  { step: 'fuel', label: 'Fuel card back' },
  { step: 'files', label: 'Driver file updated' },
];

export function People() {
  const s = usePortal();
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <Page title="People and access" back={{ to: '/portal/admin', label: 'Office' }} wide>
      <p className="pt-lede">Each person signs in with their own one-time code. Turning one person off doesn’t change anyone else’s access.</p>
      <ul className="pt-peoplecards">
        {PEOPLE.map((p) => {
          const offAt = s.off[p.id];
          const self = p.id === s.me;
          const done = LEAVING.filter((l) => (l.step === 'access' ? offAt : s.leaving[p.id]?.[l.step])).length;
          return (
            <li key={p.id} className="pt-card">
              <div className="pt-person-hd">
                <span>
                  <b>{p.name}</b> {p.sample && <Sample />}
                  <small>
                    {p.title}
                    {p.phone ? ` · ${p.phone}` : ''}
                    {p.listed ? '' : ' · not listed for the team'}
                  </small>
                </span>
                <span className={offAt ? 'pt-status s-off' : 'pt-status s-ok'}>{offAt ? 'Off' : 'Active'}</span>
              </div>
              {offAt && <p className="pt-fine">Turned off {when(offAt)}.</p>}

              {confirm === p.id ? (
                <div className="pt-confirm" role="group" aria-label={`Turn off ${p.name}`}>
                  <p>
                    Turn off {p.name}? Next time they open the portal they’ll see “Your access is off” and the office number.
                  </p>
                  <div className="pt-row2">
                    <button
                      className="pt-btn red"
                      type="button"
                      onClick={() => {
                        actions.setOff(p.id, true);
                        setConfirm(null);
                      }}
                    >
                      Turn off
                    </button>
                    <button className="pt-btn line" type="button" onClick={() => setConfirm(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : offAt ? (
                <button className="pt-btn line" type="button" onClick={() => actions.setOff(p.id, false)}>
                  Turn access back on
                </button>
              ) : (
                <button className="pt-btn line" type="button" disabled={self} onClick={() => setConfirm(p.id)}>
                  <Icon name="power" size={20} /> {self ? 'This is you' : 'Turn off access'}
                </button>
              )}

              {p.role === 'driver' && (
                <details className="pt-leaving">
                  <summary>
                    When a driver leaves · {done} of {LEAVING.length} done
                  </summary>
                  <ul>
                    {LEAVING.map((l) => {
                      const at = l.step === 'access' ? offAt : s.leaving[p.id]?.[l.step];
                      return (
                        <li key={l.step}>
                          <label className="pt-check">
                            <input
                              type="checkbox"
                              checked={!!at}
                              onChange={() => (l.step === 'access' ? actions.setOff(p.id, !offAt) : actions.tick(p.id, l.step))}
                            />
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
    <Page title="Sign-off record" back={{ to: '/portal/admin', label: 'Office' }} wide>
      <p className="pt-lede">Every signature keeps the exact version and time. Publish a change and everyone signs again.</p>
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
              <tr key={p.id} className={s.off[p.id] ? 'pt-off' : undefined}>
                <th scope="row">
                  {p.name}
                  {s.off[p.id] && <small>Access off</small>}
                </th>
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
    <Page title="Maintenance board" back={{ to: '/portal/admin', label: 'Office' }} wide>
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
