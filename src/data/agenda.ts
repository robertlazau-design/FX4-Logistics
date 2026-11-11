// Robert's questions for Daniel (first call: Wed, Nov 11, 2026). Each id matches a <Ph q="...">
// placeholder on the site, so the yellow spots carry the same number as the agenda.
// Only shown in draft mode (DRAFT in business.ts).
// path: the page the agenda's "show" link opens to find that spot.
// page: false = nothing on the site to point at (site setup questions).
export type AgendaItem = { id: string; topic: string; q: string; path?: string; page?: false };

export const AGENDA: AgendaItem[] = [
  { topic: 'Contact & phone', id: 'hours', path: '/contact', q: 'Office hours (top bar and contact box)?' },
  { topic: 'Contact & phone', id: 'answers', path: '/trucking', q: 'Who answers calls for pickups and updates: you or a dispatcher? Name to show?' },
  { topic: 'Contact & phone', id: 'email', path: '/contact', q: 'Which email should quote requests go to? (dispatch@fx4logistics.com is a guess)' },
  { topic: 'Contact & phone', id: 'reply', path: '/contact', q: 'How fast can you reply to a quote request? (The draft says the same business day.)' },
  { topic: 'About FX4', id: 'name', path: '/about', q: 'Your last name and title for the welcome note?' },
  { topic: 'About FX4', id: 'bridgetown', path: '/about', q: 'OK to mention Bridgetown Industries repairing your trucks in-house?' },
  { topic: 'Trucking', id: 'fleet', path: '/trucking', q: 'How many trucks and trailers? (FMCSA shows 8 trucks and 10 drivers.)' },
  { topic: 'Trucking', id: 'hopper', path: '/trucking', q: 'Do you run hopper trailers and farm loads?' },
  { topic: 'Trucking', id: 'cargo', path: '/trucking', q: 'Cargo insurance amount?' },
  { topic: 'Trucking', id: 'states', path: '/service-area', q: 'Are these the 7 states you run: OR, WA, CA, ID, MT, UT, WY?' },
  { topic: 'Trucking', id: 'lanes', path: '/service-area', q: 'Your top 2–3 regular lanes?' },
  { topic: 'Warehouse', id: 'wh-city', path: '/warehousing', q: 'Where is the new warehouse? (street and city)' },
  { topic: 'Warehouse', id: 'wh-size', path: '/warehousing', q: 'Size in square feet?' },
  { topic: 'Warehouse', id: 'wh-doors', path: '/warehousing', q: 'How many dock-high and drive-in doors?' },
  { topic: 'Warehouse', id: 'wh-storage', path: '/warehousing', q: 'Racked, floor storage, or both?' },
  { topic: 'Warehouse', id: 'wh-xdock', path: '/warehousing', q: 'Do you cross-dock?' },
  { topic: 'Warehouse', id: 'wh-security', path: '/warehousing', q: 'Security: cameras, fenced yard, alarm?' },
  { topic: 'Warehouse', id: 'wh-hours', path: '/warehousing', q: 'Warehouse hours?' },
  { topic: 'Proof & hiring', id: 'quote', path: '/about', q: 'A shipper or broker who would give a one-line quote, with permission?' },
  { topic: 'Proof & hiring', id: 'pay', path: '/driver-jobs', q: 'Driver pay to show (per mile, per week or a range)?' },
  { topic: 'Proof & hiring', id: 'home', path: '/driver-jobs', q: 'Driver home time?' },
  { topic: 'Site setup', id: 'domain', q: 'Do you own a web address already? Which one?', page: false },
  { topic: 'Site setup', id: 'logo', q: 'Do you have a logo file (SVG, PDF or a large PNG)?', page: false },
  { topic: 'Site setup', id: 'gbp', q: 'Is there a Google Business Profile for FX4? If yes, add robertlazau@gmail.com as a manager.', page: false },
  { topic: 'Site setup', id: 'shoot', q: 'Photo and video shoot add-on ($2,800): interested? A day that works for trucks, yard and warehouse?', page: false },
];

export const agendaNumber = (id: string) => AGENDA.findIndex((a) => a.id === id) + 1;
