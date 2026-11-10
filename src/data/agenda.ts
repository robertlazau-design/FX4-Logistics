// Robert's questions for Daniel (first call: Wed, Nov 11, 2026). Each id matches a <Ph q="...">
// placeholder on the page, so the yellow spots carry the same number as the agenda.
// Only shown in draft mode (DRAFT in business.ts).
// page: false = nothing on the page to point at (site setup questions).
export type AgendaItem = { id: string; topic: string; q: string; page?: false };

export const AGENDA: AgendaItem[] = [
  { topic: 'Contact & phone', id: 'hours', q: 'Office hours (top bar and contact box)?' },
  { topic: 'Contact & phone', id: 'answers', q: 'Who answers calls for pickups and updates: you or a dispatcher? Name to show?' },
  { topic: 'Contact & phone', id: 'email', q: 'Which email should quote requests go to? (dispatch@fx4logistics.com is a guess)' },
  { topic: 'Contact & phone', id: 'reply', q: 'How fast can you reply to a quote request? (The draft says the same business day.)' },
  { topic: 'About FX4', id: 'name', q: 'Your last name and title for the welcome note?' },
  { topic: 'About FX4', id: 'bridgetown', q: 'OK to mention Bridgetown Industries repairing your trucks in-house?' },
  { topic: 'Trucking', id: 'fleet', q: 'How many trucks and trailers? (FMCSA shows 8 trucks and 10 drivers.)' },
  { topic: 'Trucking', id: 'hopper', q: 'Do you run hopper trailers and farm loads?' },
  { topic: 'Trucking', id: 'cargo', q: 'Cargo insurance amount?' },
  { topic: 'Trucking', id: 'states', q: 'Are these the 7 states you run: OR, WA, CA, ID, MT, UT, WY?' },
  { topic: 'Trucking', id: 'lanes', q: 'Your top 2–3 regular lanes?' },
  { topic: 'Warehouse', id: 'wh-city', q: 'Where is the new warehouse? (street and city)' },
  { topic: 'Warehouse', id: 'wh-size', q: 'Size in square feet?' },
  { topic: 'Warehouse', id: 'wh-doors', q: 'How many dock-high and drive-in doors?' },
  { topic: 'Warehouse', id: 'wh-storage', q: 'Racked, floor storage, or both?' },
  { topic: 'Warehouse', id: 'wh-xdock', q: 'Do you cross-dock?' },
  { topic: 'Warehouse', id: 'wh-security', q: 'Security: cameras, fenced yard, alarm?' },
  { topic: 'Warehouse', id: 'wh-hours', q: 'Warehouse hours?' },
  { topic: 'Proof & hiring', id: 'quote', q: 'A shipper or broker who would give a one-line quote, with permission?' },
  { topic: 'Proof & hiring', id: 'pay', q: 'Driver pay to show (per mile, per week or a range)?' },
  { topic: 'Proof & hiring', id: 'home', q: 'Driver home time?' },
  { topic: 'Site setup', id: 'domain', q: 'Do you own a web address already? Which one?', page: false },
  { topic: 'Site setup', id: 'logo', q: 'Do you have a logo file (SVG, PDF or a large PNG)?', page: false },
  { topic: 'Site setup', id: 'gbp', q: 'Is there a Google Business Profile for FX4? If yes, add robertlazau@gmail.com as a manager.', page: false },
  { topic: 'Site setup', id: 'shoot', q: 'Photo and video shoot add-on ($2,800): interested? A day that works for trucks, yard and warehouse?', page: false },
];

export const agendaNumber = (id: string) => AGENDA.findIndex((a) => a.id === id) + 1;
