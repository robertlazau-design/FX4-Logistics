# FX4 Logistics: notes for Claude

The website for FX4 Logistics Inc., a locally owned trucking carrier (flatbed, step deck, dry van; no hopper or farm loads) with a new 25,000 sq ft warehouse, based at 23605 NE Halsey St, Ste C, Wood Village, Oregon, off I-84 exit 16. Robert Lazau (Golden Boy Productions) builds and runs it for the owner, Daniel. Read this before changing anything.

## Status: live

Live at **https://www.fx4logistics.com** (launch PR Nov 23, 2026). `DRAFT = false` in `src/data/business.ts`, so the draft banner is gone, search engines are allowed in, and the canonical, sitemap, share image and structured data are on.

- **Domain:** `www.fx4logistics.com` is the main address (`SITE_URL` in `src/seo.ts`). `fx4logistics.com` redirects to it (set in the Vercel project), and `vercel.json` redirects `fx-4-logistics.vercel.app` there too. DNS is at Squarespace Domains (A @ 76.76.21.21, CNAME www cname.vercel-dns.com). Never touch the Google Workspace email records there (MX, SPF, DKIM, the google verification CNAME).
- **Quote form:** sends through Robert's Web3Forms account to dispatch@fx4logistics.com. The access key is the `VITE_WEB3FORMS_ACCESS_KEY` environment variable in the Vercel project, set by Robert; it never goes in the code. Without it the form shows a "call or email us" message instead of pretending to send. Never submit the form as a test.
- **Photo slots:** the warehouse photo, the crew photo and the Warehousing and Driver Jobs hero photos are still missing. In draft mode they show as labeled gray frames; live, the frames are hidden and those heroes show the drawn scene. When a real photo arrives, add it to `src/data/photos.ts` and pass it to the page (`photo=` on `PageHero`, or replace the frame).
- **Safety numbers** (`SAFETY` in `business.ts`): re-checked on FMCSA SAFER on Nov 23, 2026 (24 months to Nov 17, 2026): 33 inspections, 0 driver out-of-service orders, 0 crashes, 8 power units, and a Satisfactory safety rating (compliance review, rated Apr 9, 2024; shown on Trucking and About). Re-check them every few months. Say exactly what the numbers say: the vehicle out-of-service rate is above the national average, so never call the record "clean" or "perfect" as a whole.
- **Analytics:** Vercel Web Analytics (`<Analytics />` in `src/main.tsx`; it has to be switched on in the Vercel project) with the same lead events as Robert's other client sites (`src/leadEvents.ts`): Call Click and Email Click (page + where on the page), Form Sent (page + what the request was for) and Form Error. Never send names, numbers, emails or message text.
- **IndexNow:** after a merge to main that changes the public site, `.github/workflows/indexnow.yml` runs `scripts/indexnow.py`: it waits for Vercel's deploy of that commit (the "Vercel" commit status), checks the key file is live, then sends every page in the live sitemap to IndexNow (Bing and the others that use it). Portal-only changes don't trigger it; run it by hand from the Actions tab (IndexNow, Run workflow). The key is `public/76fe6292451ecd6610d4ebb4e4a60190.txt` and is public by design: it only proves the site owns the submissions. Google doesn't use IndexNow; it reads the sitemap.
- **Google Business Profile:** Daniel sets it up under his own Google account and adds Robert as a manager (steps in his client hub, clients.robertlazau.com/fx4-vzfw).
- `<Ph>` placeholders: none left. With `DRAFT` off the build stops if one is added.

## How Robert works

- **Never commit to `main`.** Use a feature branch and open a pull request; Robert merges.
- **Keep commits few.** Vercel caps builds per day, so bundle related changes into one PR.
- **Show the change first.** For anything visual, send screenshots or a short video before opening the PR.
- **Don't invent facts.** No made-up prices, equipment counts, lanes, transit times, customer names, quotes or certifications. If something is unknown, it stays a `<Ph>` until Daniel answers. A quote on the site must be a real shipper's or broker's words, used with their permission; Daniel's own words are FX4 speaking, never a testimonial.
- **Never handle passwords, codes, keys or tokens.**

