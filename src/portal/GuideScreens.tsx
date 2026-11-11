// The guide list and one guide: numbered steps, each with a photo slot and a line of context,
// plus the tiedown calculator on "Secure the load".
import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GUIDES, guideBySlug, minTiedowns, type Guide } from './guides';
import { actions, usePortal, viewer } from './store';
import { CallDavid, Icon, Page, PhotoSlot, Tbd } from './ui';

const GROUPS: Guide['group'][] = ['Right now', 'Equipment', 'On the road', 'Paperwork'];

export function GuideList() {
  return (
    <Page title="Guides" kicker="Step by step">
      {GROUPS.map((group) => (
        <section key={group} aria-labelledby={`g-${group}`}>
          <h2 className="pt-h2" id={`g-${group}`}>
            {group}
          </h2>
          <ul className="pt-list">
            {GUIDES.filter((g) => g.group === group).map((g) => (
              <li key={g.slug}>
                <Link to={`/portal/guides/${g.slug}`} className={g.urgent ? 'urgent' : undefined}>
                  <Icon name={g.icon} />
                  <span>
                    <b>{g.title}</b>
                    <small>{g.summary}</small>
                  </span>
                  <Icon name="chevron" size={20} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="pt-fine">Photos for each step get taken on FX4’s own trucks. Videos can go in the same spots later.</p>
    </Page>
  );
}

export function GuidePage() {
  const { slug } = useParams();
  const g = guideBySlug(slug);
  const s = usePortal();
  const mine = g ? s.feedback.find((f) => f.guide === g.slug && f.by === viewer(s)) : undefined;
  if (!g)
    return (
      <Page title="Guide not found" back={{ to: '/portal/guides', label: 'Guides' }}>
        <p>That guide isn’t here. Try the guide list, or call David.</p>
        <CallDavid block />
      </Page>
    );
  return (
    <Page title={g.title} back={{ to: '/portal/guides', label: 'Guides' }} kicker={g.group}>
      <p className="pt-lede">{g.summary}</p>
      {g.urgent && <CallDavid block />}
      {g.intro && <p>{g.intro}</p>}
      {g.calculator && <Calculator />}
      <ol className="pt-steps">
        {g.steps.map((st, i) => (
          <li key={st.title} className="pt-step">
            <PhotoSlot caption={st.photo} />
            <div className="pt-step-body">
              <span className="pt-step-n" aria-hidden="true">
                Step {i + 1}
              </span>
              <h2>{st.title}</h2>
              <p>{st.text}</p>
              {st.note && (
                <p className="pt-note">
                  <b>{st.note.label}:</b> {st.note.text}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {g.after && <p>{g.after}</p>}
      {g.links && (
        <ul className="pt-links">
          {g.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label} <span className="sr">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {g.fx4 && (
        <p className="pt-fx4">
          <Tbd>From Daniel</Tbd> {g.fx4}
        </p>
      )}
      <p className="pt-source">Based on: {g.source}</p>

      <div className="pt-card pt-stuck">
        <h2>Still stuck?</h2>
        <CallDavid block />
        <div className="pt-helped" aria-live="polite">
          {!mine ? (
            <>
              <span>Did this guide help?</span>
              <button type="button" onClick={() => actions.feedback(g.slug, true)}>
                Yes
              </button>
              <button type="button" onClick={() => actions.feedback(g.slug, false)}>
                Not really
              </button>
            </>
          ) : (
            <span>{mine.helped ? 'Thanks. Good to know.' : 'Thanks. Daniel and David will see that this one needs work.'}</span>
          )}
        </div>
      </div>
    </Page>
  );
}

// 49 CFR 393.110 minimum tiedowns and 393.106(d) working load limit, for one article.
function Calculator() {
  const id = useId();
  const [len, setLen] = useState('');
  const [lb, setLb] = useState('');
  const [blocked, setBlocked] = useState(false);
  const L = parseFloat(len);
  const W = parseFloat(lb);
  const n = minTiedowns(L, W, blocked);
  return (
    <div className="pt-card pt-calc">
      <h2>Tiedown calculator</h2>
      <div className="pt-calc-in">
        <div>
          <label htmlFor={`${id}-l`}>Length (feet)</label>
          <input id={`${id}-l`} inputMode="decimal" value={len} onChange={(e) => setLen(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${id}-w`}>Weight (lb)</label>
          <input id={`${id}-w`} inputMode="decimal" value={lb} onChange={(e) => setLb(e.target.value)} />
        </div>
      </div>
      <label className="pt-check">
        <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} />
        Blocked from moving forward (headerboard, bulkhead or other cargo)
      </label>
      <div className="pt-calc-out" aria-live="polite">
        {n > 0 ? (
          <>
            <p className="pt-calc-big">
              At least <b>{n}</b> {n === 1 ? 'tiedown' : 'tiedowns'}
            </p>
            <p>
              Their working load limits must add up to at least <b>{Math.ceil(W / 2).toLocaleString('en-US')} lb</b> (half the weight).
            </p>
          </>
        ) : (
          <p>Enter the length and weight of one piece.</p>
        )}
      </div>
      <p className="pt-fine">Federal minimums. Logs, metal coils and heavy machinery have their own rules.</p>
    </div>
  );
}
