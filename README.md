# Drishti Geo

A premium, static marketing site for a remote sensing, GIS and GeoAI consultancy. Five pages: a landing page that leads to Services (six technical capabilities, plus four deliverable types), Applications (five illustrative problem domains), About and Contact. Built with Astro 5. It ships almost no JavaScript (mobile menu, scroll reveal, contact form).

Drishti Geo is a provisional brand. See [PLACEHOLDERS.md](PLACEHOLDERS.md) for everything to replace before publishing.

## Stack

- Astro 5 (static output), TypeScript for config and content
- Plain CSS with design tokens (`src/styles/tokens.css`), scoped styles per component. No Tailwind, no UI framework
- `@astrojs/sitemap` for `sitemap-index.xml`
- Self-hosted variable fonts via `@fontsource-variable/*` (Space Grotesk, Inter, JetBrains Mono), so no requests to Google
- `d3-contour` and `simplex-noise` (dev dependencies) draw the hero terrain contours at build time and send nothing to the browser

## Local setup

Requires Node >= 20.19 (see `.nvmrc` and `engines` in `package.json`).

```bash
npm install
cp .env.example .env     # optional, see "Contact form"
npm run dev              # http://localhost:4321
npm run build            # astro check + astro build, output in dist/
npm run preview          # serve dist/ locally
npm run check:links      # run after a build, verifies dist/ (all pages)
```

`npm run check:links` is a dependency-free Node script (`scripts/check-links.mjs`). It scans every `dist/**/index.html` plus `404.html` and checks:

- the five pages and the 404 exist
- internal links resolve, page links are absolute with a trailing slash, no hash-only links (except the skip link), and `#anchors` exist on the target page
- `mailto:` links are well formed
- per page: exactly one `<h1>`, a unique `<title>`, a unique meta description, a canonical URL, no duplicate ids, and `aria-current="page"` on the active nav item
- the content model, parsed by regex from `src/content/*.ts`: exactly 6 services, 5 applications and 4 deliverables. Service and deliverable ids appear once on `/services/`, application ids once on `/applications/`, and the home page links to every service, every application and `/services/#deliverables`
- services stay technical: no service or deliverable title contains Flood, Agriculture, Urban, Defence or Security, no service title equals an application title, and no id is shared between the three files
- every `services[]` id on an application exists in `SERVICES` and is linked from that application's card; every application card says it is illustrative
- card titles are headings that appear once per page, and there are no tab widgets
- retired wording is absent from `dist/`: "tied to a service", "Client benefit", "Seven", "seven services", the "DATA WE WORK WITH" strip and the hero "EPSG:4326" meta strip (text inside decorative SVG map labels is ignored)
- no duplicated copy: the text inside `<main>` of every page is split into sentences and list items, and any run of 7 or more words that appears in two or more different blocks, on one page or across pages, fails and is printed with its page and nearest heading. The `ALLOWLIST` near the top of the script lists the intentional exceptions (the `*_NOTE` strings in the content files, plus the CtaBand section on each page)
- `sitemap-0.xml` lists all five page URLs and `robots.txt` points at the sitemap
- no `<form>` anywhere when no Web3Forms key is set

External links are listed, not fetched. It prints a PASS/FAIL report and exits non-zero on failure. To check a build written elsewhere, pass its directory: `node scripts/check-links.mjs path/to/dist`.

## Routes

| URL | File | Content |
|-----|------|---------|
| `/` | `src/pages/index.astro` | Home: Hero, teasers for services (6), applications (5), deliverables (4) and the approach, CTA band. Teasers show titles only and link into the full sections |
| `/services/` | `src/pages/services.astro` | Page header, Services (6 technical capabilities, equal weight), then Deliverables (4 output types, `#deliverables`), CTA band |
| `/applications/` | `src/pages/applications.astro` | Page header, 5 illustrative problem domains with the services each one combines, and note, CTA band |
| `/about/` | `src/pages/about.astro` | Page header, About (approach, steps, sectors), CTA band |
| `/contact/` | `src/pages/contact.astro` | Page header, Contact (mailto, copy, form only when a key is set) |
| `/404` | `src/pages/404.astro` | Not found page (noindex) |

Every page wraps its content in `Base` (title, description, SEO), `Nav`, `<main id="main">` and `Footer`, and has exactly one `<h1>` (the Hero on home, `PageHeader` elsewhere). Deep links jump to the card with that id: `/services/#terrain-elevation`, `/services/#deliverables`, `/applications/#defence-security`.

## Project structure

