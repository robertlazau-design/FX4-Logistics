// Motion effects from the Golden Boy kit (built for RobertLazau.com), tuned for FX4.
// Rules: only transform and opacity move (plus SVG stroke offsets), every effect has a
// reduced-motion fallback that shows the finished state, mouse-only effects need a real
// hover pointer, and nothing that's on screen when the page loads is ever hidden.
// Styles live in index.css under "Motion".
import { useEffect, type RefObject } from 'react';

const matches = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;
export const reducedMotion = () => matches('(prefers-reduced-motion: reduce)');
const finePointer = () => matches('(hover: hover) and (pointer: fine)');

// Set a tick after the prerendered page comes to life. Before that, anything on screen
// has already been seen, so it must not be hidden again.
let pageReady = false;

// Page-wide: magnetic buttons (.magnetic lean toward the cursor) and the card light
// on the trailer cards (.rig gets --gx/--gy; the light itself is CSS).
export function usePageEffects() {
  useEffect(() => {
    const t = window.setTimeout(() => (pageReady = true));
    if (!finePointer() || reducedMotion()) return () => clearTimeout(t);
    let last: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const m = (target?.closest?.('.magnetic') as HTMLElement | null) ?? null;
      if (last && last !== m) last.style.translate = '';
      if (m) {
        const r = m.getBoundingClientRect();
        const x = Math.max(-9, Math.min(9, (e.clientX - (r.left + r.width / 2)) * 0.25));
        const y = Math.max(-7, Math.min(7, (e.clientY - (r.top + r.height / 2)) * 0.35));
        m.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      }
      last = m;
      const card = target?.closest?.('.rig') as HTMLElement | null;
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--gx', `${e.clientX - r.left}px`);
        card.style.setProperty('--gy', `${e.clientY - r.top}px`);
      }
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget && last) {
        last.style.translate = '';
        last = null;
      }
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerout', onOut);
    return () => {
      clearTimeout(t);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerout', onOut);
    };
  }, []);
}

// Plays an effect the first time an element scrolls into view: adds "armed" (the start
// state) and swaps it for "go" when it's in view. Used by the widescreen bars on the
// warehouse photo and the route map. Skipped for anything already on screen at load.
export function usePlayOnScroll<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { threshold = 0.35, prepare }: { threshold?: number; prepare?: (el: T) => void } = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || typeof IntersectionObserver === 'undefined') return;
    if (!pageReady && el.getBoundingClientRect().top <= window.innerHeight) return;
    prepare?.(el);
    el.classList.add('armed');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        // two frames so the start state is painted before it moves
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            el.classList.add('go');
            el.classList.remove('armed');
          }),
        );
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
}
