// Robert's follow-up questions for Daniel. His answers from the first call (Wed, Nov 11, 2026) and its follow-ups are in
// business.ts; what's left is here. Each id matches a <Ph q="...">
// placeholder on the site, so the yellow spots carry the same number as the agenda.
// Only shown in draft mode (DRAFT in business.ts).
// path: the page the agenda's "show" link opens to find that spot.
// page: false = nothing on the site to point at (site setup questions).
export type AgendaItem = { id: string; topic: string; q: string; path?: string; page?: false };

export const AGENDA: AgendaItem[] = [
  { topic: 'Proof', id: 'quote', path: '/about', q: 'A shipper or broker who would give a one-line quote, with permission?' },
];

export const agendaNumber = (id: string) => AGENDA.findIndex((a) => a.id === id) + 1;
