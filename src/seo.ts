// Titles, descriptions and structured data for every page. scripts/prerender.mjs bakes them into
// each page's HTML at build time. In draft mode the pages get noindex and no canonical, because
// the site isn't live at its own address yet.
import type { DayOfWeek, Graph, LocalBusiness, Offer, Service, State, Thing, WebSite } from 'schema-dts';
import { BUSINESS, DRAFT, STATES, TRAILERS, WAREHOUSE } from './data/business';
import { NAV } from './data/pages';

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
    title: 'Pallet Storage & Warehousing in Wood Village, OR | FX4 Logistics',
    description:
      "Pallet storage in Wood Village, Oregon, off I-84 near Portland: short or long-term, imported freight after customs, local delivery on FX4's own trucks.",
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
  '/privacy': {
    title: 'Privacy and Text Messages | FX4 Logistics',
    description: 'What the FX4 Logistics website and team portal keep, who sees it, and the sign-in texts the portal sends to FX4 drivers.',
  },
};

export const NOT_FOUND_META: PageMeta = {
  title: 'Page Not Found | FX4 Logistics',
  description: "We couldn't find that page. Head back to FX4 Logistics for trucking and warehousing in Wood Village, Oregon.",
};

export const ALL_PATHS = Object.keys(PAGE_META);

export const pageMeta = (path: string): PageMeta | undefined => PAGE_META[path];

export const canonicalUrl = (path: string) => `${SITE_URL}${path === '/' ? '/' : path}`;

// The picture link previews show (Facebook, LinkedIn, iMessage, X): the night Peterbilt from the
// Home hero, cropped to 1200x630 (public/og-image.jpg).
export const SHARE_IMAGE = {
  url: `${SITE_URL}/og-image.jpg`,
  width: 1200,
  height: 630,
  alt: 'An FX4 Peterbilt at night with its cab and marker lights glowing amber',
};

// Structured data (live mode only). Every page gets one connected graph: the page, the site, the
// breadcrumb and whatever the page is about, linked by @id, so search engines and AI answers
// tie the site, the FMCSA record and the warehouse to the same company. Types come from
// schema-dts, so `npm run lint` catches a misspelled property. Nothing here may say more than
// the pages do: no prices, ratings or reviews until they're real.
const BUSINESS_ID = `${SITE_URL}/#business`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const WAREHOUSE_ID = `${SITE_URL}/warehousing#warehouse`;
const TRUCKING_SERVICE_ID = `${SITE_URL}/trucking#service`;
const STORAGE_SERVICE_ID = `${SITE_URL}/warehousing#service`;
const WEEKDAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const areaServed = STATES.map((st): State => ({ '@type': 'State', name: st.name }));
const businessRef = { '@type': 'LocalBusiness', '@id': BUSINESS_ID, name: BUSINESS.name, url: `${SITE_URL}/` } satisfies LocalBusiness;

const warehouse: LocalBusiness = {
  '@type': 'LocalBusiness',
  '@id': WAREHOUSE_ID,
  name: 'FX4 Logistics Warehouse 1',
  url: canonicalUrl('/warehousing'),
  telephone: '+1-971-380-0602',
  address: {
    '@type': 'PostalAddress',
    streetAddress: WAREHOUSE.street,
    addressLocality: BUSINESS.city,
    addressRegion: BUSINESS.region,
    postalCode: BUSINESS.zip,
    addressCountry: 'US',
  },
  description: `${WAREHOUSE.services}. ${WAREHOUSE.storage}.`,
  parentOrganization: { '@id': BUSINESS_ID },
  openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: WEEKDAYS, opens: '06:00', closes: '22:00' },
  additionalProperty: [
    { '@type': 'PropertyValue', name: 'Size', value: WAREHOUSE.size },
    { '@type': 'PropertyValue', name: 'Doors', value: WAREHOUSE.doors },
    { '@type': 'PropertyValue', name: 'Security', value: WAREHOUSE.security },
  ],
};

const truckingService: Service = {
  '@type': 'Service',
  '@id': TRUCKING_SERVICE_ID,
  name: 'Flatbed, step deck and dry van trucking',
  serviceType: 'Truckload trucking',
  url: canonicalUrl('/trucking'),
  provider: businessRef,
  areaServed,
  description: PAGE_META['/trucking'].description,
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Trailers',
    itemListElement: TRAILERS.filter((t) => t !== 'Not sure').map(
      (t): Offer => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: `${t} trucking` } }),
    ),
  },
};