```
astro.config.mjs          site URL (from SITE.url) and sitemap
src/
  config/site.ts          brand, tagline, email, URL, Web3Forms key, socials, NAV
  content/
    services.ts           the 6 technical capabilities (work examples + typical outputs) and SERVICES_NOTE
    applications.ts       the 5 illustrative problem domains (question, services[], outputs) and APPLICATIONS_NOTE
    deliverables.ts       the 4 output types (what a project hands over) and DELIVERABLES_NOTE
    approach.ts           About copy, 4-step method
  layouts/Base.astro      <head>: SEO, Open Graph, canonical, JSON-LD, skip link
  components/             Nav, Footer, Hero, ContourField, PageHeader, CtaBand,
                          Services, ServiceCard, Deliverables, Applications, HomeOverview,
                          About, Contact, Visual
  styles/                 tokens.css (colours, type, spacing), global.css (shared classes)
  pages/                  index.astro, services.astro, applications.astro, about.astro, contact.astro,
                          404.astro, robots.txt.ts (generated from SITE.url)
public/                   favicon.svg, og.png
scripts/check-links.mjs   post-build link and structure check
```

## How content maps to pages

| Content file | Rendered by | Shown on |
|--------------|-------------|----------|
| `src/content/services.ts` | `Services` / `ServiceCard` | `/services/` in full; titles as a teaser on `/` |
| `src/content/applications.ts` | `Applications` | `/applications/` in full; titles as a teaser on `/` |
| `src/content/deliverables.ts` | `Deliverables` | `/services/#deliverables` in full; titles as a teaser on `/` |
| `src/content/approach.ts` | `About` | `/about/` in full; a short teaser on `/` |
| `src/config/site.ts` (`SITE`) | `Contact`, `Footer`, `Base` | `/contact/`, every footer, every `<head>` |
| `src/config/site.ts` (`NAV`) | `Nav` | the header and mobile menu on every page |

The three files answer three different questions, so each piece of copy lives in exactly one of them:

- **Services** (`services.ts`) are technical capabilities: what we can do. Each has a summary, 3 to 4 examples of technical work and typical outputs.
- **Applications** (`applications.ts`) are problem domains: where and why those capabilities are used. Each has the practical question, a `services[]` list naming which services combine to address it, and the outputs that could inform a decision. They never repeat service descriptions.
- **Deliverables** (`deliverables.ts`) are output types: what a project hands over (maps and data, reports, pipelines, prototypes). They are a separate section on `/services/`, not an industry list.

One application usually combines several services, and one service can support several applications. The home page reuses the data for its title-only teasers, so renaming an entry updates every page that shows it.

## Adding a page

1. Create `src/pages/<name>/index.astro` (the folder form gives the clean URL `/<name>/`).
2. Wrap it in `<Base title="Name | Drishti Geo" description="...">` with `Nav`, `<main id="main">` and `Footer`. Use a unique title and a unique description of about 150 characters. Use `PageHeader` for the single `<h1>`.
3. Add `{ label, href: '/<name>/' }` to `NAV` in `src/config/site.ts`. The active item gets `aria-current="page"` from `Astro.url.pathname`.
4. Link to it with an absolute path and trailing slash (`/<name>/`, `/<name>/#some-id`), never a bare `#hash`.
5. Add the path to `EXPECTED_PAGES` in `scripts/check-links.mjs` so the check covers it. The sitemap picks the page up automatically at the next build.

## Editing content

Copy and business details live in typed data files, so you rarely touch markup.

- `src/config/site.ts`: brand name, tagline, description, site URL, email, social links, legal name (shown in the footer when set), nav items.
- Per-page `<title>` and meta description: set in each page file under `src/pages/` (props of `<Base>`). The default in `Base.astro` is only a fallback.
- `src/content/services.ts`: each service has `id`, `number`, `title`, `meta`, `summary`, `work` (3 to 4 examples of technical work), `outputs` and a `visual` key. Titles name capabilities; never use an industry (Flood, Agriculture, Urban, Defence, Security) as a service title. Adding a service means adding one object. The card, the `/services/#id` anchor, the home teaser and the JSON-LD `serviceType` list update automatically. If you add a `visual` key, draw it in `src/components/Visual.astro`.
- `src/content/applications.ts`: each application has `id`, `title`, `meta`, `summary`, `question`, `services` (ids from `services.ts`), `outputs`, a `visual` key and `illustrative: true`, which renders the "Illustrative example" badge. Say which services combine and what decision the outputs inform; do not restate service descriptions.
- `src/content/deliverables.ts`: each deliverable has `id`, `title`, `summary` and `includes`. Name output types, not sectors.
- `src/content/approach.ts`: About text and method steps.
- Colours, fonts and spacing: `src/styles/tokens.css`.

### Adding or renaming a service or application

- **Rename**: change `title` (or `meta`, `summary`) in the content file. Ids are the anchors (`/services/#id`, `/applications/#id`), so keep an id unchanged unless you also update every link to it. If you do change an id in `services.ts`, update each `services[]` list in `applications.ts` that names it.
- **Add a service**: append an object to `SERVICES` with a new unique `id`, the next `number`, and `work` and `outputs` lists. Then list its id in the `services[]` of every application it supports, so it is linked from those cards. A service no application uses still works, but check that is intended.
- **Add an application**: append an object to `APPLICATIONS` with a new unique `id`, `illustrative: true`, and `services[]` containing only ids that exist in `SERVICES`. The card links to each listed service. Ids must be unique across all three content files.
- **Counts**: `scripts/check-links.mjs` expects exactly 6 services, 5 applications and 4 deliverables (`EXPECTED_COUNTS`). Change the constant when you change the count on purpose, and update the count words in the page copy.
- Run `npm run build && npm run check:links` afterwards. It fails on an unknown `services[]` id, a missing card link, a sector word in a service title, or copy repeated across cards.

