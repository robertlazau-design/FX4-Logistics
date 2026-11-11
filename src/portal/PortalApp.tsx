// FX4 team portal (DEMO). Lives under /portal, loads only when someone opens a portal link,
// and is never linked from the public site or indexed. Sample data, sign-in and saving are
// all simulated in this browser; see store.ts. The real version swaps store.ts for a
// database and a one-time-code sign-in.
import { lazy, Suspense, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { Roundel, Sprites } from '../components/Graphics';
import { PEOPLE, isAdmin, personById, type Person } from './data';
import { actions, toSign, unseenPosts, usePortal } from './store';
import { Icon, Page } from './ui';
import { AccessOff, Home, News, Report, SignIn, Team, UnitPage, Units } from './Driver';
import { GuideList, GuidePage } from './GuideScreens';
import { Rules } from './Rules';
import { AdminHome, Maintenance, People, Signoffs } from './Admin';
import './portal.css';

const Stickers = lazy(() => import('./Stickers'));

export default function PortalApp() {
  const s = usePortal();
  const me = personById(s.me ?? '');

  let body: ReactNode;
  if (!me) body = <SignIn />;
  else if (s.off[me.id]) body = <AccessOff />;
  else
    body = (
      <Routes>
        <Route path="/portal" element={<Home me={me} />} />
        <Route path="/portal/units" element={<Units />} />
        <Route path="/portal/unit/:id" element={<UnitPage />} />
        <Route path="/portal/guides" element={<GuideList />} />
        <Route path="/portal/guides/:slug" element={<GuidePage />} />
        <Route path="/portal/rules" element={<Rules me={me} />} />
        <Route path="/portal/report" element={<Report me={me} />} />
        <Route path="/portal/team" element={<Team />} />
        <Route path="/portal/news" element={<News me={me} />} />
        <Route path="/portal/admin" element={<AdminOnly me={me}><AdminHome /></AdminOnly>} />
        <Route path="/portal/admin/people" element={<AdminOnly me={me}><People /></AdminOnly>} />
        <Route path="/portal/admin/sign-offs" element={<AdminOnly me={me}><Signoffs /></AdminOnly>} />
        <Route path="/portal/admin/maintenance" element={<AdminOnly me={me}><Maintenance /></AdminOnly>} />
        <Route
          path="/portal/admin/stickers"
          element={
            <AdminOnly me={me}>
              <Suspense fallback={<p className="pt-page">Loading stickers…</p>}>
                <Stickers />
              </Suspense>
            </AdminOnly>
          }
        />
        <Route path="*" element={<Missing />} />
      </Routes>
    );

  const sign = me ? toSign(s, me.id).length : 0;
  const news = me ? unseenPosts(s, me.id).length : 0;

  return (
    <div className="pt">
      <Sprites />
      <a className="pt-skip" href="#pt-main">
        Skip to content
      </a>
      <DemoBar me={me} />
      <header className="pt-head">
        <div className="pt-bar">
          <Link className="pt-brand" to="/portal" aria-label="FX4 team portal home">
            <Roundel />
            <span>
              <b>FX4 Team</b>
              <small>Logistics · Wood Village</small>
            </span>
          </Link>
          {me && !s.off[me.id] && (
            <span className="pt-me">
              {me.name}
              <small>{me.title}</small>
            </span>
          )}
        </div>
        {me && !s.off[me.id] && (
          <nav className="pt-tabs" aria-label="Portal">
            <Tab to="/portal" end icon="home" label="Home" />
            <Tab to="/portal/guides" icon="book" label="Guides" />
            <Tab to="/portal/rules" icon="shield" label="Rules" badge={sign} />
            <Tab to="/portal/team" icon="users" label="Team" badge={news} badgeLabel="new announcement" />
            {isAdmin(me) && <Tab to="/portal/admin" icon="board" label="Office" />}
          </nav>
        )}
      </header>
      <main id="pt-main" className="pt-main">
        {body}
      </main>
    </div>
  );
}

function Tab({ to, icon, label, badge = 0, badgeLabel = 'to sign', end }: { to: string; icon: Parameters<typeof Icon>[0]['name']; label: string; badge?: number; badgeLabel?: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'pt-on' : undefined)}>
      <Icon name={icon} size={22} />
      <span>{label}</span>
      {badge > 0 && (
        <b className="pt-badge">
          {badge}
          <span className="sr"> {badgeLabel}</span>
        </b>
      )}
    </NavLink>
  );
}

// The yellow strip that makes the demo obvious: sample data, switch who you're signed in as,
// and start over.
function DemoBar({ me }: { me?: Person }) {
  return (
    <aside className="pt-demo" aria-label="Demo controls">
      <div className="pt-demo-in">
        <span>
          <b>Demo</b> with sample data. Nothing leaves this browser.
        </span>
        <span className="pt-demo-tools">
          <label htmlFor="pt-as">View as</label>
          <select id="pt-as" value={me?.id ?? ''} onChange={(e) => (e.target.value ? actions.signIn(e.target.value) : actions.signOut())}>
            <option value="">Signed out</option>
            {PEOPLE.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.title}
                {p.sample ? ', sample' : ''})
              </option>
            ))}
          </select>
          <button type="button" onClick={actions.reset}>
            Reset demo
          </button>
        </span>
      </div>
    </aside>
  );
}

function AdminOnly({ me, children }: { me: Person; children: ReactNode }) {
  if (isAdmin(me)) return <>{children}</>;
  return (
    <Page title="Office only">
      <p>This part is for Daniel and David. Switch to one of them in the demo bar to see it.</p>
    </Page>
  );
}

function Missing() {
  return (
    <Page title="Page not found">
      <p>That page isn’t in the portal.</p>
      <Link className="pt-btn" to="/portal">
        Back to home
      </Link>
    </Page>
  );
}
