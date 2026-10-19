# Drishti Geo validation report

Date: 2026-10-19. Scope: the five-page static site (`/`, `/services/`, `/applications/`, `/about/`, `/contact/`) plus the 404 page, as restructured to six services, five applications and four deliverables; built to `dist/`, and its source.

Evidence labels used below:
- RUN: I executed it for this report (build, link check, type check, greps and reads of `dist/` and `src/`).
- AUDIT: reported by an earlier audit pass of this workflow (content, accessibility/JS, visual, integration and fix reports); not re-run here.
- SOURCE: read from source or built HTML only; behaviour not exercised.
- NOT RUN: not done.

## 1. Summary

- The site has a homepage that leads to four inner pages (Services, Applications, About, Contact), plus a 404. Content is now six technical-capability services (01-06), five illustrative applications (problem domains) and four illustrative deliverables. The same counts appear on Home, `/services/` and `/applications/` (RUN: link checker finds 6 / 5 / 4 ids; AUDIT: counts read on all three pages).
- Fresh checks (RUN, this report): `npx astro build` completes (6 pages built), `node scripts/check-links.mjs` prints PASS, and `astro check` reports 0 errors, 0 warnings, 0 hints (30 files), but only on Node 22.14.0 x64, not on the default Node (section 2).
- Layout, overflow, JS errors, heading order, touch targets, drawer keyboard behaviour, anchors, reduced motion and contrast were measured in headless Chrome 155 by an audit pass (AUDIT). That pass ran before the last six fixes (section 8), and the fix pass did not re-measure them in a browser. Screenshots were reviewed by a separate visual pass, also before those fixes (section 4).
- Six findings were fixed in the latest round, four were dropped by verification, and three small fixes came from integration (section 8).
- Not done: Lighthouse, real-device testing, screen reader, live Web3Forms test, Claude-in-Chrome extension test, and a clean `npm run build` on the default Node (section 10).
- Placeholders remain (URL, email, OG image, brand name). Work through `PLACEHOLDERS.md` before publishing.

## 2. Build, type check and link check (RUN)

Toolchain facts observed in this run:
- `uname -m` reports `arm64`, but the default `node` is `/usr/local/bin/node`, a Mach-O x86_64 binary: v20.12.2, `process.arch` = `x64`. `node_modules` holds x64 native binaries only (`@esbuild/darwin-x64`, `@rollup/rollup-darwin-x64`), so the default Node and `node_modules` are consistent with each other (x64) on an arm64 machine.
- `npx astro build` on Node 22.14.0 x64 (downloaded earlier into the session scratchpad and put on `PATH` for these commands only): "6 page(s) built", "Complete!".
- `npx astro check` on that Node 22.14.0 x64: "Result (30 files): 0 errors, 0 warnings, 0 hints".
- `npx astro check` on the default Node v20.12.2 still FAILS in this run with `ERR_REQUIRE_ESM` (`@astrojs/language-server` `astro2tsx.js` requiring an ES module). `package.json` `engines` says `>=20.19.0` and `.nvmrc` says `22`. `npm run build` runs `astro check && astro build`, so `npm run build` does not pass on this machine's default Node. I did not fix this and did not change global Node. (Earlier in this workflow `astro build` alone was seen to work on the default Node; I did not re-run it on the default Node this time.)
- Not verified: any other Node version, a native arm64 Node with a reinstalled `node_modules`, and whether `22` in `.nvmrc` resolves to 22.12 or later on the owner's machine.

`node scripts/check-links.mjs` (RUN, against the `dist/` from the build above):

```
pages scanned      6
internal links     161 (34 with #anchor)
mailto links       7
services           6 ids (expected 6)
applications       5 ids (expected 5)
deliverables       4 ids (expected 4)
text blocks        328 in <main>; repeated 7+ word runs: 0
sitemap URLs       5
web3forms key      not set; <form> elements in dist: 0
external links     5 (listed, not fetched)
PASS  all checks passed
```

