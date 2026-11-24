// Runs after `vite build` and the SSR build: writes one HTML file per page in PAGE_META
// (src/seo.ts) with its own title, description and (when live) canonical, share tags and
// structured data, plus 404.html, robots.txt and (when live) sitemap.xml. Vercel's cleanUrls
// serves /trucking from trucking.html.
//
// Draft mode (DRAFT in src/data/business.ts): every page gets noindex, robots.txt blocks
// crawlers, and there's no canonical or sitemap, because the web address isn't confirmed.
// When DRAFT is false the build stops if any <Ph> placeholder is still on a page.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const ssr = await import(path.resolve('dist-server/entry-server.js'));
const { render, ALL_PATHS, NOT_FOUND_META, SITE_URL, SHARE_IMAGE, DRAFT, canonicalUrl, pageMeta, pageJsonLd, placeholdersLeft } = ssr;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
for (const marker of ['<!--page-head-->', '<div id="root"></div>']) {
  if (!template.includes(marker)) throw new Error(`prerender: ${marker} not found in index.html`);
}

// Fonts are self-hosted (src/fonts.ts). Preload the two every page paints first, the heading slab
// and the body text, so they arrive with the CSS instead of after it (less font swap, less shift).
const assets = fs.readdirSync(path.join(DIST, 'assets'));
const fontPreloads = [/^zilla-slab-latin-700-normal-.*\.woff2$/, /^source-sans-3-latin-400-normal-.*\.woff2$/].map((re) => {
  const file = assets.find((a) => re.test(a));
  if (!file) throw new Error(`prerender: no font file matching ${re} in dist/assets`);
  return `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin />`;
});

const renderPage = (pagePath, meta, { notFound = false } = {}) => {
  const body = render(pagePath);
  const h1s = (body.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) throw new Error(`prerender: ${pagePath} has ${h1s} <h1> elements (needs exactly one)`);
  if (!notFound && body.includes('Page not found.')) throw new Error(`prerender: ${pagePath} is in PAGE_META but has no route in App.tsx`);
  const head = [...fontPreloads];
  if (DRAFT || notFound) head.push('<meta name="robots" content="noindex" />');
  if (!DRAFT && !notFound) {
    const url = canonicalUrl(pagePath);
    head.push(`<link rel="canonical" href="${esc(url)}" />`, `<meta property="og:url" content="${esc(url)}" />`);
    head.push(
      `<meta property="og:image" content="${esc(SHARE_IMAGE.url)}" />`,
      `<meta property="og:image:width" content="${SHARE_IMAGE.width}" />`,
      `<meta property="og:image:height" content="${SHARE_IMAGE.height}" />`,
      `<meta property="og:image:alt" content="${esc(SHARE_IMAGE.alt)}" />`,
    );
    for (const data of pageJsonLd(pagePath)) {
      head.push(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
    }
  }
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(meta.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(meta.description)}$2`)
    .replace('<!--page-head-->', head.join('\n    '))
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
};

for (const pagePath of ALL_PATHS) {
  const file = pagePath === '/' ? 'index.html' : `${pagePath.slice(1)}.html`;
  fs.mkdirSync(path.dirname(path.join(DIST, file)), { recursive: true });
  fs.writeFileSync(path.join(DIST, file), renderPage(pagePath, pageMeta(pagePath)));
  console.log(`prerendered ${pagePath} -> ${file}`);
}
fs.writeFileSync(path.join(DIST, '404.html'), renderPage('/404', NOT_FOUND_META, { notFound: true }));
console.log('prerendered 404.html');

// The team portal: an empty shell the app fills in the browser. Never indexed, in draft or
// live mode; vercel.json sends every /portal/... address here and adds X-Robots-Tag. It can be
// added to a phone's home screen (portal.webmanifest) and opens with no signal (portal-sw.js).
const portalTitle = 'FX4 Team Portal';
const portalDesc = 'Sign-in page for the FX4 Logistics team.';
fs.writeFileSync(
  path.join(DIST, 'portal.html'),
  template
    .replace(/<title>[^<]*<\/title>/, `<title>${portalTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${portalDesc}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${portalTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${portalDesc}$2`)
    .replace(
      '<!--page-head-->',
      '<meta name="robots" content="noindex, nofollow" />\n    <link rel="manifest" href="/portal.webmanifest" />\n    <meta name="theme-color" content="#1d3150" />\n    <meta name="apple-mobile-web-app-title" content="FX4 Team" />',
    ),
);
fs.writeFileSync(
  path.join(DIST, 'portal.webmanifest'),
  JSON.stringify(
    {
      name: 'FX4 Team Portal',
      short_name: 'FX4 Team',
      start_url: '/portal',
      scope: '/portal',
      display: 'standalone',
      background_color: '#f6f3ec',
      theme_color: '#1d3150',
      icons: [
        { src: '/portal-icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/portal-icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    null,
    2,
  ) + '\n',
);

// The service worker keeps the portal shell and the site's built files (scripts, styles, fonts)
// on the phone. Portal pages try the network first and fall back to the saved shell; built
// files are named by their contents, so a saved copy is never stale. /api is never saved: the
// screens keep their own copy of a driver's data (src/portal/store.ts).
const keep = assets.filter((a) => /\.(js|css|woff2)$/.test(a)).map((a) => `/assets/${a}`);
const version = `fx4-portal-${Buffer.from(keep.join('|')).reduce((h, b) => (h * 31 + b) >>> 0, 7).toString(36)}`;
fs.writeFileSync(
  path.join(DIST, 'portal-sw.js'),
  `// Written by scripts/prerender.mjs. Only the team portal registers this (scope /portal).
const VERSION = ${JSON.stringify(version)};
const SHELL = '/portal';
const FILES = ${JSON.stringify(keep)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll([SHELL, '/portal-icon-192.png', ...FILES])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('fx4-portal-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    if (url.pathname !== '/portal' && !url.pathname.startsWith('/portal/')) return;
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(SHELL, copy));
          }
          return res;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/portal-icon-')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
`,
);
console.log(`wrote portal.html (team portal shell, noindex), portal.webmanifest and portal-sw.js (${keep.length} files kept offline)`);

const left = placeholdersLeft();
if (!DRAFT && left.length) {
  throw new Error(`prerender: DRAFT is off but these placeholders are still on the page: ${left.join(', ')}`);
}

if (DRAFT) {
  fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  console.log(`draft build: noindex on every page, robots.txt blocks crawlers, ${left.length} placeholders to fill`);
} else {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ALL_PATHS.map((p) => `  <url><loc>${canonicalUrl(p)}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /portal\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log(`live build: sitemap.xml and robots.txt for ${SITE_URL}`);
}
