// Titles, descriptions and structured data for every page. scripts/prerender.mjs bakes them into
// each page's HTML at build time. In draft mode the pages get noindex and no canonical, because
// the web address isn't confirmed yet (agenda #22).
import { BUSINESS, DRAFT } from './data/business';

// TODO before launch: confirm the domain with Daniel.
export const SITE_URL = 'https://www.fx4logistics.com';

export type PageMeta = { title: string; description: string };

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'FX4 Logistics | Flatbed, Dry Van & Warehousing | Wood Village, OR',
    description:
      'Locally owned flatbed, step deck and dry van carrier with warehouse storage in Wood Village, Oregon, off I-84 exit 16. Call (971) 380-0602 for a quote.',
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
  if (DRAFT || path !== '/') return [];
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
      areaServed: ['Oregon', 'Washington', 'California', 'Idaho', 'Montana', 'Utah', 'Wyoming'],
      identifier: [
        { '@type': 'PropertyValue', name: 'USDOT', value: BUSINESS.usdot },
        { '@type': 'PropertyValue', name: 'MC', value: BUSINESS.mc },
      ],
    },
  ];
};

export { DRAFT };