The five external links are the placeholder canonical URLs (`drishtigeo.example`) and were not fetched. The checker bans the retired phrases ("tied to a service", "Client benefit", "Seven", "seven services", the "DATA WE WORK WITH" strip, the hero "EPSG:4326" strip; text inside decorative `<svg>` blocks is ignored). It also requires unique titles and descriptions, no canonical on noindex pages, and a sitemap line in `robots.txt` (SOURCE for the rule list, RUN for the result). The checker's rules were not changed by the integration or fix passes (AUDIT).

## 3. Pages (RUN, read from `dist/` after the build above)

Gzip is `gzip -9` of the HTML file alone.

| Route | h1 | Title | HTML bytes | Gzipped |
|-------|----|-------|-----------:|--------:|
| `/` | Geospatial intelligence, from orbit to decision. | Drishti Geo \| Geospatial intelligence from orbit to decision | 76,645 | 24,132 |
| `/services/` | Services | Services \| Drishti Geo | 59,913 | 15,985 |
| `/applications/` | Selected applications | Selected applications \| Drishti Geo | 64,273 | 18,194 |
| `/about/` | About | About \| Drishti Geo | 14,578 | 4,103 |
| `/contact/` | Contact | Contact \| Drishti Geo | 13,395 | 4,498 |
| `/404.html` | This page is outside the coverage area. | Page not found \| Drishti Geo | 10,440 | 2,985 |

Each page has exactly one `<h1>` (RUN, counted). h2s found in `dist/` (RUN):
- `/`: Six technical capabilities; Five problem domains; What you receive; Evidence first, limits stated plainly; Have a geospatial question to answer?
- `/services/`: What we can do with spatial data; What you receive; Have a question the data might answer?
- `/applications/`: One question, several services; See something close to your question?

`/services/` holds 6 service `<article>` ids (`remote-sensing`, `gis-modelling`, `geoai`, `terrain-elevation`, `data-engineering`, `cartography-decision-support`) and 4 deliverable `<article>` ids (`maps-spatial-data`, `monitoring-reports`, `data-pipelines`, `decision-support-prototypes`) (RUN). `/applications/` holds 5 `<li>` ids (`flood-water`, `agriculture-ecosystems`, `urban-land-use`, `infrastructure-resilience`, `defence-security`) carrying 18 `/services/#id` chips and 5 "How it could be approached" blocks (RUN).

The sitemap lists five pages and not the 404. `robots.txt` points at `sitemap-index.xml` (AUDIT for the 404 and robots content; RUN for the sitemap URL count of 5). `og.png` is 317,146 bytes (RUN; it is a placeholder image). `aria-current="page"` appears once on each of `/services/`, `/applications/`, `/about/`, `/contact/` and 0 times on `/` (RUN). JSON-LD `serviceType` lists the six service titles exactly (RUN, read from `dist/index.html`).

## 4. Responsive behaviour, JS errors and visual review

Claude-in-Chrome extension test: NOT RUN. Earlier in this workflow the extension reported "Browser extension is not connected". It was not retried and no extension screenshots or console logs exist.

### JS-error check (AUDIT, not re-run here)
Headless Chrome 155 (new headless, own profile and CDP port) loaded `dist/` served by a local HTTP server on `/`, `/services/`, `/applications/`, `/about/`, `/contact/` and `/404.html` at 320, 375, 768, 1024 and 1440 px. Result: 0 console errors, warnings, uncaught exceptions or HTTP 4xx/5xx on all six pages at all five widths. Nav toggle, Escape and resize interactions also produced none. Clicking "Copy address" on Contact threw nothing and showed the "Copy failed, select the address manually" message (aria-live polite). That failure is expected in headless Chrome without clipboard permission or a user gesture, so a real clipboard success was not verified. This run happened before the six fixes in section 8, so the CSS changes from those fixes (tile height, deliverables subgrid, anchor margins, text-wrap) were not covered by it.

