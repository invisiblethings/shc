// Checks the built site in dist/ for SEO and link problems. Exits non-zero on failure.
//   npm run build && npm run check

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PAGES, SITE } from "../content/pages.js";

const DIST = new URL("../dist/", import.meta.url).pathname;
const problems = [];
const fail = (page, msg) => problems.push(`${page}: ${msg}`);
const resolve = (href) => {
  const path = href.split("#")[0].split("?")[0];
  if (path.endsWith("/")) return join(DIST, path, "index.html");
  return join(DIST, path);
};

const titles = new Map();
const descriptions = new Map();
for (const page of PAGES) {
  const file = resolve(page.path);
  if (!existsSync(file)) {
    fail(page.path, "missing HTML file");
    continue;
  }
  const html = readFileSync(file, "utf8");
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  const h1s = html.match(/<h1[\s>]/g) ?? [];

  if (title.length < 20 || title.length > 65) fail(page.path, `title length ${title.length}: "${title}"`);
  if (desc.length < 110 || desc.length > 165) fail(page.path, `description length ${desc.length}`);
  if (titles.has(title)) fail(page.path, `duplicate title with ${titles.get(title)}`);
  if (descriptions.has(desc)) fail(page.path, `duplicate description with ${descriptions.get(desc)}`);
  titles.set(title, page.path);
  descriptions.set(desc, page.path);
  if (canonical !== SITE.url + page.path) fail(page.path, `canonical ${canonical}`);
  if (h1s.length !== 1) fail(page.path, `${h1s.length} h1 elements`);
  if (!/<html lang="en">/.test(html)) fail(page.path, "missing lang");
  if (/fonts\.googleapis|fonts\.gstatic/.test(html)) fail(page.path, "loads third-party fonts");
  if (!html.includes(`Sponsored and provided for free by <a href="${SITE.sponsor.url}">`)) fail(page.path, "missing sponsor credit");
  // The owner wants the sponsor links followed: no nofollow / sponsored / ugc.
  for (const [, attrs] of html.matchAll(/<a href="https?:\/\/(?:www\.)?pianoers\.com[^"]*"([^>]*)>/g)) {
    if (/nofollow|sponsored|ugc/.test(attrs)) fail(page.path, "sponsor link is not followed");
  }

  for (const block of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(block[1]);
    } catch {
      fail(page.path, "invalid JSON-LD");
    }
  }
  for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (!existsSync(resolve(href))) fail(page.path, `broken link ${href}`);
  }
  const md = page.path === "/" ? "index.md" : `${page.path.slice(1, -1)}.md`;
  if (!existsSync(join(DIST, md))) fail(page.path, `missing Markdown copy ${md}`);
}

for (const f of ["robots.txt", "sitemap.xml", "sitemap.md", "llms.txt", "404.html", "favicon.svg", "og-image.png", "site.webmanifest"]) {
  if (!existsSync(join(DIST, f))) fail("/", `missing ${f}`);
}
const sitemap = readFileSync(join(DIST, "sitemap.xml"), "utf8");
for (const page of PAGES) if (!sitemap.includes(`<loc>${SITE.url}${page.path}</loc>`)) fail(page.path, "not in sitemap.xml");
if (!/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(readFileSync(join(DIST, "robots.txt"), "utf8"))) fail("/robots.txt", "no Sitemap line");
if (!readFileSync(join(DIST, "404.html"), "utf8").includes('name="robots" content="noindex"')) fail("/404.html", "not noindex");
for (const [, link] of readFileSync(join(DIST, "sitemap.md"), "utf8").matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
  if (!existsSync(resolve(link.replace(SITE.url, "")))) fail("/sitemap.md", `dead link ${link}`);
}

if (problems.length) {
  console.error(`check-site: ${problems.length} problem(s)\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`check-site: ${PAGES.length} pages OK (titles, descriptions, canonicals, h1, JSON-LD, links, sponsor credit, Markdown copies, sitemap, robots)`);
