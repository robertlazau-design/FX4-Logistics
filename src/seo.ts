// Titles, descriptions and structured data for every page. scripts/prerender.mjs bakes them into
// each page's HTML at build time. In draft mode the pages get noindex and no canonical, because
// the web address isn't confirmed yet (agenda #22).
import { BUSINESS, DRAFT, STATES } from './data/business';
import { NAV } from './data/pages';

// TODO before launch: confirm the domain with Daniel.
export const SITE_URL = 'https://www.fx4logistics.com';

export type PageMeta = { title: string; description: string };

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'FX4 Logistics | Flatbed, Dry Van & Warehousing | Wood Village, OR',
    description:
      'Locally owned flatbed, step deck and dry van carrier with warehouse storage in Wood Village, Oregon, off I-84 exit 16. Call (971) 380-0602 for a quote.',
  },
  '/trucking': {
    title: 'Flatbed, Step Deck & Dry Van Trucking | FX4 Logistics',
    description:
      "Flatbed, step deck and dry van trucking on FX4's own trucks with our own drivers. A locally owned carrier in Wood Village, Oregon. Call (971) 380-0602.",
  },
  '/warehousing': {
    title: 'Warehousing & Storage | FX4 Logistics',
    description:
      "Short and long-term pallet storage, including imported freight after customs, with local delivery on FX4's own trucks. Call (971) 380-0602 to ask about space.",
  },
  '/about': {
    title: 'About FX4 Logistics | Locally Owned Carrier in Wood Village, OR',
    description:
      'FX4 Logistics is a locally owned carrier, not a broker, right off I-84 at exit 16 in Wood Village, Oregon, with its own interstate authority since 2022.',
  },
  '/service-area': {
    title: 'Service Area | FX4 Logistics, Wood Village, OR',
    description:
      'Trucking from Wood Village, Oregon across Oregon, Washington, California and the Mountain West, plus local service around the Portland metro.',
  },
  '/driver-jobs': {
    title: 'Class A CDL Driver Jobs | FX4 Logistics, Wood Village, OR',
    description:
      'FX4 Logistics is hiring Class A CDL drivers in Wood Village, Oregon. Our own equipment, kept up by our own shop. Apply online or call (971) 380-0602.',
  },
  '/contact': {
    title: 'Request a Quote | FX4 Logistics',
    description:
      'Request a trucking or storage quote from FX4 Logistics, 23605 NE Halsey St, Ste C, Wood Village, Oregon, off I-84 exit 16. Or call (971) 380-0602.',
  },
};

export const NOT_FOUND_META: PageMeta = {
  title: 'Page Not Found | FX4 Logistics',
  description: "We couldn't find that page. Head back to FX4 Logistics for trucking and warehousing in Wood Village, Oregon.",
};

export const ALL_PATHS = Object.keys(PAGE_META);

export const pageMeta = (path: string): PageMeta | undefined => PAGE_META[path];

export const canonicalUrl = (path: string) => `${SITE_URL}${path === '/' ? '/' : path}`;

export const pageJsonLd = (path: string) => {
  if (DRAFT) return [];
  if (path !== '/') {
    const label = NAV.find((n) => n.path === path)?.label;
    if (!label) return [];
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: label, item: canonicalUrl(path) },
        ],
      },
    ];
  }
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#business`,
      name: BUSINESS.name,
      url: `${SITE_URL}/`,
      telephone: '+1-971-380-0602',
      address: {
        '@type': 'PostalAddress',
        streetAddress: BUSINESS.street,
        addressLocality: BUSINESS.city,
        addressRegion: BUSINESS.region,
        postalCode: BUSINESS.zip,
        addressCountry: 'US',
      },
      areaServed: STATES.map((s) => s.name),
      identifier: [
        { '@type': 'PropertyValue', name: 'USDOT', value: BUSINESS.usdot },
        { '@type': 'PropertyValue', name: 'MC', value: BUSINESS.mc },
      ],
    },
  ];
};

export { DRAFT };
