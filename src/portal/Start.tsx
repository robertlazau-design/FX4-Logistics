// "New here? Start here": a new driver's first week, in order. Only two steps can be ticked
// on this phone (name picked, rules signed); the rest are things to read or do. Anything only
// FX4 can answer shows as "From Daniel" and also appears on the office's questions list.
import { Link } from 'react-router-dom';
import { OFFICE } from './data';
import { guideBySlug } from './guides';
import { toSign, usePortal, type State } from './store';
import { CallDavid, Icon, Page, Tbd } from './ui';

export type StartStep = {
  id: string;
  title: string;
  text: string;
  to?: { href: string; label: string };
  guides?: string[];
  call?: boolean;
  daniel?: string;
  done?: (s: State) => boolean;
};

export const START_STEPS: StartStep[] = [
  {
    id: 'name',
    title: 'Pick your name',
    text: 'Once per phone. It goes on the rules you sign and the problems you report.',
    to: { href: '/portal/me', label: 'Pick your name' },
    done: (s) => !!s.me,
  },
  {
    id: 'rules',
    title: 'Read and sign the rules',
    text: 'FX4 keeps which version you signed and when.',
    to: { href: '/portal/rules', label: 'Go to the rules' },
    done: (s) => !!s.me && toSign(s, s.me).length === 0,
  },
  {
    id: 'phone',
    title: 'Pull over before you use the portal',
    text: 'Federal rules ban holding a phone or texting while you drive, and that includes sitting in traffic. Read guides before you roll or once you’re parked.',
  },
  {
    id: 'david',
    title: 'Save David’s number',
    text: 'Dispatch, for lock codes, loads and problems. Save it in your phone now.',
    call: true,
    daniel: 'Who to call when David doesn’t answer, and after hours.',
  },
  {
    id: 'first-load',
    title: 'Before your first load',
    text: 'You can’t drive for FX4 until the office has your negative pre-employment drug test result.',
    daniel: 'What to bring on day one, and who sets up your ELD login and fuel card.',
  },
  {
    id: 'yard',
    title: 'Find the yard',
    text: `${OFFICE.address}.`,
    daniel: 'Where trucks and trailers park, the gate, and getting in after hours.',
  },
  {
    id: 'units',
    title: 'Meet your truck and trailer',
    text: 'Scan the sticker on the landing-gear post or inside the driver’s door: the lock, the guides and the specs.',
    to: { href: '/portal/units', label: 'Scan my trailer' },
  },
  {
    id: 'everyday',
    title: 'Read the everyday guides',
    text: 'What you’ll do on every load.',
    guides: ['pre-trip', 'hours', 'paperwork', 'fuel', 'receipts', 'shipper'],
  },
  {
    id: 'wrong',
    title: 'Know what to do when it goes wrong',
    text: 'Read these once now, so the first time isn’t on the shoulder.',
    guides: ['accident', 'breakdown', 'inspection', 'eld'],
  },
  {
    id: 'pay',
    title: 'Pay and home time',
    text: 'How you get paid, and how to ask for time off.',
    daniel: 'When payday is, how pay is worked out, and how to ask for time off.',
  },
];

export default function StartHere() {
  const s = usePortal();
  return (
    <Page title="New here? Start here" kicker="Your first week at FX4" back={{ to: '/portal', label: 'Home' }}>
      <p className="pt-lede">What new FX4 drivers ask in their first week, in order. Can’t find something? Call David.</p>
      <ol className="pt-start">
        {START_STEPS.map((st, i) => {
          const done = st.done?.(s) ?? false;
          return (
            <li key={st.id} className={done ? 'pt-done-step' : undefined}>
              <span className="pt-start-n" aria-hidden="true">
                {done ? <Icon name="check" size={18} /> : i + 1}
              </span>
              <div className="pt-start-b">
                <h2>
                  {st.title}
                  {done && <span className="sr"> (done on this phone)</span>}
                </h2>
                <p>{st.text}</p>
                {st.daniel && (
                  <p className="pt-fx4">
                    <Tbd>From Daniel</Tbd> {st.daniel}
                  </p>
                )}
                {st.call && <CallDavid block />}
                {st.to && !done && (
                  <Link className="pt-btn line" to={st.to.href}>
                    {st.to.label}
                  </Link>
                )}
                {st.guides && (
                  <ul className="pt-list pt-list-tight">
                    {st.guides.map((slug) => {
                      const g = guideBySlug(slug)!;
                      return (
                        <li key={slug}>
                          <Link to={`/portal/guides/${slug}`} className={g.urgent ? 'urgent' : undefined}>
                            <Icon name={g.icon} />
                            <span>
                              <b>{g.title}</b>
                            </span>
                            <Icon name="chevron" size={20} />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="pt-source">Based on: drug test before the first load, 49 CFR 382.301. Phones while driving, 49 CFR 392.80 and 392.82.</p>
    </Page>
  );
}
