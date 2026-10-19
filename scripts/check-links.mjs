#!/usr/bin/env node
// Post-build sanity check for dist/. No dependencies. Run: npm run build && npm run check:links
// Optional: node scripts/check-links.mjs <dist-dir> to check a build written somewhere other than ./dist.
//
// Scans every dist/**/index.html plus dist/404.html and verifies:
//   links    internal links resolve; page links are absolute with a trailing slash;
//            hash-only links are not used (except the skip link); #anchors exist on the TARGET page;
//            mailto: is well formed; external links are listed, never fetched
//   pages    the five expected pages + 404 exist; per page: exactly one <h1>, unique <title>,
//            unique meta description, canonical present, no duplicate ids, nav aria-current
//   content  parsed from src/content/*.ts: exactly 6 services, 5 applications, 4 deliverables.
//            Service and deliverable ids appear once on /services/, application ids once on /applications/;
//            the home page links to every service and application anchor and to /services/#deliverables
//   model    services are technical capabilities, not industries: no service or deliverable title contains a
//            sector word (Flood, Agriculture, Urban, Defence, Security); no service title equals an application
//            title; no id is shared between the three files; every application lists services[] ids that exist
//            and links to each of them from its own card; every application card says it is illustrative;
//            card titles are headings that appear once per page; no tab widgets
//   removed  no "DATA WE WORK WITH" strip, no "EPSG:4326" meta strip, and none of the retired phrases
//            ("tied to a service", "Client benefit", "Seven", "seven services") anywhere in dist
//   dupes    text inside <main> of every built page is split into sentences and list items; any run of 7 or
//            more words that appears in two or more different blocks (same page or across pages) fails,
//            except strings on the ALLOWLIST below. Offenders are printed with page, nearest heading and text
//   seo      sitemap-0.xml lists all five page URLs; robots.txt points at the sitemap
//   form     no <form> anywhere when no Web3Forms key is set (only on /contact/ when set)
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = process.argv[2] ? resolve(process.argv[2]) : join(ROOT, 'dist');

// Duplication check settings (see the "dupes" note above).
const MIN_DUPE_WORDS = 7;
// ALLOWLIST: strings that are meant to be shared. Each is matched after normalisation (lowercase, punctuation
// stripped) and a repeated run is ignored when it sits inside an allowed string. Keep this short and justified.
//  1. The exported *_NOTE strings in src/content/*.ts (SERVICES_NOTE, APPLICATIONS_NOTE, DELIVERABLES_NOTE).
//     They are the honesty / "how these relate" statements and may be quoted on more than one page. They are
//     read from the content files at run time, so they never need to be copied here.
//  2. CtaBand sections (markup class "cta"). The closing call to action is page-specific copy on purpose and
//     is excluded by CTA_SECTION_RE instead of by string, so editing it never needs an allowlist change.
//  3. ALLOWLIST_EXTRA below: add { text, why } only when a repeated sentence is genuinely intended.
const ALLOWLIST_EXTRA = [
  // { text: 'Example sentence that is meant to appear twice.', why: 'Legal wording required on every page.' },
];
const CTA_SECTION_RE = /<section\b[^>]*\sclass\s*=\s*"[^"]*\bcta\b[^"]*"[\s\S]*?<\/section>/gi;
// Sector words that may not appear in a service or deliverable title (services are capabilities, not industries).
const SECTOR_RE = /\b(flood\w*|agricultur\w*|urban|defen[cs]e|security)\b/i;
const EXPECTED_COUNTS = { services: 6, applications: 5, deliverables: 4 };

const EXPECTED_PAGES = ['/', '/services/', '/applications/', '/about/', '/contact/', '/404'];
const SITEMAP_PAGES = EXPECTED_PAGES.filter((p) => p !== '/404');
const ALLOWED_HASH_ONLY = new Set(['#main', '#top']); // skip link, back to top

const failures = [];
const externals = new Map(); // url -> Set(pages)
const fail = (page, msg) => failures.push({ page, msg });

if (!existsSync(DIST)) {
  console.error('FAIL  dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

// ---- helpers ---------------------------------------------------------------
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

// Remove script/style/comment bodies so their text cannot produce false matches.
const stripNoise = (html) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '<script></script>')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '<style></style>');

// Attribute value, quoted or unquoted.
const attrRe = (name) => new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>"']+))`, 'gi');
const attrValues = (html, name) => [...html.matchAll(attrRe(name))].map((m) => m[1] ?? m[2] ?? m[3] ?? '');

const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;|&#38;/g, '&');

// Value of an attribute inside the first tag matching `tagRe`.
function tagAttr(html, tagRe, name) {
  const tag = html.match(tagRe);
  if (!tag) return null;
  const m = [...tag[0].matchAll(attrRe(name))][0];
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? '') : null;
}