### Other measurements (AUDIT, same pass)
- `scrollWidth` equals `clientWidth` on every page at every width; no element extends past the viewport. Only decorative SVG paths extend past it and are clipped.
- Exactly one h1 per page, no heading level skips, no duplicate ids.
- No interactive element under 24 px; none between 24 and 44 px. The one small item is the inline "Applications" link in a sentence on `/services/` (82x17 px), which WCAG 2.5.8 exempts.
- Drawer, tested at 375, 768 and 959 px: closed panel is `visibility:hidden` and not focusable; open by keyboard sets `aria-expanded=true` and `html.nav-lock`, Tab order Services, Applications, About, Contact, CTA; tabbing out or Escape closes it (Escape returns focus to the toggle); resizing to 1100 px closes it and shows inline links; at 960 px the toggle is `display:none`. In a 568x320 landscape viewport the panel scrolls.
- Anchors: all 7 `/services/#id` targets (6 services plus `#deliverables`) and all 5 `/applications/#id` targets exist and resolve at all five widths. Two landing-offset issues were found and then fixed (section 8); the fixed offsets were not re-measured.
- Reduced motion: under emulated `prefers-reduced-motion: reduce`, `document.getAnimations()` returned 0 on all six pages, `scroll-behavior` was `auto`, and no `[data-reveal]` element stayed hidden.
- Contrast, computed on text nodes at 1440 px on solid background chains: every non-decorative text pair is at least 4.5:1 (3:1 for large text). The one failing text node set is the home ContourField coordinate ticks (about 3.5:1, 10 px, opacity 0.6), inside an `aria-hidden` decorative block. Text over the PageHeader and Contact gradients was not computed by that script; the earlier figures in section 7 are consistent with it.

### Screenshot review (AUDIT; headless Chrome, before the fixes in section 8)
Headless Chrome cannot go below about 500 px wide, so the 390 px shots were taken by loading each page in a 390 px iframe inside a wrapper page. A first 390 px run was clipped on the right (a window-width artifact) and discarded. Two further caveats: for most shots the `js` class setter was removed so `[data-reveal]` content shows, which also switches on the no-JS nav fallback (links wrapped under the logo below 960 px); that was treated as an artifact, and a JS-on copy was used to see the real drawer layout (hamburger at 820 and 390). For Home the hero `min-height` was overridden and the `.rise` animation disabled, in the copy only.

Images actually viewed:
- Services at 1440: top, card rows 1-2, Deliverables, CTA and footer slices, plus two close-up tile crops. At 820: slices 0-4. At 390 (iframe): slices 0-5.
- Applications at 1440: slices 0-3 plus a taller re-capture (slices 3-4). At 820: slices 0-4. At 390 (iframe): slices 0, 1, 4 and 5.
- Home at 1440: full-page slices 0-3 plus a hero capture with the animation neutralised (the unmodified hero frame was blank, a timing artifact). At 820: hero plus slices 1-3. At 390: slices 0-2 plus a JS-on capture.
- One JS-on Services capture at 820 (header and intro).

Screenshots NOT taken or NOT viewed: About, Contact and 404 were not covered by this visual pass at all (the earlier-structure visual pass did view them, but the pages changed since, so it is not relied on). The footer on the 1440 Services and Applications pages was seen only in a single tall capture. Earlier clipped 390 captures from a shared scratchpad were viewed and discarded, not relied on.

What the visual pass found OK (AUDIT): six service cards form a 3x2 grid at 1440, 2x3 at 820 and one column at 390 with equal heights and the "Discuss this" link bottom-aligned; the three new tiles (elevation 04, data engineering 05, cartography 06) are consistent with the first three; Deliverables is visually separate from Services (tinted band, divider, "ILLUSTRATIVE" badge, different card style); application cards read as eyebrow, badge, title, description, then THE QUESTION, OUTPUTS and SERVICES COMBINED; Defence & Security is on par with the other four cards; Home reads as a landing page with no overlap at three widths; no horizontal overflow in any capture.

