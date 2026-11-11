// Robert's call agenda (draft mode only). Numbered questions for Daniel that match the yellow
// spots on the site. "show" jumps to the spot, opening its page first if needed. Answers are
// kept in this browser only (localStorage) and "Copy notes" copies everything as text.
// Not part of the live site.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AGENDA } from '../data/agenda';
import { reducedMotion } from '../effects';

// The first copy of a placeholder that's actually on screen (the top bar's copy is hidden on phones).
const findSpot = (id: string) => [...document.querySelectorAll<HTMLElement>(`.ph[data-q="${id}"]`)].find((el) => el.getClientRects().length > 0);

const pingSpot = (el: HTMLElement) => {
  el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  el.classList.remove('ping');
  void el.offsetWidth;
  el.classList.add('ping');
};

const KEY = 'fx4-call-notes-v2';

export default function CallAgenda({ open, onOpen, onClose }: { open: boolean; onOpen: (el: HTMLElement) => void; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState('');
  const [numbersOff, setNumbersOff] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Arrived from a "show" link on another page: point at the spot once the page is drawn.
  useEffect(() => {
    const id = (location.state as { ping?: string } | null)?.ping;
    if (!id) return;
    const t = window.setTimeout(() => {
      const el = findSpot(id);
      if (el) pingSpot(el);
    }, 60);
    return () => clearTimeout(t);
  }, [location.key]);

  useEffect(() => {
    try {
      setAnswers(JSON.parse(localStorage.getItem(KEY) || '{}') || {});
    } catch {
      /* private window or blocked storage: start empty */
    }
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => titleRef.current?.focus(), 50);
  }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && open && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useEffect(() => {
    document.body.classList.toggle('no-qn', numbersOff);
  }, [numbersOff]);

  const save = (next: Record<string, string>) => {
    setAnswers(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* not saved: keeps working for this visit */
    }
  };
  const done = AGENDA.filter((a) => (answers[a.id] || '').trim()).length;

  const show = (id: string, path?: string) => {
    if (window.innerWidth < 700) onClose();
    const here = findSpot(id);
    if (here) pingSpot(here);
    else if (path) navigate(path, { state: { ping: id } });
  };

  const copy = () => {
    const lines = ['FX4 Logistics call notes, Nov 11, 2026', ''];
    AGENDA.forEach((a, i) => {
      lines.push(`${i + 1}. ${a.q}`);
      lines.push(`   ${(answers[a.id] || '').trim() || '(no answer yet)'}`);
    });
    const text = lines.join('\n');
    const fallback = () => {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand('copy');
        setCopied('Copied');
      } catch {
        setCopied('Select and copy');
      }
      t.remove();
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => setCopied('Copied'), fallback);
    else fallback();
    setTimeout(() => setCopied(''), 2500);
  };

  const clear = () => {
    if (!clearArmed) {
      setClearArmed(true);
      setTimeout(() => setClearArmed(false), 3000);
      return;
    }
    save({});
    setClearArmed(false);
  };

  let topic = '';
  return (
    <>
      <button className="agenda-pill" type="button" aria-controls="agenda" aria-expanded={open} onClick={(e) => (open ? onClose() : onOpen(e.currentTarget))}>
        Call agenda <b>{done}/{AGENDA.length}</b>
      </button>
      <div className={`scrim${open ? ' on' : ''}`} onClick={onClose} />
      <aside className={`agenda${open ? ' open' : ''}`} id="agenda" aria-labelledby="agendaTitle" inert={!open}>
        <header>
          <h2 id="agendaTitle" tabIndex={-1} ref={titleRef}>
            Questions for Daniel
          </h2>
          <p>
            First call · Wed, Nov 11 · {done} of {AGENDA.length} answered
          </p>
          <div className="tools">
            <button type="button" onClick={copy}>Copy notes</button>
            <button type="button" onClick={() => setNumbersOff((v) => !v)}>{numbersOff ? 'Show numbers' : 'Hide numbers'}</button>
            <button type="button" onClick={clear}>{clearArmed ? 'Tap again to clear' : 'Clear answers'}</button>
            <span className="copied" role="status">{copied}</span>
          </div>
          <button className="x" type="button" onClick={onClose} aria-label="Close call agenda">
            ×
          </button>
        </header>
        <div className="list">
          {AGENDA.map((a, i) => {
            const heading = a.topic !== topic ? <h3>{(topic = a.topic)}</h3> : null;
            const value = answers[a.id] || '';
            return (
              <div key={a.id}>
                {heading}
                <div className={`item${value.trim() ? ' done' : ''}`}>
                  <span className="n">{i + 1}</span>
                  <label className="q" htmlFor={`ans-${a.id}`}>
                    {a.q}{' '}
                    {a.page !== false && (
                    <a
                      href={a.path}
                      data-show={a.id}
                      onClick={(e) => {
                        e.preventDefault();
                        show(a.id, a.path);
                      }}
                    >
                      show
                    </a>
                    )}
                  </label>
                  <input id={`ans-${a.id}`} placeholder="Answer" value={value} onChange={(e) => save({ ...answers, [a.id]: e.target.value })} />
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
