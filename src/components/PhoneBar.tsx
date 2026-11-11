import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BUSINESS } from '../data/business';

// Phones and tablets: Call / Get a quote along the bottom. On the Contact page it steps aside
// while the quote form is on screen.
export default function PhoneBar() {
  const ref = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    const bar = ref.current;
    bar?.classList.remove('away');
    const contact = document.getElementById('contact');
    if (!contact || !bar || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => bar.classList.toggle('away', e.isIntersecting), { rootMargin: '0px 0px -30% 0px' });
    io.observe(contact);
    return () => io.disconnect();
  }, [pathname]);
  return (
    <nav className="mbar" ref={ref} aria-label="Call or get a quote">
      <a className="btn btn-line" href={BUSINESS.phoneHref}>
        Call now
      </a>
      <Link className="btn btn-red" to="/contact">
        Get a quote
      </Link>
    </nav>
  );
}