The visual pass raised four layout findings (tile height, deliverables alignment, services note wrap, and the applications anchors from the JS pass). They were fixed afterwards (section 8). The fixed pages were NOT re-photographed or re-measured for this report. The fix pass states it did not check the tile-height and deliverables-subgrid changes visually in a browser.

Never observed: hover and focus-ring appearance (CSS read only), the Copy address button succeeding, real Safari or Firefox rendering, text-spacing overrides, the no-JS layout as designed, light mode.

## 5. Navigation and CTAs

- All 161 internal links resolve and the 34 anchored links point at ids that exist (link check, RUN). Home links into `/services/#<id>` and `/applications/#<id>`; id sets match the expected counts (RUN).
- Home is not in the nav; the logo link to `/` is the only link to Home and carries no `aria-current` (RUN for the count; judged acceptable).
- Scroll lock: `html.nav-lock { overflow: hidden; overscroll-behavior: none; }` with no `body` rule (RUN, read in `src/components/Nav.astro` line 285). The AUDIT drawer test above exercised the lock at 375, 768 and 959 px. iOS Safari behaviour (visual viewport, `100dvh`) cannot be tested in headless Chrome. Check it on a real iPhone.
- Anchor scroll offsets: `html { scroll-padding-top: 5rem }` in `src/styles/global.css`, `.item { scroll-margin-top: 1.5rem }` in `ServiceCard.astro`, and no `scroll-margin-top` on `.app-item` (RUN, grep). The resulting landing positions were not re-measured after the fix.

## 6. Contact functionality

- mailto: `dist/contact/index.html` contains a `mailto:` link for the placeholder address; 7 mailto links across the site (RUN, link check). Whether a mail client opens: NOT RUN.
- Copy address: clicked in headless Chrome by the audit pass, which showed the graceful failure message (AUDIT). A real successful copy was not verified.
- Form hidden without key (RUN): 0 `<form` elements in any built page; the page shows the mailto layout. `/contact/` has one more inline script than the other main pages (5 versus 4). Contact form fields were therefore not audited.
- Form with a key: UNTESTED. No build with `PUBLIC_WEB3FORMS_KEY` was made and nothing was sent to the live Web3Forms API.
- The address is a placeholder shown as a live contact.

## 7. Acceptance criteria, content and SEO

Important caveat: the text of the seven acceptance criteria was not part of the input I was given. Only criterion 4 (each application explains the methods that could address the problem) and the "existing visual design intact" criterion are named in the audit notes. The seven rows below are the topics the content, structure and visual audits actually tested, in my own order, with criterion 4 placed fourth to match the note. Check the numbering against the original brief. No tabs exist on the site (RUN: no `role="tab"`, `tablist`, `aria-selected` or `tabpanel` in `src/` or `dist/`), so tab behaviour is not applicable.

