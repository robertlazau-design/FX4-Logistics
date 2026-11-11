// Robert's follow-up questions for Daniel. His answers from the first call (Wed, Nov 11, 2026) are in
// business.ts; what's left is here. Each id matches a <Ph q="...">
// placeholder on the site, so the yellow spots carry the same number as the agenda.
// Only shown in draft mode (DRAFT in business.ts).
// path: the page the agenda's "show" link opens to find that spot.
// page: false = nothing on the site to point at (site setup questions).
export type AgendaItem = { id: string; topic: string; q: string; path?: string; page?: false };

export const AGENDA: AgendaItem[] = [
  { topic: 'Contact & phone', id: 'days', path: '/contact', q: 'Which days are the office (8 am – 5 pm) and the warehouse (6 am – 10 pm) open? The draft guesses Mon–Fri for the office.' },
  { topic: 'Contact & phone', id: 'email', path: '/contact', q: 'fx4logistics.com belongs to someone else, so dispatch@fx4logistics.com can’t be used. Which email should quote requests go to for now?' },
  { topic: 'Trucking', id: 'nv', path: '/service-area', q: 'Reno is one of your main lanes: add Nevada to the states you run?' },
  { topic: 'Proof', id: 'quote', path: '/about', q: 'A shipper or broker who would give a one-line quote, with permission?' },
  { topic: 'Site setup', id: 'domain', q: 'Which web address do you want? fx4logistics.com is taken; fx4logistics.net, fx4logisticsinc.com and fx4trucking.com were open on Nov 11.', page: false },
  { topic: 'Site setup', id: 'logo', q: 'Please send the logo file (SVG, PDF or a large PNG).', page: false },
  { topic: 'Site setup', id: 'gbp', q: 'No Google Business Profile yet: set one up for 23605 NE Halsey St under your Google account, with robertlazau@gmail.com as a manager?', page: false },
];

export const agendaNumber = (id: string) => AGENDA.findIndex((a) => a.id === id) + 1;
