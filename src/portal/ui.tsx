// Small building blocks shared by the portal screens: icons, the page frame (title, focus,
// back link), call buttons, photo slots and the sample / to-fill-in tags.
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { OFFICE } from './data';

const PATHS = {
  alert: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></>,
  wrench: <path d="M14.5 6.5a4 4 0 0 0-5.3 5.2L3.5 17.4V20.5h3.1l5.7-5.7a4 4 0 0 0 5.2-5.3l-2.4 2.4-2.6-.6-.6-2.6Z" />,
  clipboard: <><path d="M9 4h6v3H9z" /><path d="M9 5.5H6.5a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V6.5a1 1 0 0 0-1-1H15" /><path d="M9 12h6M9 16h4" /></>,
  lock: <><rect x="5.5" y="10.5" width="13" height="10" rx="1.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></>,
  unlink: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /><path d="M3 3l18 18" /></>,
  arrows: <path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" />,
  strap: <><path d="M3 19h18" /><path d="M6 19v-8h12v8" /><path d="M9 11V7M15 11V7M7.5 7h9" /></>,
  snow: <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5" />,
  map: <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></>,
  file: <><path d="M14 3H6v18h12V7Z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></>,
  truck: <><path d="M2 6h11v10H2zM13 9.5h4l3.5 3.5v3H13z" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  book: <><path d="M4.5 5A2 2 0 0 1 6.5 3h13v15h-13a2 2 0 0 0-2 2Z" /><path d="M4.5 20a2 2 0 0 0 2 1.5h13V18" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2A5 5 0 0 1 21.5 19" /></>,
  home: <><path d="M3 11 12 4l9 7" /><path d="M5.5 9.5V20h13V9.5" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20.5 20.5-4.8-4.8" /></>,
  camera: <><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  check: <path d="M5 12.5 10 17.5 20 7" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  qr: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 19h1.5M19 14v1.5" />,
  news: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12.5h5" /></>,
  board: <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10.5h7V20h-7zM4 13.5h7V20H4z" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  back: <path d="m15 6-6 6 6 6" />,
  power: <><path d="M12 3v8" /><path d="M6.3 6.8a8 8 0 1 0 11.4 0" /></>,
  out: <><path d="M15 4h4v16h-4" /><path d="m10 8-4 4 4 4M6 12h10" /></>,
  checklist: <><path d="m4 6 1.5 1.5L8 5M4 12l1.5 1.5L8 11M4 18l1.5 1.5L8 17" /><path d="M11 6h9M11 12h9M11 18h9" /></>,
  fuel: <><path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M3 21h12M7 8h4" /><path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8.5l-3-3" /></>,
  receipt: <><path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  dock: <><path d="M3 9l9-5 9 5v11H3Z" /><path d="M7 20v-7h10v7M7 16.5h10" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h12l-2.5 4L17 12H5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></>,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg className="pt-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

// One screen: sets the tab title and, after a move between screens, puts focus on the heading
// so screen readers announce the new screen.
export function Page({ title, back, wide, children, kicker }: { title: string; back?: { to: string; label: string }; wide?: boolean; kicker?: ReactNode; children: ReactNode }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = `${title} · FX4 Team Portal`;
    h1.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [title]);
  return (
    <div className={wide ? 'pt-page wide' : 'pt-page'}>
      {back && (
        <Link className="pt-back" to={back.to}>
          <Icon name="back" size={20} />
          {back.label}
        </Link>
      )}
      {kicker && <p className="pt-kicker">{kicker}</p>}
      <h1 ref={h1} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </div>
  );
}

export function CallDavid({ label = `Call ${OFFICE.dispatcher} in dispatch`, block }: { label?: string; block?: boolean }) {
  return (
    <a className={block ? 'pt-call block' : 'pt-call'} href={OFFICE.dispatchTel}>
      <Icon name="phone" size={22} />
      <span>
        {label}
        <small>{OFFICE.dispatchPhone}</small>
      </span>
    </a>
  );
}

export function PhotoSlot({ caption }: { caption: string }) {
  return (
    <div className="pt-photo" role="img" aria-label={`Photo to come: ${caption}`}>
      <Icon name="camera" size={22} />
      <span>{caption}</span>
    </div>
  );
}

export const Sample = ({ children = 'Sample' }: { children?: ReactNode }) => <span className="pt-sample">{children}</span>;
export const Tbd = ({ children = 'To fill in' }: { children?: ReactNode }) => <span className="pt-tbd">{children}</span>;
