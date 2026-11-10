import { useEffect, useRef } from 'react';
import { BUSINESS } from '../data/business';

// Phones and tablets: Call / Get a quote along the bottom. It steps aside while the quote
// form is on screen.
export default function PhoneBar({ base }: { base: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const contact = document.getElementById('contact');
    const bar = ref.current;
    if (!contact || !bar || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => bar.classList.toggle('away', e.isIntersecting), { rootMargin: '0px 0px -30% 0px' });
    io.observe(contact);
    return () => io.disconnect();
  }, [base]);
  return (
    <nav className="mbar" ref={ref} aria-label="Call or get a quote">
      <a className="btn btn-line" href={BUSINESS.phoneHref}>
        Call now
      </a>
      <a className="btn btn-red" href={`${base}#contact`}>
        Get a quote
      </a>
    </nav>
  );
}
