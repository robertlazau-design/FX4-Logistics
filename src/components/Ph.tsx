// A detail still to confirm with Daniel. In draft mode it shows in yellow with its number
// from the call agenda. The build stops if DRAFT is false and any <Ph> is still on a page.
import type { ReactNode } from 'react';
import { DRAFT } from '../data/business';
import { agendaNumber } from '../data/agenda';

export const usedPlaceholders = new Set<string>();

export function Ph({ q, children }: { q: string; children: ReactNode }) {
  usedPlaceholders.add(q);
  if (!DRAFT) return <>{children}</>;
  const n = agendaNumber(q);
  return (
    <>
      <span className="ph" data-q={q}>
        {children}
      </span>
      {n > 0 && (
        <span className="qn" aria-hidden="true">
          {n}
        </span>
      )}
    </>
  );
}