// dist file -> site path ("/", "/services/", "/404").
function pagePath(file) {
  const rel = relative(DIST, file).split('\\').join('/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404';
  return '/' + rel.replace(/index\.html$/, '');
}

// Map a URL path (no query/hash) to a file in dist, or null.
function resolveTarget(urlPath, pageFile) {
  const base = urlPath.startsWith('/') ? join(DIST, urlPath) : resolve(dirname(pageFile), urlPath);
  if (!base.startsWith(DIST)) return null;
  const candidates = urlPath.endsWith('/')
    ? [join(base, 'index.html')]
    : [base, base + '.html', join(base, 'index.html')];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

const idCache = new Map();
function idsOf(file) {
  if (!idCache.has(file)) {
    const html = stripNoise(readFileSync(file, 'utf8'));
    idCache.set(file, new Set(attrValues(html, 'id')));
  }
  return idCache.get(file);
}

// Parse the content files with regexes (no TypeScript runtime needed). Each entry starts at an `id: '...'` line.
const STR = `(['"])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`; // quoted string, group 2 = body
const unescape = (v) => v.replace(/\\(['"\\])/g, '$1');
function entriesFromSource(path) {
  const src = readFileSync(join(ROOT, path), 'utf8');
  const starts = [...src.matchAll(/^\s*id:\s*(['"])([^'"]+)\1/gm)];
  return starts.map((m, i) => {
    const block = src.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : src.length);
    const title = block.match(new RegExp(`\\btitle:\\s*${STR}`))?.[2];
    const svc = block.match(/\bservices:\s*\[([^\]]*)\]/)?.[1];
    return {
      id: m[2],
      title: title === undefined ? '' : unescape(title),
      services: svc === undefined ? null : [...svc.matchAll(/(['"])([^'"]+)\1/g)].map((x) => x[2]),
    };
  });
}

// Exported `*_NOTE` strings (SERVICES_NOTE, APPLICATIONS_NOTE, DELIVERABLES_NOTE): shared on purpose.
function notesFromSource(path) {
  const src = readFileSync(join(ROOT, path), 'utf8');
  return [...src.matchAll(new RegExp(`export const \\w+_NOTE\\s*=\\s*${STR}`, 'g'))].map((m) => unescape(m[2]));
}

// ---- text helpers for the duplication check --------------------------------
const decodeAll = (s) =>
  decode(s)
    .replace(/&middot;/g, '\u00b7')
    .replace(/&rarr;/g, '\u2192')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
// Lowercase, strip punctuation, collapse whitespace.
const normalise = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Tags that do NOT start a new text block (everything else, including span, li, p, div, a-wrapped cards, does).
const INLINE_TAGS = new Set(['a', 'strong', 'em', 'b', 'i', 'code', 'abbr', 'mark', 'small', 'sub', 'sup', 'time', 'cite', 'kbd']);

// Visible text of <main> as blocks [{ text, heading }]; heading = nearest preceding h2-h4. SVG and CtaBand are skipped.
function mainBlocks(html) {
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
  if (!main) return [];
  const body = main.replace(/<svg\b[\s\S]*?<\/svg>/gi, '').replace(CTA_SECTION_RE, '');
  const blocks = [];
  let buf = '';
  let heading = '';
  let inHeading = false;
  const flush = () => {
    const text = decodeAll(buf).replace(/\s+/g, ' ').trim();
    buf = '';
    if (!text) return;
    if (inHeading) heading = text;
    blocks.push({ text, heading });
  };
  for (const m of body.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>|([^<]+)/g)) {
    if (m[3] !== undefined) {
      buf += m[3];
      continue;
    }
    const name = m[2].toLowerCase();
    if (INLINE_TAGS.has(name)) continue;
    flush();
    if (/^h[2-4]$/.test(name)) inHeading = m[1] === '';
  }
  flush();
  return blocks;
}

// Sentences and list items: split at . ! ? followed by space, and at separator dots/bars used in mono captions.
const sentencesOf = (text) =>
  text
    .split(/(?<=[.!?])\s+|\s[\u00b7\u2022|]\s/)
    .map(normalise)
    .filter(Boolean);

// Element (outer HTML) carrying id="x", found by matching the closing tag of the same name; '' when absent.
function elementById(html, id) {
  const open = new RegExp(`<([a-zA-Z][a-zA-Z0-9-]*)\\b[^>]*\\sid\\s*=\\s*["']?${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?[\\s>/][^>]*>`, 'i').exec(html);
  if (!open) return '';
  const name = open[1];
  const tagRe = new RegExp(`<(/?)${name}\\b[^>]*>`, 'gi');
  tagRe.lastIndex = open.index + open[0].length;
  let depth = 1;
  for (let m; (m = tagRe.exec(html)); ) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(open.index, m.index + m[0].length);
  }
  return html.slice(open.index);
}

// Web3Forms key as the build saw it: environment first, then .env files.
function webFormsKey() {
  if (process.env.PUBLIC_WEB3FORMS_KEY?.trim()) return process.env.PUBLIC_WEB3FORMS_KEY.trim();
  for (const name of ['.env', '.env.local', '.env.production']) {
    const p = join(ROOT, name);
    if (!existsSync(p)) continue;
    const m = readFileSync(p, 'utf8').match(/^\s*PUBLIC_WEB3FORMS_KEY\s*=\s*["']?([^"'\r\n#]*)/m);
    if (m && m[1].trim()) return m[1].trim();
  }
  return '';
}

// ---- collect pages ---------------------------------------------------------
const pageFiles = walk(DIST).filter((f) => {
  const rel = relative(DIST, f).split('\\').join('/');
  if (rel.startsWith('_astro/')) return false;
  return rel === '404.html' || rel === 'index.html' || rel.endsWith('/index.html');
});
if (pageFiles.length === 0) {
  console.error('FAIL  no pages found in dist/');
  process.exit(1);
}

const pages = new Map(); // site path -> { file, rel, html }
for (const file of pageFiles) {
  pages.set(pagePath(file), {
    file,
    rel: relative(DIST, file),
    html: stripNoise(readFileSync(file, 'utf8')),
  });
}

// ---- expected pages --------------------------------------------------------
for (const p of EXPECTED_PAGES) {
  if (!pages.has(p)) fail(p, 'expected page is missing from dist');
}
const extraPages = [...pages.keys()].filter((p) => !EXPECTED_PAGES.includes(p));

// ---- per-page checks -------------------------------------------------------
let internalCount = 0;
let anchorCount = 0;
let mailtoCount = 0;
const titles = new Map(); // title -> page
const descriptions = new Map(); // description -> page
const key = webFormsKey();
let formCount = 0;

for (const [path, { file, html }] of pages) {
  // exactly one h1
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) fail(path, `expected exactly 1 <h1>, found ${h1s}`);

  // title: present and unique
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
  if (!title) fail(path, 'missing <title>');
  else if (titles.has(title)) fail(path, `duplicate <title> "${title}" (also on ${titles.get(title)})`);
  else titles.set(title, path);

  // meta description: present and unique
  const desc = tagAttr(html, /<meta\b[^>]*\sname\s*=\s*["']?description["']?[^>]*>/i, 'content');
  if (!desc || !desc.trim()) fail(path, 'missing meta description');
  else if (descriptions.has(desc.trim())) {
    fail(path, `duplicate meta description (also on ${descriptions.get(desc.trim())})`);
  } else descriptions.set(desc.trim(), path);

  // canonical present and pointing at this page; a noindex page (404) must have none
  const canonical = tagAttr(html, /<link\b[^>]*\srel\s*=\s*["']?canonical["']?[^>]*>/i, 'href');
  const noindex = /<meta\b[^>]*\sname\s*=\s*["']?robots["']?[^>]*noindex/i.test(html);
  if (noindex) {
    if (canonical) fail(path, 'noindex page should not declare a canonical');
  } else if (!canonical) fail(path, 'missing <link rel="canonical">');
  else {
    try {
      const cp = new URL(canonical).pathname;
      if (cp !== path) fail(path, `canonical points at ${cp}, expected ${path}`);
    } catch {
      fail(path, `canonical is not an absolute URL: ${canonical}`);
    }
  }

  // duplicate ids
  const seen = new Set();
  for (const id of attrValues(html, 'id')) {
    if (seen.has(id)) fail(path, `duplicate id "${id}"`);
    seen.add(id);
  }

  // active nav item carries aria-current="page" on the four inner pages
  if (SITEMAP_PAGES.includes(path) && path !== '/') {
    const current = [...html.matchAll(/<a\b[^>]*>/gi)]
      .map((m) => m[0])
      .filter((tag) => /\saria-current\s*=\s*["']?page["']?/i.test(tag))
      .map((tag) => decode([...tag.matchAll(attrRe('href'))][0]?.[1] ?? ''));
    if (!current.includes(path)) fail(path, `no <a href="${path}" aria-current="page"> found (nav active state)`);
  }

  // forms
  const forms = (html.match(/<form[\s>]/gi) || []).length;
  formCount += forms;
  if (!key && forms > 0) fail(path, `found ${forms} <form> but no Web3Forms key is set`);
  if (key && forms > 0 && path !== '/contact/') fail(path, '<form> found outside /contact/');

  // links
  const urls = [...attrValues(html, 'href'), ...attrValues(html, 'src')].map(decode);
  for (const raw of urls) {
    const url = raw.trim();
    if (url === '' || /^(data|tel|javascript):/i.test(url)) continue;

    if (/^mailto:/i.test(url)) {
      mailtoCount++;
      const addr = url.slice(7).split('?')[0];
      let decoded = addr;
      try {
        decoded = decodeURIComponent(addr);
      } catch {
        /* keep raw */
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decoded)) fail(path, `malformed mailto: ${url}`);
      continue;
    }
    if (/^(https?:)?\/\//i.test(url)) {
      const full = url.startsWith('//') ? 'https:' + url : url;
      if (!externals.has(full)) externals.set(full, new Set());
      externals.get(full).add(path);
      continue;
    }

    internalCount++;

    // hash-only links are not allowed (use '/page/#id'), except the skip link and back-to-top
    if (url.startsWith('#')) {
      if (!ALLOWED_HASH_ONLY.has(url)) {
        fail(path, `hash-only link ${url} (use an absolute path such as ${path}${url})`);
      } else if (url === '#main' && !idsOf(file).has('main')) {
        fail(path, 'skip link #main has no <main id="main"> target');
      }
      continue;
    }

    const [beforeHash, hash = ''] = url.split('#');
    const urlPath = beforeHash.split('?')[0];

    // page links: absolute, trailing slash (files with an extension, e.g. /favicon.svg, are exempt)
    const lastSeg = urlPath.split('/').pop() ?? '';
    if (!urlPath.startsWith('/')) fail(path, `relative internal link: ${url} (use an absolute path)`);
    else if (!urlPath.endsWith('/') && !lastSeg.includes('.')) {
      fail(path, `page link without trailing slash: ${url}`);
    }

    const target = resolveTarget(urlPath, file);
    if (!target) {
      fail(path, `broken link: ${url}`);
      continue;
    }
    if (hash !== '' && hash !== 'top') {
      anchorCount++;
      if (!target.endsWith('.html')) continue;
      let id = hash;
      try {
        id = decodeURIComponent(hash);
      } catch {
        /* keep raw */
      }
      if (!idsOf(target).has(id)) {
        fail(path, `anchor not found: ${url} (no id="${hash}" in ${relative(DIST, target)})`);
      }
    }
  }
}

// ---- content coverage ------------------------------------------------------
// Source of truth: src/content/*.ts, parsed by regex. Nothing about the content is hardcoded here except counts.
const services = entriesFromSource('src/content/services.ts');
const apps = entriesFromSource('src/content/applications.ts');
const deliverables = entriesFromSource('src/content/deliverables.ts');
const serviceIds = services.map((e) => e.id);
const appIds = apps.map((e) => e.id);
const deliverableIds = deliverables.map((e) => e.id);

const counts = [
  ['services', services, 'src/content/services.ts'],
  ['applications', apps, 'src/content/applications.ts'],
  ['deliverables', deliverables, 'src/content/deliverables.ts'],
];
for (const [name, list, file] of counts) {
  if (list.length !== EXPECTED_COUNTS[name]) {
    fail(file, `expected ${EXPECTED_COUNTS[name]} ${name}, parsed ${list.length}`);
  }
  const seenIds = new Set();
  for (const e of list) {
    if (!e.title) fail(file, `${name} entry "${e.id}" has no parsable title`);
    if (seenIds.has(e.id)) fail(file, `duplicate ${name} id "${e.id}"`);
    seenIds.add(e.id);
  }
}

// Services are capabilities, applications are problem domains: keep the two vocabularies apart.
const appTitles = new Set(apps.map((a) => normalise(a.title)));
const serviceTitles = new Set(services.map((x) => normalise(x.title)));
for (const x of services) {
  if (appTitles.has(normalise(x.title))) fail('src/content/services.ts', `service title "${x.title}" equals an application title`);
  if (SECTOR_RE.test(x.title)) fail('src/content/services.ts', `service title "${x.title}" names a sector (services are capabilities)`);
}
for (const d of deliverables) {
  if (SECTOR_RE.test(d.title)) fail('src/content/deliverables.ts', `deliverable title "${d.title}" names a sector (deliverables are output types)`);
  if (serviceTitles.has(normalise(d.title)) || appTitles.has(normalise(d.title))) {
    fail('src/content/deliverables.ts', `deliverable title "${d.title}" repeats a service or application title`);
  }
}
for (const a of apps) {
  if (serviceTitles.has(normalise(a.title))) fail('src/content/applications.ts', `application title "${a.title}" equals a service title`);
}
const idOwners = new Map();
for (const [name, list] of counts) {
  for (const e of list) {
    if (idOwners.has(e.id)) fail('src/content', `id "${e.id}" is used by both ${idOwners.get(e.id)} and ${name}`);
    else idOwners.set(e.id, name);
  }
}

// Each application's services[] must name existing services.
for (const a of apps) {
  if (!a.services || a.services.length === 0) fail('src/content/applications.ts', `application "${a.id}" has no services[] list`);
  for (const sid of a.services ?? []) {
    if (!serviceIds.includes(sid)) fail('src/content/applications.ts', `application "${a.id}" references unknown service id "${sid}"`);
  }
  if (new Set(a.services ?? []).size !== (a.services ?? []).length) {
    fail('src/content/applications.ts', `application "${a.id}" lists a service id twice`);
  }
}

// Ids appear exactly once, on the right page: services + deliverables on /services/, applications on /applications/.
const countId = (page, id) => (pages.has(page) ? attrValues(pages.get(page).html, 'id').filter((v) => v === id).length : 0);
const expectOnce = (page, ids, label) => {
  for (const id of ids) {
    const n = countId(page, id);
    if (n !== 1) fail(page, `${label} id="${id}" should appear exactly once, found ${n}`);
  }
};
expectOnce('/services/', serviceIds, 'service card');
expectOnce('/services/', deliverableIds, 'deliverable card');
expectOnce('/services/', ['deliverables'], 'deliverables section');
expectOnce('/applications/', appIds, 'application card');
for (const [page, ids, label] of [
  ['/applications/', [...serviceIds, ...deliverableIds], 'service/deliverable'],
  ['/services/', appIds, 'application'],
]) {
  for (const id of ids) {
    if (countId(page, id) > 0) fail(page, `${label} id="${id}" belongs on the other page`);
  }
}

// Application cards: link to each combined service, state they are illustrative.
if (pages.has('/applications/')) {
  const appHtml = pages.get('/applications/').html;
  for (const a of apps) {
    const card = elementById(appHtml, a.id);
    if (!card) continue; // already reported above
    const hrefs = new Set(attrValues(card, 'href').map(decode));
    for (const sid of a.services ?? []) {
      if (!hrefs.has(`/services/#${sid}`)) fail('/applications/', `card "${a.id}" has no link to /services/#${sid}`);
    }
    if (!/illustrative/i.test(card.replace(/<[^>]+>/g, ' '))) fail('/applications/', `card "${a.id}" is not marked illustrative`);
  }
}

// Card titles are headings and appear once per page (no repeated card titles).
function headingTexts(path) {
  if (!pages.has(path)) return [];
  const html = pages.get(path).html.replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
  return [...html.matchAll(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => normalise(decodeAll(m[2].replace(/<[^>]+>/g, ' '))));
}
for (const [path, list] of [['/services/', [...services, ...deliverables]], ['/applications/', apps]]) {
  const heads = headingTexts(path);
  for (const e of list) {
    const n = heads.filter((h) => h === normalise(e.title)).length;
    if (n !== 1) fail(path, `card title "${e.title}" should be a heading exactly once, found ${n}`);
  }
}

// No tab widgets anywhere.
for (const [path, { html }] of pages) {
  if (/\srole\s*=\s*["']?(tablist|tab|tabpanel)\b/i.test(html)) fail(path, 'tab widget found (role=tablist/tab/tabpanel); the site has none');
}

// the home page leads to every service, application anchor and the deliverables section
if (pages.has('/')) {
  const homeHrefs = new Set(attrValues(pages.get('/').html, 'href').map(decode));
  for (const id of serviceIds) {
    if (!homeHrefs.has(`/services/#${id}`)) fail('/', `no link to /services/#${id}`);
  }
  for (const id of appIds) {
    if (!homeHrefs.has(`/applications/#${id}`)) fail('/', `no link to /applications/#${id}`);
  }
  for (const href of ['/contact/', '/services/', '/applications/', '/about/', '/services/#deliverables']) {
    if (!homeHrefs.has(href)) fail('/', `no link to ${href}`);
  }
}

// ---- removed content: DataStrip, the hero meta strip and retired wording ---
const DOT = '(?:·|&middot;|&#183;|&#xB7;)';
const BANNED = [
  { re: /DATA WE WORK WITH/i, what: '"DATA WE WORK WITH" strip text' },
  { re: /tied to a service/i, what: 'retired wording "tied to a service"' },
  { re: /Client benefit/i, what: 'retired label "Client benefit"' },
  { re: /\bSeven\b/, what: 'stale count "Seven"' },
  { re: /seven services/i, what: 'stale count "seven services"' },
  { re: /EPSG:\s?4326/i, what: '"EPSG:4326" meta strip text' },
  { re: new RegExp(`OPTICAL\\s*${DOT}\\s*SAR\\s*${DOT}\\s*DEM`, 'i'), what: 'hero "OPTICAL · SAR · DEM" meta strip' },
];
for (const [path, { html }] of pages) {
  // Decorative inline <svg> map labels (e.g. the Visual component's CRS tag) are legitimate content;
  // only the removed hero/strip text outside SVG is banned.
  const text = html.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  for (const { re, what } of BANNED) {
    if (re.test(text)) fail(path, `dist still contains ${what}`);
  }
}
if (existsSync(join(ROOT, 'src/components/DataStrip.astro'))) {
  fail('src/components/DataStrip.astro', 'orphaned component: delete it');
}

// ---- duplication: no 7-word run repeated in two different blocks of <main> --
const allowed = [...notesFromSource('src/content/services.ts'), ...notesFromSource('src/content/applications.ts'), ...notesFromSource('src/content/deliverables.ts'), ...ALLOWLIST_EXTRA.map((x) => x.text)]
  .flatMap((t) => [normalise(t), ...sentencesOf(t)])
  .filter(Boolean);
const isAllowed = (run) => allowed.some((a) => a.includes(run));

const shingles = new Map(); // 7-word window -> Set of block keys that contain it
const blockInfo = new Map(); // block key -> { page, heading }
const sentenceList = []; // { key, words }
let blockCount = 0;
for (const [path, { html }] of pages) {
  mainBlocks(html).forEach((b, i) => {
    const bk = `${path}\u0000${i}`;
    blockInfo.set(bk, { page: path, heading: b.heading });
    blockCount++;
    for (const sentence of sentencesOf(b.text)) {
      const words = sentence.split(' ');
      sentenceList.push({ bk, words });
      for (let w = 0; w + MIN_DUPE_WORDS <= words.length; w++) {
        const sh = words.slice(w, w + MIN_DUPE_WORDS).join(' ');
        if (!shingles.has(sh)) shingles.set(sh, new Set());
        shingles.get(sh).add(bk);
      }
    }
  });
}
// Merge overlapping repeated windows into maximal runs, then group identical runs.
const runs = new Map(); // run text -> Set of block keys
for (const { bk, words } of sentenceList) {
  let start = -1;
  const close = (end) => {
    if (start < 0) return;
    const run = words.slice(start, end + MIN_DUPE_WORDS).join(' ');
    if (!runs.has(run)) runs.set(run, new Set());
    runs.get(run).add(bk);
    start = -1;
  };
  let last = -2;
  for (let w = 0; w + MIN_DUPE_WORDS <= words.length; w++) {
    const places = shingles.get(words.slice(w, w + MIN_DUPE_WORDS).join(' '));
    if (places.size > 1) {
      if (start < 0) start = w;
      last = w;
    } else if (start >= 0) {
      close(last);
    }
  }
  close(last);
}
let dupeCount = 0;
const where = (bk) => `${blockInfo.get(bk).page}${blockInfo.get(bk).heading ? ` [${blockInfo.get(bk).heading}]` : ''}`;
for (const [run] of runs) {
  if (isAllowed(run)) continue;
  // all blocks containing this run text, including blocks where it is part of a longer run
  const holders = new Set();
  for (const { bk, words } of sentenceList) {
    if ((' ' + words.join(' ') + ' ').includes(' ' + run + ' ')) holders.add(bk);
  }
  if (holders.size < 2) continue;
  dupeCount++;
  const list = [...holders].map(where);
  const n = run.split(' ').length;
  fail(list[0].split(' ')[0], `repeated ${n}-word text "${run.length > 90 ? run.slice(0, 87) + '...' : run}" in ${list.length} places: ${list.join('; ')}`);
}

// ---- sitemap and robots ----------------------------------------------------
const sitemapFile = join(DIST, 'sitemap-0.xml');
let sitemapCount = 0;
if (!existsSync(sitemapFile)) {
  fail('sitemap-0.xml', 'missing from dist');
} else {
  const locs = [...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1]);
  sitemapCount = locs.length;
  const paths = new Set(
    locs.map((l) => {
      try {
        return new URL(l).pathname;
      } catch {
        return l;
      }
    }),
  );
  for (const p of SITEMAP_PAGES) {
    if (!paths.has(p)) fail('sitemap-0.xml', `missing page ${p}`);
  }
}
if (!existsSync(join(DIST, 'sitemap-index.xml'))) fail('sitemap-index.xml', 'missing from dist');
const robotsFile = join(DIST, 'robots.txt');
if (!existsSync(robotsFile)) fail('robots.txt', 'missing from dist');
else if (!/^Sitemap:\s*\S+sitemap-index\.xml/im.test(readFileSync(robotsFile, 'utf8'))) {
  fail('robots.txt', 'no Sitemap line pointing at sitemap-index.xml');
}

// ---- report ----------------------------------------------------------------
console.log('Drishti Geo link and structure check');
console.log('-'.repeat(52));
for (const p of EXPECTED_PAGES) {
  console.log(`  ${pages.has(p) ? 'ok     ' : 'MISSING'} ${p.padEnd(16)} ${pages.get(p)?.rel ?? ''}`);
}
if (extraPages.length) console.log(`  note: unexpected extra pages: ${extraPages.join(', ')}`);
console.log('-'.repeat(52));
console.log(`pages scanned      ${pages.size}`);
console.log(`internal links     ${internalCount} (${anchorCount} with #anchor)`);
console.log(`mailto links       ${mailtoCount}`);
console.log(`services           ${serviceIds.length} ids (expected ${EXPECTED_COUNTS.services})`);
console.log(`applications       ${appIds.length} ids (expected ${EXPECTED_COUNTS.applications})`);
console.log(`deliverables       ${deliverableIds.length} ids (expected ${EXPECTED_COUNTS.deliverables})`);
console.log(`text blocks        ${blockCount} in <main>; repeated ${MIN_DUPE_WORDS}+ word runs: ${dupeCount}`);
console.log(`sitemap URLs       ${sitemapCount}`);
console.log(`web3forms key      ${key ? 'set' : 'not set'}; <form> elements in dist: ${formCount}`);
console.log(`external links     ${externals.size} (listed, not fetched)`);
for (const [url, from] of [...externals].sort()) {
  console.log(`  - ${url}  [${[...from].join(', ')}]`);
}
console.log('-'.repeat(52));

if (failures.length) {
  console.log(`FAIL  ${failures.length} problem(s)`);
  for (const f of failures) console.log(`  x ${f.page}: ${f.msg}`);
  process.exit(1);
}
console.log('PASS  all checks passed');
