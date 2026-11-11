// The site's pages in menu order. Header and footer read this list; titles and descriptions
// for each path live in src/seo.ts.
export const NAV = [
  { path: '/', label: 'Home' },
  { path: '/trucking', label: 'Trucking' },
  { path: '/warehousing', label: 'Warehousing' },
  { path: '/about', label: 'About Us' },
  { path: '/service-area', label: 'Service Area' },
  { path: '/driver-jobs', label: 'Driver Jobs' },
  { path: '/contact', label: 'Contact' },
] as const;
