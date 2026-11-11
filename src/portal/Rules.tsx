// The handbook with sign-off. Every rule has versions; a driver signs the current one, and a
// change from the office means everyone signs again. The record keeps who signed which
// version and when, even after someone leaves.
import { RULES, type Person } from './data';
import { actions, currentVersion, lastSignoff, toSign, usePortal, when, whenDay } from './store';
import { Icon, Page, Sample } from './ui';

export function Rules({ me }: { me: Person }) {
  const s = usePortal();
  const left = toSign(s, me.id).length;
  return (
    <Page title="Company rules" kicker={<Sample>Sample handbook</Sample>}>
      <p className="pt-lede">
        {left === 0 ? 'You’ve signed every rule. Thanks.' : left === 1 ? '1 rule needs your signature.' : `${left} rules need your signature.`}
      </p>
      <ul className="pt-rules">
        {RULES.map((r) => {
          const cur = currentVersion(s, r.id);
          const mine = lastSignoff(s, me.id, r.id);
          const ok = (mine?.version ?? 0) >= cur.version;
          return (
            <li key={r.id} className={ok ? 'pt-card' : 'pt-card pt-need'}>
              <div className="pt-rule-hd">
                <h2>{r.title}</h2>
                <span className="mono">
                  v{cur.version} · {whenDay(cur.at)}
                </span>
              </div>
              {cur.version > 1 && (
                <p className="pt-note">
                  <b>What changed:</b> {cur.note}
                </p>
              )}
              <ul>
                {r.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {ok ? (
                <p className="pt-signed">
                  <Icon name="check" size={20} /> You signed version {mine!.version} on {when(mine!.at)}.
                </p>
              ) : (
                <button className="pt-btn red block" type="button" onClick={() => actions.sign(me.id, r.id)}>
                  I’ve read this and I agree
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="pt-fine">FX4’s real handbook replaces this sample. FX4’s lawyer should review the wording and the sign-off before launch.</p>
    </Page>
  );
}