const storageService: Service = {
  '@type': 'Service',
  '@id': STORAGE_SERVICE_ID,
  name: 'Pallet storage and warehousing',
  serviceType: 'Warehousing',
  url: canonicalUrl('/warehousing'),
  provider: businessRef,
  description: PAGE_META['/warehousing'].description,
};

const business: LocalBusiness = {
  '@type': 'LocalBusiness',
  '@id': BUSINESS_ID,
  name: BUSINESS.name,
  legalName: BUSINESS.name,
  alternateName: 'FX4 Logistics',
  description: PAGE_META['/'].description,
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}/apple-touch-icon.png`, width: '180', height: '180' },
  image: SHARE_IMAGE.url,
  telephone: '+1-971-380-0602',
  email: BUSINESS.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.street,
    addressLocality: BUSINESS.city,
    addressRegion: BUSINESS.region,
    postalCode: BUSINESS.zip,
    addressCountry: 'US',
  },
  openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: WEEKDAYS, opens: '08:00', closes: '17:00' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'dispatch',
    telephone: '+1-503-320-4703',
    email: BUSINESS.email,
    availableLanguage: 'English',
  },
  areaServed,
  identifier: [
    { '@type': 'PropertyValue', name: 'USDOT', value: BUSINESS.usdot },
    { '@type': 'PropertyValue', name: 'MC', value: BUSINESS.mc },
  ],
  // The federal FMCSA record for this USDOT number. Add the CarrierSource and Google profiles
  // here once Daniel has claimed them and their details match the site.
  sameAs: [BUSINESS.fmcsaUrl],
  department: { '@id': WAREHOUSE_ID },
  makesOffer: [
    { '@type': 'Offer', itemOffered: { '@type': 'Service', '@id': TRUCKING_SERVICE_ID, name: truckingService.name as string, url: canonicalUrl('/trucking') } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', '@id': STORAGE_SERVICE_ID, name: storageService.name as string, url: canonicalUrl('/warehousing') } },
  ],
};

const website: WebSite = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: 'FX4 Logistics',
  inLanguage: 'en-US',
  publisher: { '@id': BUSINESS_ID },
};

// What each page is mainly about, and the page type schema.org has for it.
const PAGE_GRAPH: Record<string, { type: 'WebPage' | 'AboutPage' | 'ContactPage'; about: Thing[] }> = {
  '/': { type: 'WebPage', about: [business, website] },
  '/trucking': { type: 'WebPage', about: [truckingService] },
  '/warehousing': { type: 'WebPage', about: [storageService, warehouse] },
  '/about': { type: 'AboutPage', about: [business] },
  '/service-area': { type: 'WebPage', about: [] },
  '/driver-jobs': { type: 'WebPage', about: [] },
  '/contact': { type: 'ContactPage', about: [business] },
  '/privacy': { type: 'WebPage', about: [] },
};

export const pageJsonLd = (path: string): Graph[] => {
  if (DRAFT) return [];
  const meta = PAGE_META[path];
  const shape = PAGE_GRAPH[path];
  if (!meta || !shape) return [];
  const url = canonicalUrl(path);
  const label = NAV.find((n) => n.path === path)?.label;
  // The page's main subject: itself for Home (the business), the service or the business elsewhere.
  const main = shape.about[0] as { '@id'?: string } | undefined;
  const nodes: Thing[] = [
    {
      '@type': shape.type,
      '@id': `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.description,
      inLanguage: 'en-US',
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': main?.['@id'] ?? BUSINESS_ID },
      ...(path !== '/' && label ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    } as Thing,
    ...shape.about,
  ];
  if (path !== '/') {
    // Everything links back to the business and the site, so each page's graph stands on its own.
    if (!shape.about.includes(business)) nodes.push(businessRef);
    nodes.push({ '@type': 'WebSite', '@id': WEBSITE_ID, url: `${SITE_URL}/`, name: 'FX4 Logistics' });
    if (label) {
      nodes.push({
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: label, item: url },
        ],
      });
    }
  }
  return [{ '@context': 'https://schema.org', '@graph': nodes }];
};

export { DRAFT };