| # | Criterion topic | Result | Evidence |
|---|-----------------|--------|----------|
| 1 | Exactly six services, written as technical capabilities, not industries | Met | RUN: checker finds 6 service ids; JSON-LD lists the six titles; titles listed in section 3. AUDIT: none reads like an industry. The `/services/` meta description names all six. |
| 2 | Applications are problem domains, kept distinct from services | Met | RUN: 5 application ids. AUDIT: no application title is a service and no service title is an application category; cards cite services only as chips linking to service anchors (18 chips in `dist/`), and the build throws on an unknown service id (SOURCE). Applications are framed as a question plus outputs. |
| 3 | The many-to-many relationship between services and applications is explained | Met | RUN: `/services/` reads "One application usually combines several of these services, and one service can support several applications."; `/applications/` reads "The same service appears in more than one application, and one application rarely needs only one." AUDIT: Home has a third wording. |
| 4 | Each application explains the methods that could address the problem | Met after a fix | AUDIT: a content audit found the cards showed only a question, outputs and generic service chips; fixed by adding a one-sentence `approach` field per application. RUN: 5 "How it could be approached" blocks in `dist/applications/index.html`; `approach` present in `applications.ts`. Whether the five sentences are specific enough is a content judgement I did not make. |
| 5 | Applications and deliverables are honestly labelled; no invented claims | Met | RUN: 5 "Illustrative example" badges on `/applications/`, "Illustrative" appears 3 times in `dist/services/index.html`; `APPLICATIONS_NOTE` and `DELIVERABLES_NOTE` are in source. AUDIT: a grep of `src` found no invented clients, results or statistics. Deliverables are a separate section after the services (visual pass, AUDIT). |
| 6 | Defence & Security sits on equal footing and stays strategic | Met (see caution) | AUDIT: same markup and CSS as the other four cards, not first or last, wording limited to terrain and land-cover assessment, broad-area infrastructure change, remote-area environmental monitoring and resilience indicators, with no targeting, tracking or operational language. RUN: the title is "Defence & Security Geospatial Intelligence". Caution: see "Defence wording" below. |
| 7 | Existing visual design intact, with no horizontal overflow and a working nav | Partly evidenced | AUDIT: no overflow at five widths on six pages, drawer works by keyboard, 0 JS errors, Home/Services/Applications screenshots at three widths look consistent. Not evidenced: there is no git baseline (no commits; the repo is untracked), so I could not diff against the previous design. The judgement is only that styles and components look consistent. About, Contact and 404 were not screenshot-reviewed on the current structure. |

### Duplication check
- RUN: `check-links.mjs` compared 328 text blocks in `<main>` across the pages and found 0 repeated runs of 7 or more words.
- AUDIT: the many-to-many sentence is worded differently on each page; Home has a third wording.
- AUDIT, judgement only: several CTA and lede sentences share the pattern "Tell us the area and the decision... we will say whether..." (About CTA, Contact lede, Home CTA). That is repetitive wording, not duplicate content, and it was not changed.
- Dropped as taste after two verifiers read the source: overlap between "Typical outputs" on service cards and the Deliverables cards (see section 8).

### Defence wording (open item)
- A previous version of this report said the About page had a responsible-use block (no weapon targeting, no tracking, no classified data, clearances or contracts). That is no longer true. RUN: grep for "weapon", "troops" and "clearance" in `src/` and `dist/` finds no responsible-use text; the only hit for "classified" is "Classified land-cover rasters" on a service card. The About page now frames defence only as one domain among several (`src/content/approach.ts`, six sector tags in `About.astro`). `PLACEHOLDERS.md` still tells the owner to keep the Defence entry at terrain, land-cover and open-data analysis. The earlier dropped finding D1 (no visible boundary statement near the defence cards) therefore stands as an open polish item.
- AUDIT judgement note, not filed as a defect: "Geospatial Intelligence" in the Defence title is a standard GEOINT term, but it is the one place a reader could infer an intelligence-community link. The audit suggested "Defence & Security Geospatial Analysis". Not changed.

### SEO and other content (RUN unless noted)
- Titles and descriptions are unique per page (link check). The `/applications/` meta names all five domains (AUDIT).
- "DATA WE WORK WITH" occurs 0 times in any built file. "EPSG" appears only in `dist/services/index.html` (decorative CRS chip inside a map SVG; the checker exempts it).
- The `/404.html` page has `noindex` and no canonical (AUDIT, with the checker rule in SOURCE).

## 8. Findings fixed and findings dropped

Fix outcomes are from the fix and integration reports (AUDIT) unless marked RUN, which I confirmed in this report by reading source or `dist/`. None of the six fixes below was re-measured in a browser.

