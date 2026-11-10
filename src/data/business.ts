// FX4 Logistics contact and carrier details. Change them here and every page picks them up.
// Sources: FMCSA (USDOT, MC, phone, authority, liability) and CarrierSource (safety numbers),
// checked Sept–Nov 2026. Re-check the safety numbers before launch.

// Draft mode: shows the draft banner, the yellow placeholders and Robert's call agenda,
// and keeps search engines out (noindex + robots.txt). Set to false only when every
// <Ph> is replaced with a real answer; the build stops if any are left.
export const DRAFT = true;

export const BUSINESS = {
  name: 'FX4 Logistics Inc.',
  shortName: 'FX4 Logistics',
  phoneDisplay: '(971) 380-0602',
  phoneHref: 'tel:+19713800602',
  street: '23605 NE Halsey St, Ste C',
  city: 'Wood Village',
  region: 'OR',
  zip: '97060',
  usdot: '3783174',
  mc: '1355029',
  authoritySince: '2022',
  liability: '$1,000,000',
  exit: 'I-84 exit 16',
  sister: 'Bridgetown Industries',
  fmcsaUrl:
    'https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=3783174',
};

// FMCSA data as reported by CarrierSource, September 2026 (24-month window).
export const SAFETY = {
  crashes: '0',
  driverOos: '0',
  inspections: '34',
  trucksOnRecord: '8',
  source: 'Federal FMCSA data as reported by CarrierSource, September 2026. Re-check before launch.',
};

export const STATES = [
  { name: 'Oregon', code: 'OR', home: true },
  { name: 'Washington', code: 'WA' },
  { name: 'California', code: 'CA' },
  { name: 'Idaho', code: 'ID' },
  { name: 'Montana', code: 'MT' },
  { name: 'Utah', code: 'UT' },
  { name: 'Wyoming', code: 'WY' },
];

export const LOCAL_TOWNS = ['Portland', 'Gresham', 'Troutdale', 'Fairview', 'Wood Village'];

export const HAULS = [
  'Lumber & logs',
  'Steel & metal coils',
  'Machinery',
  'Building materials',
  'Construction loads',
  'Grain, feed & hay',
  'Farm supplies',
  'Utility equipment',
  'General freight',
];

export const SERVICE_OPTIONS = [
  'Trucking (one load)',
  'Trucking (recurring lane)',
  'Warehousing / storage',
  'Trucking and storage',
  'Driver job',
] as const;

export const TRAILERS = ['Flatbed', 'Step deck', 'Dry van', 'Hopper', 'Not sure'] as const;
