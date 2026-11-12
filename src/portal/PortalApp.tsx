// FX4 team portal (DEMO). One blanket portal for the whole team: no accounts and no logins;
// anyone with the link or a sticker scan gets in. It lives under /portal, loads only when
// someone opens a portal link, and is never linked from the public site or indexed.
// The office side is at /portal/office, an address only Daniel and David are given.
// Sample data and saving are simulated in this browser; see store.ts.
import { lazy, Suspense } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { Roundel, Sprites } from '../components/Graphics';
import { personById } from './data';
import { actions, toSign, unseenPosts, usePortal } from './store';
import { Icon, Page } from './ui';
import { Home, News, Report, Team, UnitPage, Units, WhoAmI } from './Driver';
import { GuideList, GuidePage } from './GuideScreens';
import { Rules } from './Rules';
import { AdminHome, Maintenance, People, Questions, Signoffs } from './Admin';
import StartHere from './Start';
import './portal.css';

const Stickers = lazy(() => import('./Stickers'));

export default function PortalApp() {
  const s = usePortal();
  const me = personById(s.me ?? '');
  const sign = me ? toSign(s, me.id).length : 0;
  const news = unseenPosts(s).length;

  return (
    <div className="pt">
      <Sprites />
      <a className="pt-skip" href="#pt-main">
        Skip to content
      </a>
      <DemoBar />
      <header className="pt-head">
        <div className="pt-bar">
          <Link className="pt-brand" to="/portal" aria-label="FX4 team portal home">
            <Roundel />
            <span>
              <b>FX4 Team</b>
              <small>Logistics · Wood Village</small>
            </span>
          </Link>
          <Link className="pt-me" to="/portal/me">
            {me ? (
              <>
                {me.name}
                <small>Not you? Change</small>
              </>
            ) : (
              <>
                Pick your name
                <small>Tap here</small>
              </>
            )}
          </Link>
        </div>
        <nav className="pt-tabs" aria-label="Portal">
          <Tab to="/portal" end icon="home" label="Home" />
          <Tab to="/portal/guides" icon="book" label="Guides" />
          <Tab to="/portal/rules" icon="shield" label="Rules" badge={sign} />
          <Tab to="/portal/team" icon="users" label="Team" badge={news} badgeLabel="new announcement" />
        </nav>
      </header>
      <main id="pt-main" className="pt-main">
        <Routes>
          <Route path="/portal" element={<Home />} />
          <Route path="/portal/me" element={<WhoAmI />} />
          <Route path="/portal/start" element={<StartHere />} />
          <Route path="/portal/units" element={<Units />} />
          <Route path="/portal/unit/:id" element={<UnitPage />} />
          <Route path="/portal/guides" element={<GuideList />} />
          <Route path="/portal/guides/:slug" element={<GuidePage />} />
          <Route path="/portal/rules" element={<Rules />} />
          <Route path="/portal/report" element={<Report />} />
          <Route path="/portal/team" element={<Team />} />
          <Route path="/portal/news" element={<News />} />
          <Route path="/portal/office" element={<AdminHome />} />
          <Route path="/portal/office/team" element={<People />} />
          <Route path="/portal/office/sign-offs" element={<Signoffs />} />
          <Route path="/portal/office/maintenance" element={<Maintenance />} />
          <Route path="/portal/office/questions" element={<Questions />} />
          <Route
            path="/portal/office/stickers"
            element={
              <Suspense fallback={<p className="pt-page">Loading stickers…</p>}>
                <Stickers />
              </Suspense>
            }
          />
          <Route path="*" element={<Missing />} />
        </Routes>
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

// The yellow strip that makes the demo obvious: sample data, a way into the office side for
// the walkthrough, and start over.
function DemoBar() {
  return (
    <aside className="pt-demo" aria-label="Demo controls">
      <div className="pt-demo-in">
        <span>
          <b>Demo</b> with sample data. Nothing leaves this browser.
        </span>
        <span className="pt-demo-tools">
          <Link to="/portal/office">Office side</Link>
          <button type="button" onClick={actions.reset}>
            Reset demo
          </button>
        </span>
      </div>
    </aside>
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
