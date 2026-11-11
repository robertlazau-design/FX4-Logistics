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
const { render, ALL_PATHS, NOT_FOUND_META, SITE_URL, DRAFT, canonicalUrl, pageMeta, pageJsonLd, placeholdersLeft } = ssr;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
for (const marker of ['<!--page-head-->', '<div id="root"></div>']) {
  if (!template.includes(marker)) throw new Error(`prerender: ${marker} not found in index.html`);
}

const renderPage = (pagePath, meta, { notFound = false } = {}) => {
  const body = render(pagePath);
  const h1s = (body.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) throw new Error(`prerender: ${pagePath} has ${h1s} <h1> elements (needs exactly one)`);
  if (!notFound && body.includes('Page not found.')) throw new Error(`prerender: ${pagePath} is in PAGE_META but has no route in App.tsx`);
  const head = [];
  if (DRAFT || notFound) head.push('<meta name="robots" content="noindex" />');
  if (!DRAFT && !notFound) {
    const url = canonicalUrl(pagePath);
    head.push(`<link rel="canonical" href="${esc(url)}" />`, `<meta property="og:url" content="${esc(url)}" />`);
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

// The team portal (demo): an empty shell the app fills in the browser. Never indexed, in draft
// or live mode; vercel.json sends every /portal/... address here and adds X-Robots-Tag.
const portalTitle = 'FX4 Team Portal';
const portalDesc = 'Sign-in page for the FX4 Logistics team.';
fs.writeFileSync(
  path.join(DIST, 'portal.html'),
  template
    .replace(/<title>[^<]*<\/title>/, `<title>${portalTitle}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${portalDesc}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${portalTitle}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${portalDesc}$2`)
    .replace('<!--page-head-->', '<meta name="robots" content="noindex, nofollow" />'),
);
console.log('wrote portal.html (team portal shell, noindex)');

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
