// FX4 team portal. One portal for the whole team, no passwords: drivers sign in once per phone
// with a texted code, and the office side (/portal/office) signs in with Google. It lives under
// /portal, loads only when someone opens a portal link, and is never linked from the public
// site, indexed or counted in analytics. Until the server is switched on it runs as the
// in-browser demo with sample data; see store.ts.
import { lazy, Suspense, useEffect } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Sprites } from '../components/Graphics';
import { FX4Mark } from '../components/Logo';
import { actions, boot, personOf, toSign, unseenPosts, useMeta, usePortal, when } from './store';
import { Icon, Page } from './ui';
import { Home, News, Report, Team, UnitPage, Units, WhoAmI } from './Driver';
import { GuideList, GuidePage } from './GuideScreens';
import { Rules } from './Rules';
import { AdminHome, Maintenance, OfficeGate, People, Questions, Records, Signoffs, UnitsAdmin } from './Admin';
import StartHere from './Start';
import './portal.css';

const Stickers = lazy(() => import('./Stickers'));

// Keeps the portal (guides, the shell, David's number) on the phone so it opens with no signal.
// Only the portal registers it, and it only answers for /portal pages and the site's files.
function useOffline() {
  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/portal-sw.js', { scope: '/portal' }).catch(() => {
      /* fine: the portal still works online */
    });
  }, []);
}

export default function PortalApp() {
  const s = usePortal();
  const m = useMeta();
  useEffect(() => void boot(), []);
  useOffline();
  const me = personOf(s, s.me);
  const sign = me ? toSign(s, me.id).length : 0;
  const news = unseenPosts(s).length;
  const office = useLocation().pathname.startsWith('/portal/office');

  if (m.mode === 'loading')
    return (
      <div className="pt">
        <p className="pt-loading">Loading the FX4 team portal…</p>
      </div>
    );

  return (
    <div className="pt">
      <Sprites />
      <a className="pt-skip" href="#pt-main">
        Skip to content
      </a>
      {m.mode === 'demo' && <DemoBar missing={m.missing} />}
      <header className="pt-head">
        <div className="pt-bar">
          <Link className="pt-brand" to="/portal" aria-label="FX4 team portal home">
            <FX4Mark className="pt-brand-mark" />
            <span>
              <b>Team portal</b>
              <small>Logistics · Wood Village</small>
            </span>
          </Link>
          <Link className="pt-me" to="/portal/me">
            {m.session.kind === 'office' ? (
              <>
                Office
                <small>Signed in · Sign out</small>
              </>
            ) : me ? (
              <>
                {me.name}
                <small>Signed in · Change</small>
              </>
            ) : (
              <>
                Sign in
                <small>Once per phone</small>
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
      {m.offline && (
        <p className="pt-offline" role="status">
          No signal: showing what this phone saved{m.savedAt ? ` ${when(m.savedAt)}` : ''}. Reports and sign-offs need signal. Call David if it can’t wait.
        </p>
      )}
      {m.error && (
        <p className="pt-errbar" role="alert">
          <span>{m.error}</span>
          <button type="button" onClick={actions.clearError} aria-label="Dismiss">
            OK
          </button>
        </p>
      )}
      <main id="pt-main" className="pt-main">
        {!office && <PullOver />}
        {office ? (
          <OfficeGate>
            <Routes>
              <Route path="/portal/office" element={<AdminHome />} />
              <Route path="/portal/office/team" element={<People />} />
              <Route path="/portal/office/units" element={<UnitsAdmin />} />
              <Route path="/portal/office/sign-offs" element={<Signoffs />} />
              <Route path="/portal/office/maintenance" element={<Maintenance />} />
              <Route path="/portal/office/questions" element={<Questions />} />
              <Route path="/portal/office/records" element={<Records />} />
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
          </OfficeGate>
        ) : (
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
            <Route path="*" element={<Missing />} />
          </Routes>
        )}
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

// On every driver screen: federal rules bar hand-held phone use and texting while driving,
// even stopped in traffic (49 CFR 392.80, 392.82), and FX4 may not allow it.
function PullOver() {
  return (
    <p className="pt-safe">
      <Icon name="phone" size={16} /> Driving? Pull over before you use the portal.
    </p>
  );
}

// The yellow strip that makes the demo obvious: sample data, a way into the office side for
// the walkthrough, and start over. On a deploy that isn't switched on yet it also says what
// the server still needs (the names of settings, never their values).
function DemoBar({ missing }: { missing: string[] }) {
  return (
    <aside className="pt-demo" aria-label="Demo controls">
      <div className="pt-demo-in">
        <span>
          <b>Demo</b> with sample data. Nothing leaves this browser.
          {missing.length > 0 && <small className="pt-demo-need"> To switch on: {missing.join(', ')}.</small>}
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
