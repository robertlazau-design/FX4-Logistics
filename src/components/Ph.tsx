// A detail still to confirm with Daniel. In draft mode it shows in yellow.
// The build stops if DRAFT is false and any <Ph> is still on a page.
import type { ReactNode } from 'react';
import { DRAFT } from '../data/business';

export const usedPlaceholders = new Set<string>();

export function Ph({ q, children }: { q: string; children: ReactNode }) {
  usedPlaceholders.add(q);
  if (!DRAFT) return <>{children}</>;
  return (
    <span className="ph" data-q={q}>
      {children}
    </span>
  );
}
