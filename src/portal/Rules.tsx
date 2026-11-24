// The handbook with sign-off. Every rule has versions; the driver signed in on this phone signs
// the current one, and a change from the office means everyone signs again. The record keeps who
// signed which version and when. Signing in is once per phone with a texted code (shown on
// screen in the demo), so a signature comes from that driver's phone.
import { NeedSignIn, SignedInAs, useLocked } from './Driver';
import { actions, currentVersion, lastSignoff, toSign, useMeta, usePortal, when, whenDay } from './store';
import { Icon, Page, Sample } from './ui';

export function Rules() {
  const s = usePortal();
  const demo = useMeta().mode !== 'live';
  const locked = useLocked();
  const me = s.me ?? '';
  const left = me ? toSign(s, me).length : s.rules.length;
  if (locked)
    return (
      <Page title="Company rules">
        <NeedSignIn what="FX4’s handbook and sign it" />
      </Page>
    );
  return (
    <Page title="Company rules" kicker={demo ? <Sample>Sample handbook</Sample> : 'FX4 handbook'}>
      {!demo && s.rules.length === 0 && <p className="pt-fine">The handbook isn’t in the portal yet. The office adds it.</p>}
      <div className="pt-card pt-form pt-signas">
        <SignedInAs action="Signing" />
        {me && <p className="pt-fine">{left === 0 ? 'You’ve signed every rule. Thanks.' : left === 1 ? '1 rule needs your signature.' : `${left} rules need your signature.`}</p>}
      </div>
      <ul className="pt-rules">
        {s.rules.map((r) => {
          const cur = currentVersion(s, r.id);
          const mine = me ? lastSignoff(s, me, r.id) : undefined;
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
                <button className="pt-btn red block" type="button" disabled={!me} onClick={() => void actions.sign(me, r.id)}>
                  {me ? 'I’ve read this and I agree' : 'Sign in above to sign'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {demo && <p className="pt-fine">FX4’s real handbook replaces this sample. FX4’s lawyer should review the wording and the sign-off before launch.</p>}
    </Page>
  );
}
