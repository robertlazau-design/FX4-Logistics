// The handbook with sign-off. Every rule has versions; a driver picks their name and signs the
// current one, and a change from the office means everyone signs again. The record keeps who
// signed which version and when. There are no logins, so the name is whatever was picked on
// that phone: a record of who said they read it, not proof of identity.
import { RULES } from './data';
import { NamePicker } from './Driver';
import { actions, currentVersion, lastSignoff, toSign, usePortal, when, whenDay } from './store';
import { Icon, Page, Sample } from './ui';

export function Rules() {
  const s = usePortal();
  const me = s.me ?? '';
  const left = me ? toSign(s, me).length : RULES.length;
  return (
    <Page title="Company rules" kicker={<Sample>Sample handbook</Sample>}>
      <div className="pt-card pt-form pt-signas">
        <NamePicker id="pt-signer" value={me} onChange={(v) => actions.setMe(v || null)} />
        <p className="pt-fine">{me ? (left === 0 ? 'You’ve signed every rule. Thanks.' : left === 1 ? '1 rule needs your signature.' : `${left} rules need your signature.`) : 'Pick your name to sign.'}</p>
      </div>
      <ul className="pt-rules">
        {RULES.map((r) => {
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
                <button className="pt-btn red block" type="button" disabled={!me} onClick={() => actions.sign(me, r.id)}>
                  {me ? 'I’ve read this and I agree' : 'Pick your name above to sign'}
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