Fixed in the latest round:
- F3 [minor] Applications did not explain methods (criterion 4). Added an `approach` sentence per application and a "How it could be approached" block between the question/outputs and the service chips. RUN: 5 blocks in `dist/`.
- A11Y-RESP-1 [minor] `/services/#id` jumps left the top 3 px of the card under the sticky nav (the target started with the 18 px reveal transform). Fixed with `scroll-margin-top: 1.5rem` on `.item`. RUN: present in `ServiceCard.astro`. Landing position not re-measured.
- A11Y-RESP-2 [minor] `/applications/#id` jumps stopped about 176 px from the top because `scroll-margin-top` and `scroll-padding-top` added up. Removed the 6rem margin from `.app-item`. RUN: no `scroll-margin-top` on `.app-item`. Not re-measured.
- F1 [major] Application tiles did not fill their column at 820 and 1440 px, leaving an empty dark block under each tile (all five cards). From 720 px the tile stretches to card height with a 180 px minimum (RUN: `aspect-ratio: auto; min-height: 180px` and the SVG at `inset: 0` in `Applications.astro`); below 720 px it stays 16:9. The fix pass did not view it. The art uses `slice`, so it crops to fill: the cropping is unchecked.
- F2 [minor] Deliverable dividers and output lists started at different heights across a row. From 640 px each card spans four shared grid rows through a subgrid (RUN: `grid-row: span 4; grid-template-rows: subgrid` in `Deliverables.astro`). Not viewed. Subgrid browser support was not checked.
- F3 [minor] The Services note wrapped to a single orphaned word. Added `text-wrap: pretty` (RUN: present). This is a best-effort hint, and the note is still narrower than the lede. Not viewed.

Fixed by integration (AUDIT, with RUN confirmation where stated):
- Added `id={d.id}` to each deliverable `<article>`, because the checker expects it (RUN: the four ids are in `dist/services/index.html`).
- Removed an unused `idsFromSource` in `scripts/check-links.mjs` and an unused `n2` in `Visual.astro` (the type check reports 0 hints, RUN).
- A stale-content grep of `src`, `scripts`, `README.md` and `PLACEHOLDERS.md` found nothing stale beyond the checker's ban list (AUDIT; my own grep for "seven", "featured", `relatedService`, `flood-climate-risk` and `gis-analytics` agrees, RUN).

Dropped by verification (not fixed; two verifiers each, who judged them taste or small):
- Deliverables repeat outputs already listed on the service cards (services 05 and 06 against "Automated Data Pipelines" and "Decision-Support Prototypes"). Verifiers: the two layers are framed differently, the mapping is not one-to-one and each deliverable adds handover content, so it is a copy preference. The overlap itself was confirmed as real.
- About lists six "Sectors we can support" tags that do not match the five application domains, and Contact has a seven-option sector list (only rendered when a Web3Forms key is set). Verifiers agreed the counts are accurate, but judged it a deliberate "who we serve" versus "problem domain" split; they rated it minor and partly a consistency judgement. It is still an inconsistency an owner may want to tidy.
- "Illustrative" labelling is not uniform: per-card on applications, section-level for deliverables, and Home deliverables teaser has no qualifier. Dropped as a design choice.
- At 390 px the micro-labels in the two diagram-style tiles (05, 06) are about 7.7 px, not 6-7 px as filed. Two verifiers viewed them and judged them legible and consistent with the older tiles. Not a defect, but small text on a phone-width screen was only checked in headless Chrome.

Earlier-round fixes that still apply (AUDIT, from the previous seven-service structure; the seventh-tile, Defence-featured-card and Defence-crop fixes no longer apply because those layouts were replaced): the drawer scroll lock moved to `html` (A11Y-1); the 404 page chart sits in flow and the 404 has no canonical, `og:url` or JSON-LD; the 404 "About" link is 44x44 px; README and `PLACEHOLDERS.md` name the real page paths.

Open and not filed: the Defence title wording and the missing visible boundary statement (section 7), the sector-list inconsistency, the CTA wording pattern.

## 9. Accessibility: contrast and motion

Computed WCAG ratios on the token values by the accessibility audit (AUDIT; the 1440 px text-node pass in section 4 agrees):