Keep the content honest: do not add clients, metrics, testimonials, team size or credentials unless they are real. Remove an "illustrative" label only when real evidence exists.

## Contact form

The contact page (`/contact/`) always shows a `mailto:` button and a copy-email button. The enquiry form is rendered only when a Web3Forms key is set, so there is never a form that silently goes nowhere.

1. Create a free access key at <https://web3forms.com> using the inbox you want to receive enquiries.
2. Restrict the key to your production domain in the Web3Forms dashboard. The key is public by design (`PUBLIC_` prefix, visible in the page), so domain restriction is what protects it.
3. Locally: `cp .env.example .env` and set `PUBLIC_WEB3FORMS_KEY=your-key`.
4. In production: set the same `PUBLIC_WEB3FORMS_KEY` environment variable in your host's build settings. It is read at build time, so rebuild after changing it.

The form shows "sent" only when the Web3Forms API confirms success. On failure it shows an error and the `mailto:` fallback. The privacy note names Web3Forms as the processor. Decide whether you also need a full privacy policy page (see PLACEHOLDERS.md).

## Replacing generated visuals with real Sentinel-2 imagery

The service and application tiles are generated inline SVGs (`src/components/Visual.astro`). To use real imagery instead:

1. Get a Sentinel-2 true-colour or false-colour crop from the Copernicus Browser (<https://browser.dataspace.copernicus.eu>) or Sentinel Hub EO Browser. Sentinel data is free and open under the Copernicus licence, but attribution is required, for example "Contains modified Copernicus Sentinel data [year]".
2. Export a 16:9 crop (about 1280x720), compress it (WebP or AVIF, under about 150 KB), and put it in `src/assets/visuals/`.
3. Import it with `astro:assets` (`import img from '../assets/visuals/flood.jpg'`, then `<Image src={img} alt="..." />`) in place of `<Visual />` for that card, and give it meaningful alt text.
4. Add the attribution line to the footer or next to the image, and update the "Illustrative graphics generated for this site" text in `src/components/Footer.astro`.

Use only imagery you are licensed to show, and keep any "illustrative" label unless the image is from a real, named project you are allowed to describe.

## Deployment

It is a static site: build command `npm run build`, output directory `dist`, Node 20.3 or newer. For every host, also do two things.

- Set `SITE.url` in `src/config/site.ts` to the real production URL. It drives canonical URLs, Open Graph URLs, the sitemap and `robots.txt`.
- Set `PUBLIC_WEB3FORMS_KEY` as an environment variable on the host if you want the form.

**Netlify**: New site from Git. Build command `npm run build`, publish directory `dist`. Add the env var under Site configuration, Environment variables. Set Node with `NODE_VERSION=20` if needed.

**Vercel**: Import the repo. Framework preset Astro, build command `npm run build`, output directory `dist`. Add the env var under Project Settings, Environment Variables.

**Cloudflare Pages**: Create a project from Git. Framework preset Astro, build command `npm run build`, output directory `dist`. Add the env var under Settings, Variables and Secrets. Set `NODE_VERSION=20` if needed.

**GitHub Pages**: Use the official Astro GitHub Action (`withastro/action`) with a workflow that builds and deploys `dist`. Add the key as a repository secret or variable and pass it to the build step as `PUBLIC_WEB3FORMS_KEY`. For a project site at `user.github.io/repo`, also set `base: '/repo'` in `astro.config.mjs`. Page links such as `/services/` and root paths such as `/favicon.svg` assume the site is served from the domain root, so a custom domain is the simpler route.

## Scope

This is a marketing site only. It deliberately has no authentication, database, dashboards, payments, chatbot or interactive GIS. If a product is built later, it should be a separate site or app.

## Roadmap: consultancy to product

Not built here. This is how the site is meant to be used.

1. **Phase 1, consultancy (about 0 to 6 months).** The site and the enquiry form's "what problem are you trying to solve" and sector fields act as structured demand capture. Log every enquiry and engagement in one sheet, tagged by problem, data and deliverable.
2. **Phase 2, productized service.** When the same deliverable recurs (likely candidates: Sentinel-1 flood-extent reports, land-use change reports, infrastructure exposure screening), turn it into a fixed-scope, fixed-price offer. That is a new entry in `src/content/deliverables.ts` (the output) or `src/content/applications.ts` (the problem it answers), with no redesign.
3. **Phase 3, product.** Automate the most repeated pipeline into a tool or API. It gets its own site or app, separate from this marketing site.
