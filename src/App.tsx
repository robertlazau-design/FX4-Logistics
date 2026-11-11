import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { DRAFT } from './data/business';
import { NOT_FOUND_META, pageMeta } from './seo';
import { Sprites } from './components/Graphics';
import Header from './components/Header';
import Footer from './components/Footer';
import PhoneBar from './components/PhoneBar';
import CallAgenda from './components/CallAgenda';
import Home from './pages/Home';
import Trucking from './pages/Trucking';
import Warehousing from './pages/Warehousing';
import About from './pages/About';
import ServiceArea from './pages/ServiceArea';
import DriverJobs from './pages/DriverJobs';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { usePageEffects } from './effects';

export default function App() {
  usePageEffects();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstPage = useRef(true);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const openAgenda = useCallback((el: HTMLElement) => {
    opener.current = el;
    setAgendaOpen(true);
  }, []);
  const closeAgenda = useCallback(() => {
    setAgendaOpen(false);
    opener.current?.focus();
  }, []);

  // Moving between pages in the browser (no full reload): start at the top, update the tab
  // title and move focus to the new page so screen readers announce it. Runs before the
  // pages' own effects (the Contact page scrolls to its form after this).
  useLayoutEffect(() => {
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.title = (pageMeta(pathname) ?? NOT_FOUND_META).title;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <>
      <Sprites />
      <Header onAgenda={(el) => (agendaOpen ? closeAgenda() : openAgenda(el))} agendaOpen={agendaOpen} />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trucking" element={<Trucking />} />
          <Route path="/warehousing" element={<Warehousing />} />
          <Route path="/about" element={<About />} />
          <Route path="/service-area" element={<ServiceArea />} />
          <Route path="/driver-jobs" element={<DriverJobs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <PhoneBar />
      {DRAFT && <CallAgenda open={agendaOpen} onOpen={openAgenda} onClose={closeAgenda} />}
    </>
  );
}