| Pair | Ratio |
|------|------:|
| muted `#9aa7b4` on the brightest PageHeader grid line `#243040` | 5.45 |
| muted on plain page background | 7.84 |
| text on page background | 16.29 |
| text on grid line colour | 11.31 |
| lime eyebrow on grid line colour | 10.27 |
| CtaBand on `#111820`: text / muted / lime | 15.12 / 7.28 / 13.73 |
| dark text on lime button | 14.79 |
| lime on page background | 14.79 |
| muted on card | 6.71 |
| teal on card | 8.84 |

Not flagged, but worth knowing (AUDIT):
- The `btn-ghost` border `#34465c` is 1.85:1 on the raised background and 1.99:1 on the page background. The visible label identifies the control, so it was not counted as a non-text contrast failure; a strict auditor may want 3:1.
- The nav background is translucent; the worst case (a lime button scrolling beneath it) gives muted text about 3.65:1, momentarily and blurred.
- Decorative infinite animations (contour sweep, `tsv-flow`, 404 pulse) run longer than 5 seconds with no pause control. They are disabled under `prefers-reduced-motion: reduce`.
- Which colour pairs are "new" since the last build could not be determined (no previous build to diff), so all rendered text was checked instead.

## 10. Performance (RUN, from `dist/`)

- `dist/` is 964,600 bytes across 32 files by `find` (1,004 KB by `du`). Fonts are 15 woff2 files totalling 350,668 bytes; `og.png` is 317,146 bytes (placeholder image). (The integration report counted 31 files and 962,398 bytes at an earlier point; use these figures.)
- CSS: six files in `_astro/`: about 18,935; applications 14,439 and 4,234; contact 4,825; index 7,337; services 6,267 bytes.
- Client JS: 0 external `.js` files and 0 `<script src>` tags. Each main page has 4 inline `<script>` tags (5 on `/contact/`, 3 on the 404): JSON-LD plus inline and module scripts. The integration pass measured inline scripts at about 1.4 KB on most pages and about 5.1 KB on `/contact/` (AUDIT).
- Not measured: Lighthouse scores, LCP, CLS, TBT, real per-page network transfer.

## 11. Not verified, and manual checks for the owner

1. Lighthouse (performance, accessibility, SEO, best practices): NOT RUN.
2. Real-device testing (iOS Safari, Android Chrome), including the drawer scroll lock and `dvh` behaviour: NOT RUN. Firefox and Safari engines: NOT RUN.
3. Screen reader pass (VoiceOver or NVDA): NOT RUN.
4. Live Web3Forms: create a key, build with `PUBLIC_WEB3FORMS_KEY`, test success, failure, honeypot and the mailto fallback. UNTESTED.
5. Claude-in-Chrome extension test: NOT RUN (extension was not connected when tried earlier, not retried).
6. Node: `npm run build` fails on this machine's default Node 20.12.2 (x64) at `astro check` (RUN, `ERR_REQUIRE_ESM`). Install Node 22.12 or later (or 20.19 or later) that matches `node_modules`' architecture, or reinstall `node_modules` for the Node you use. A clean `astro check` was obtained only on Node 22.14.0 x64. I did not change this.
7. Post-fix visual and browser re-check: the six fixes in section 8 (tile height, deliverables subgrid, anchor offsets, note wrap, approach block) have not been seen in a browser. Open all five pages at 390, 820 and 1440 px, click each `/services/#id` and `/applications/#id` link, and look at hover, focus, the open drawer and the Copy address button. About, Contact and 404 need a first visual review on the current structure.
8. Confirm the criteria numbering in section 7 against the original brief; I did not have the criteria text.
9. Replace placeholders in `PLACEHOLDERS.md`: brand name check, `SITE.url`, `SITE.email`, `og.png`, privacy policy decision, favicon.
10. Re-read services, applications and About copy to confirm every claim is deliverable; decide on the Defence title and on adding a visible responsible-use statement.
11. This folder has no git commits (`git log` reports none on branch `main`); nothing was committed, and there is no baseline to diff the visual design against.