## Stack

- Vite, React 19, React Router 7 and Tailwind CSS 4.
- Vercel project `fx-4-logistics` (robertlazau-design's projects), linked to this repo; it's the only one (the old `fx4-logistics` project was deleted). Production branch is `main` and every pushed branch gets a preview build. Standard Protection is on: preview and per-build links need a Vercel login, but the production address `fx-4-logistics.vercel.app` is open to anyone with the link (draft mode keeps search engines out).
- Seven pages, each its own route and prerendered file: `/` (Home), `/trucking`, `/warehousing`, `/about`, `/service-area`, `/driver-jobs`, `/contact`. To add one: a page in `src/pages/`, a `<Route>` in `src/App.tsx`, a title and description in `PAGE_META` (`src/seo.ts`) and, for the menu, an entry in `src/data/pages.ts`.
- Links between pages use React Router `<Link>`, so moving between pages doesn't reload; `App.tsx` scrolls to the top, updates the tab title and moves focus to the new page.
- The quote form lives on `/contact` only. Buttons elsewhere link there with some fields filled in through router state (`quoteFor()` in `src/data/quote.ts`), never through the address bar.
- `npm run build` builds the client, builds `src/entry-server.tsx` for the server and runs `scripts/prerender.mjs`, which writes one HTML file per page in `PAGE_META` (plus `404.html`) with its title, description and full text. Each page needs exactly one `<h1>`, and a page in `PAGE_META` without a route stops the build.
- `npm run lint` type-checks. `npm run dev` runs a local server (no prerender).
- Fonts are served from the site itself, from the Fontsource packages (`src/fonts.ts`: Latin letters only, only the weights `index.css` uses), not from Google Fonts. `scripts/prerender.mjs` preloads Zilla Slab 700 and Source Sans 3 400; if headings or body text change weight, change the preload too.
- Every page shares one picture for link previews, `public/og-image.jpg` (1200x630, the night Peterbilt cropped past the roadside billboard), set in `SHARE_IMAGE` (`src/seo.ts`).

| File | What's in it |
| --- | --- |
| `src/data/business.ts` | `DRAFT` switch, contact and carrier details (USDOT, MC, phone, address), safety numbers, states, hauls, form choices |
| `src/data/pages.ts` | The menu: page paths and labels in order |
| `src/data/photos.ts` | FX4's own truck photos: file, alt text and crop for each; `srcSet()` for the full and half-size copies |
| `src/data/quote.ts` | Quote form fields and `quoteFor()`, which other pages use to prefill the Contact form |
| `src/seo.ts` | Titles and descriptions for every page, `SITE_URL`, the share image, and the structured data (live mode only): one connected graph per page (the page, the site, the company with its FMCSA record, the warehouse as a department, a Service on Trucking and Warehousing, breadcrumbs), typed with `schema-dts`. No prices, reviews or ratings in it until they're real |
| `src/fonts.ts` | The self-hosted brand fonts |
| `src/leadEvents.ts` | Call, email and quote-form events for Vercel Web Analytics |
| `src/pages/Home.tsx` | Short overview: hero with the quick quote, safety strip, one highway sign per page, call-to-delivery steps, quote band |
| `src/pages/Trucking.tsx` | Trailer cards, what we haul, why shippers stay, carrier packet |
| `src/pages/Warehousing.tsx` | Warehouse photo, facility data sheet, trucking + storage, imported freight (after customs only) |
| `src/pages/About.tsx` | Owner's note, company data sheet, FX4's day-or-night line (Daniel's words in FX4's voice; no customer quote yet) |
| `src/pages/ServiceArea.tsx` | States, local towns, main lanes, route map |
| `src/pages/DriverJobs.tsx` | Why drive for FX4, pay and home time, apply button |
| `src/pages/Contact.tsx` | Contact box and the request-for-quote form |
| `src/pages/NotFound.tsx` | 404 page |
| `src/components/` | Header, Footer, PhoneBar, RouteMap, Ph, PageParts (page hero with breadcrumb and optional kicker line, quote band), Pic (a photo as WebP with a JPG fallback), Graphics (scene, shield, trailer drawings, exit arrow, icons), Logo (FX4's logo) |
| `src/effects.tsx` | Motion effects (see below) |
| `src/index.css` | Brand tokens and all styles |

## Photos

- FX4's own truck photos (from Daniel, Nov 2026) live in `public/photos/`, each at full size and half size (`-sm`), as JPG and as a WebP copy (quality 72, about a third lighter), with GPS and camera data stripped. `src/data/photos.ts` lists them with alt text and crop; `<Pic>` shows one. A new photo needs all four files.
- Where they are: the Home hero (night Peterbilt), the Trucking hero (loaded flatbed) and its "On the road" row, the About and Service Area heroes, and the Driver Jobs frame (Peterbilt in snow).
- `PageHero` takes `photo={PHOTOS.x}` in place of `slot`; the hero then shows the photo under a darker gradient (`.has-photo`) instead of the drawn scene. Hero photos load first (`fetchPriority="high"`); everything else lazy-loads.
- Never caption a photo with a place, load or trailer type Daniel hasn't confirmed.

## Brand

- Logo: Daniel's FX4 logo (sent Nov 11, 2026), redrawn as a vector from his image files in `src/components/Logo.tsx`. `FX4Logo` is the full lockup with LOGISTICS (footer); `FX4Mark` is the letters alone for small spaces (header, favicon), where LOGISTICS would be too small to read, so the header sets "Logistics" as text beside it. Both take their colour from `currentColor`: ink on white, white on navy or ink. Don't stretch it or redraw its shapes; if Daniel sends the original vector file, swap in its paths. The favicon (`public/favicon.svg`, `favicon.ico`) and `apple-touch-icon.png` are the white mark on navy.
- Colors (CSS variables in `src/index.css`): ink `#0f1a2b`, navy `#1d3150`, navy-dark `#15243b`, Interstate red `#a8332a`, cream `#f6f3ec`, paper `#fffdf8`.
- Type: Zilla Slab for headings, Source Sans 3 for reading, IBM Plex Mono for the numbers a shipper checks (USDOT, MC, safety data, specs, labels).
- Trucking details are part of the look: the I-84 shield, USDOT/MC set like cab-door lettering, the bill-of-lading quick quote, the carrier packet, the facility and company data sheets, the highway guide signs on Home ("Exit 1–4") and the interstate route map. Keep new sections in that vernacular.

## Motion rules (the Golden Boy kit, same as RobertLazau.com)

- Only `transform` and `opacity` move (plus SVG stroke offsets and small paint-only touches). Never animate layout.
- Easing: `--ease` (`cubic-bezier(.16,1,.3,1)`) for reveals, `--ease-cut` for things that open or close.
- Every effect has a `prefers-reduced-motion` fallback that shows the finished state.
- Mouse-only effects sit behind `(hover: hover) and (pointer: fine)`.
- All text stays in the prerendered HTML. Never hide content until JavaScript runs, and never hide something that was on screen at load.
- No animation libraries. On phones, nothing may make the page scroll sideways.

## Effects (`src/effects.tsx`, styles in `index.css`)

| Effect | Where | What it does |
| --- | --- | --- |
| Headlight sweep (`.sweep`, CSS only) | Home hero scene | Warm light passes across the scene once at load, under the text. |
| Magnetic buttons (`.magnetic`, `usePageEffects`) | Quote, storage and apply buttons | The button leans toward the cursor. |
| Sign lift (`.sign`, CSS only) | Home page signs | On mouse hover the sign rises a little and its exit arrow nudges up and right. |
| Card light (`.rig`, `usePageEffects`) | Trailer cards | A soft red light follows the mouse; the truck nudges forward on hover. |
| Widescreen bars (`.lb`, `usePlayOnScroll`) | Warehousing photo | Bars open the first time it scrolls into view. |
| Route draw-in (`.map`, `usePlayOnScroll`) | Service Area route map | The interstate lines draw themselves, then the states and shields appear. |
