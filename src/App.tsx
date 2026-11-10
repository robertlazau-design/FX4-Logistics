import { useCallback, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { DRAFT } from './data/business';
import { Sprites } from './components/Graphics';
import Header from './components/Header';
import Footer from './components/Footer';
import PhoneBar from './components/PhoneBar';
import CallAgenda from './components/CallAgenda';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { usePageEffects } from './effects';

export default function App() {
  usePageEffects();
  const { pathname } = useLocation();
  const base = pathname === '/' ? '' : '/';
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

  return (
    <>
      <Sprites />
      <Header base={base} onAgenda={(el) => (agendaOpen ? closeAgenda() : openAgenda(el))} agendaOpen={agendaOpen} />
      <main id="top">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer base={base} />
      <PhoneBar base={base} />
      {DRAFT && <CallAgenda open={agendaOpen} onOpen={openAgenda} onClose={closeAgenda} />}
    </>
  );
}
