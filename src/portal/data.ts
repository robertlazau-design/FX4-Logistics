// The team portal's content. This is a DEMO: real FX4 facts come from src/data/business.ts
// (phone numbers, address, hours, USDOT/MC); everything marked `sample` is stand-in data for
// showing Daniel how the portal works. Never present sample people, units or rules as real.
// Lock codes never go in the portal, sample or real: drivers get them from Daniel or David by phone.
import { BUSINESS, WAREHOUSE } from '../data/business';
import type { Person, Rule, Unit, UnitKind } from './types';

export type { Person, Rule, Unit, UnitKind };

export const PEOPLE: Person[] = [
  { id: 'daniel', name: BUSINESS.owner, role: 'owner', title: BUSINESS.ownerTitle, listed: true },
  { id: 'david', name: BUSINESS.dispatcher, role: 'dispatch', title: 'Dispatch', phone: BUSINESS.dispatchDisplay, tel: BUSINESS.dispatchHref, listed: true },
  { id: 'd1', name: 'Driver 1', role: 'driver', title: 'Class A driver', phone: '(503) 555-0101', tel: 'tel:+15035550101', sample: true, listed: true },
  { id: 'd2', name: 'Driver 2', role: 'driver', title: 'Class A driver', phone: '(503) 555-0102', tel: 'tel:+15035550102', sample: true, listed: true },
  { id: 'd3', name: 'Driver 3', role: 'driver', title: 'Class A driver', phone: '(503) 555-0103', tel: 'tel:+15035550103', sample: true, listed: true },
  { id: 'd4', name: 'Driver 4', role: 'driver', title: 'Class A driver', phone: '(503) 555-0104', tel: 'tel:+15035550104', sample: true, listed: false },
];

// What a new unit starts with, by kind: its guides, the specs to fill in and the usual lock.
// The lock lines are the standard answer until Daniel confirms each trailer's lock.
export const UNIT_DEFAULTS: Record<UnitKind, { guides: string[]; specs: string[]; lock: { what: string; how: string }; short: string }> = {
  truck: { short: 'Truck', guides: ['pre-trip', 'hook-up', 'drop', 'fuel', 'inspection', 'eld', 'breakdown', 'chains'], specs: ['Make and year', 'Plate', 'ELD', 'Fuel card'], lock: { what: 'Truck keys', how: 'Ask David where the keys are.' } },
  flatbed: { short: 'Flatbed', guides: ['open-trailer', 'hook-up', 'secure', 'drop'], specs: ['Length', 'Axles', 'Empty weight', 'Plate'], lock: { what: 'Kingpin lock when parked', how: 'Call David for the code or key before you hook up.' } },
  stepdeck: { short: 'Step deck', guides: ['open-trailer', 'hook-up', 'secure', 'drop'], specs: ['Length', 'Axles', 'Empty weight', 'Plate'], lock: { what: 'Kingpin lock when parked', how: 'Call David for the code or key before you hook up.' } },
  dryvan: { short: 'Dry van', guides: ['open-trailer', 'tandems', 'hook-up', 'drop'], specs: ['Length', 'Axles', 'Empty weight', 'Plate'], lock: { what: 'Padlock on the rear doors', how: 'Call David for the code. Never write it down or pass it on.' } },
};

const TRAILER_SPECS = [{ k: 'Length' }, { k: 'Axles' }, { k: 'Empty weight' }, { k: 'Plate' }];
const TRUCK_SPECS = [{ k: 'Make and year' }, { k: 'Plate' }, { k: 'ELD' }, { k: 'Fuel card' }];

export const UNITS: Unit[] = [
  {
    id: '101', label: 'Truck 101', kind: 'truck', kindLabel: 'Tractor', sample: true,
    lock: { what: 'Truck keys', how: 'Ask David where the keys are.' },
    guides: ['pre-trip', 'hook-up', 'drop', 'fuel', 'inspection', 'eld', 'breakdown', 'chains'], specs: TRUCK_SPECS,
  },
  {
    id: '102', label: 'Truck 102', kind: 'truck', kindLabel: 'Tractor', sample: true,
    lock: { what: 'Truck keys', how: 'Ask David where the keys are.' },
    guides: ['pre-trip', 'hook-up', 'drop', 'fuel', 'inspection', 'eld', 'breakdown', 'chains'], specs: TRUCK_SPECS,
  },
  {
    id: '201', label: 'Flatbed 201', kind: 'flatbed', kindLabel: 'Flatbed', sample: true,
    lock: { what: 'Kingpin lock when parked', how: 'Call David for the code or key before you hook up.' },
    guides: ['open-trailer', 'hook-up', 'secure', 'drop'], specs: TRAILER_SPECS,
  },
  {
    id: '202', label: 'Step deck 202', kind: 'stepdeck', kindLabel: 'Step deck', sample: true,
    lock: { what: 'Kingpin lock when parked', how: 'Call David for the code or key before you hook up.' },
    guides: ['open-trailer', 'hook-up', 'secure', 'drop'], specs: TRAILER_SPECS,
  },
  {
    id: '203', label: 'Dry van 203', kind: 'dryvan', kindLabel: 'Dry van', sample: true,
    lock: { what: 'Padlock on the rear doors', how: 'Call David for the code. Never write it down or pass it on.' },
    guides: ['open-trailer', 'tandems', 'hook-up', 'drop'], specs: TRAILER_SPECS,
  },
];

// The handbook. Sample text only: Daniel's real handbook replaces it, and his lawyer should
// review the wording and the sign-off before launch.

export const RULES: Rule[] = [
  {
    id: 'codes',
    title: 'Lock codes and keys',
    points: [
      'Lock codes come from Daniel or David, by phone, every time.',
      'Never write a code down, text it or share it, even with another FX4 driver.',
      'Lost a key, or think a code got out? Call David right away.',
    ],
  },
  {
    id: 'crashes',
    title: 'Crashes and breakdowns',
    points: [
      'Call dispatch right away after any crash, even a small one.',
      'Hazard flashers on at once; triangles out within 10 minutes.',
      'Report it in the portal with photos the same day.',
    ],
  },
  {
    id: 'logs',
    title: 'Hours of service and logs',
    points: ['Run legal on your ELD.', 'Keep the ELD packet in the cab: data-transfer steps, malfunction steps and 8 days of blank paper logs.'],
  },
  {
    id: 'testing',
    title: 'Drug and alcohol testing',
    points: ['FX4 follows the federal DOT testing rules (49 CFR part 382).', 'Tests before hire, at random, after certain crashes, on reasonable suspicion, and before and after a return to duty. (Standard answer, Daniel to confirm.)'],
  },
  {
    id: 'equipment',
    title: 'Equipment care',
    points: ['Pre-trip and post-trip inspection every day you drive.', 'Report any problem in the portal before you roll, with photos.'],
  },
];

export const OFFICE = {
  name: BUSINESS.name,
  phone: BUSINESS.phoneDisplay,
  tel: BUSINESS.phoneHref,
  address: `${BUSINESS.street}, ${BUSINESS.city}, ${BUSINESS.region} ${BUSINESS.zip}`,
  officeHours: `${BUSINESS.days} ${BUSINESS.hours}`,
  warehouseHours: `${WAREHOUSE.days} ${WAREHOUSE.hours}`,
  usdot: BUSINESS.usdot,
  mc: BUSINESS.mc,
  dispatcher: BUSINESS.dispatcher,
  dispatchPhone: BUSINESS.dispatchDisplay,
  dispatchTel: BUSINESS.dispatchHref,
};
