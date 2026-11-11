# FX4 Logistics: notes for Claude

The website for FX4 Logistics Inc., a locally owned trucking carrier (flatbed, step deck, dry van, hopper) with a new warehouse, based at 23605 NE Halsey St, Ste C, Wood Village, Oregon, off I-84 exit 16. Robert Lazau (Golden Boy Productions) builds and runs it for the owner, Daniel. Read this before changing anything.

## Status: draft preview

`DRAFT = true` in `src/data/business.ts`. In draft mode the site shows a yellow draft banner, the yellow `<Ph>` placeholders (each numbered to match the call agenda) and Robert's call agenda panel, and it keeps search engines out: every page gets `noindex`, `robots.txt` blocks crawlers, and there's no canonical or sitemap.

**Before launch:**
1. Replace every `<Ph q="...">` with Daniel's real answer (`grep -rn "<Ph" src`).
2. Confirm the domain, set `SITE_URL` in `src/seo.ts`, add the domain to the `fx4-logistics` Vercel project and redirect `fx4-logistics.vercel.app` to it in `vercel.json` (same as the other sites).
3. Swap the stand-in scene, photo frames and trailer drawings for the photo shoot (if he books it), and the FX4 roundel for his real logo.
4. Connect the quote form to Robert's Web3Forms account (never the client's), and never submit it as a test.
5. Re-check the FMCSA/CarrierSource safety numbers in `SAFETY`.
6. Set `DRAFT = false`. The build stops if any `<Ph>` is left. Draft mode off turns on the canonical, sitemap, robots `Allow` and LocalBusiness JSON-LD.

## How Robert works

- **Never commit to `main`.** Use a feature branch and open a pull request; Robert merges.
- **Keep commits few.** Vercel caps builds per day, so bundle related changes into one PR.
- **Show the change first.** For anything visual, send screenshots or a short video before opening the PR.
- **Don't invent facts.** No made-up prices, equipment counts, lanes, transit times, customer names, quotes or certifications. If something is unknown, it stays a `<Ph>` and goes on the call agenda.
- **Never handle passwords, codes, keys or tokens.**

## Stack

- Vite, React 19, React Router 7 and Tailwind CSS 4.
- Vercel project `fx4-logistics` (robertlazau-design's projects), linked to this repo; it's the only one. Production branch is `main` and every pushed branch gets a preview build. Standard Protection is on: preview and per-build links need a Vercel login, but the production address `fx4-logistics.vercel.app` is open to anyone with the link (draft mode keeps search engines out).
- Seven pages, each its own route and prerendered file: `/` (Home), `/trucking`, `/warehousing`, `/about`, `/service-area`, `/driver-jobs`, `/contact`. To add one: a page in `src/pages/`, a `<Route>` in `src/App.tsx`, a title and description in `PAGE_META` (`src/seo.ts`) and, for the menu, an entry in `src/data/pages.ts`.
- Links between pages use React Router `<Link>`, so moving between pages doesn't reload; `App.tsx` scrolls to the top, updates the tab title and moves focus to the new page.
- The quote form lives on `/contact` only. Buttons elsewhere link there with some fields filled in through router state (`quoteFor()` in `src/data/quote.ts`), never through the address bar.
- `npm run build` builds the client, builds `src/entry-server.tsx` for the server and runs `scripts/prerender.mjs`, which writes one HTML file per page in `PAGE_META` (plus `404.html`) with its title, description and full text. Each page needs exactly one `<h1>`, and a page in `PAGE_META` without a route stops the build.
- `npm run lint` type-checks. `npm run dev` runs a local server (no prerender).
- Fonts load from Google Fonts through `<link>` tags in `index.html` (not a CSS `@import`).

| File | What's in it |
| --- | --- |
| `src/data/business.ts` | `DRAFT` switch, contact and carrier details (USDOT, MC, phone, address), safety numbers, states, hauls, form choices |
| `src/data/agenda.ts` | The call agenda questions; ids match the `<Ph q>` placeholders, and `path` is the page each "show" link opens |
| `src/data/pages.ts` | The menu: page paths and labels in order |
| `src/data/quote.ts` | Quote form fields and `quoteFor()`, which other pages use to prefill the Contact form |
| `src/seo.ts` | Titles and descriptions for every page, `SITE_URL`, JSON-LD (live mode only: LocalBusiness on Home, breadcrumbs elsewhere) |
| `src/pages/Home.tsx` | Short overview: hero with the quick quote, safety strip, one highway sign per page, call-to-delivery steps, quote band |
| `src/pages/Trucking.tsx` | Trailer cards, what we haul, why shippers stay, carrier packet |
| `src/pages/Warehousing.tsx` | Warehouse photo, facility data sheet, trucking + storage |
| `src/pages/About.tsx` | Owner's note, company data sheet, shipper quote |
| `src/pages/ServiceArea.tsx` | States, local towns, main lanes, route map |
| `src/pages/DriverJobs.tsx` | Why drive for FX4, pay and home time, apply button |
| `src/pages/Contact.tsx` | Contact box and the request-for-quote form |
| `src/pages/NotFound.tsx` | 404 page |
| `src/components/` | Header, Footer, PhoneBar, CallAgenda, RouteMap, Ph, PageParts (page hero with breadcrumb, quote band), Graphics (scene, shield, roundel, trailer drawings, exit arrow, icons) |
| `src/effects.tsx` | Motion effects (see below) |
| `src/index.css` | Brand tokens and all styles |

## Brand

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
