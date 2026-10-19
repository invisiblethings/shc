// Static site generator for the Nocturne pages.
//
//   node scripts/site.mjs pages   -> writes the HTML entry pages Vite builds from
//   node scripts/site.mjs post    -> after `vite build`: Markdown copies, sitemaps,
//                                    robots.txt and llms.txt in dist/
//
// Content lives in content/pages.js; this file only renders it.

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NAV, PAGES, SITE, keyChartRows, melodyPhrases, octaveRows } from "../content/pages.js";
import { SONGS } from "../src/data/songs.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
export const GENERATED = ["index.html", "404.html", "piano-keys", "computer-keyboard-piano", "songs", "about", "privacy"];

const abs = (path) => SITE.url + path;
const mdPath = (path) => (path === "/" ? "/index.md" : `${path.replace(/\/$/, "")}.md`);
const htmlFile = (path) => (path === "/" ? "index.html" : join(path.slice(1), "index.html"));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

// Sponsor links are paid placements: Google asks for rel="sponsored".
const linkRel = (href) =>
  href.startsWith(SITE.sponsor.url) ? ' rel="sponsored noopener"' : /^https?:/.test(href) ? ' rel="noopener"' : "";

/** Inline Markdown subset -> HTML. */
function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, href) => `<a href="${href}"${linkRel(href)}>${label}</a>`);
}
/** Inline Markdown for the .md copies: make site links absolute. */
const mdInline = (text) => text.replace(/\]\((\/[^)]*)\)/g, (_, p) => `](${abs(p)})`);
const plain = (text) => text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1").replace(/\[(.+?)\]\(.+?\)/g, "$1");

function songItems(exclude) {
  return SONGS.filter((s) => s.slug !== exclude);
}

// ---------------- HTML ----------------

function blockHtml(b) {
  switch (b.type) {
    case "h2":
      return `<h2 id="${slugify(b.text)}">${inline(b.text)}</h2>`;
    case "h3":
      return `<h3>${inline(b.text)}</h3>`;
    case "p":
      return `<p>${inline(b.text)}</p>`;
    case "ul":
    case "ol":
      return `<${b.type}>${b.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${b.type}>`;
    case "cards":
      return `<div class="cards">${b.items
        .map((c) => `<article class="card"><h3>${inline(c.title)}</h3><p>${inline(c.text)}</p></article>`)
        .join("")}</div>`;
    case "faq":
      return `<div class="faq">${b.items
        .map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${inline(f.q)}</summary><p>${inline(f.a)}</p></details>`)
        .join("")}</div>`;
    case "songs":
      return `<ul class="song-grid">${songItems(b.exclude)
        .map((s) => `<li><a href="/songs/${s.slug}/"><strong>${esc(s.title)}</strong><span>${esc(s.level)} · ${esc(s.composer.split(" (")[0])}</span></a></li>`)
        .join("")}</ul>`;
    case "keychart":
      return table(["Computer key", "Piano note", "Key"], keyChartRows());
    case "octave":
      return table(["Note", "Key", "Frequency"], octaveRows());
    case "melody":
      return `<div class="melody">${melodyPhrases(b.song)
        .map(
          (phrase, i) =>
            `<ol class="phrase" aria-label="Line ${i + 1}">${phrase
              .map((n) => `<li${n.beats >= 2 ? ' class="long"' : ""}><b>${esc(n.note)}</b><kbd>${esc(n.key)}</kbd></li>`)
              .join("")}</ol>`,
        )
        .join("")}</div><p class="muted">Each box is one note: the letter name on top, the computer key below. Wider boxes are held longer.</p>`;
    default:
      throw new Error(`Unknown block type ${b.type}`);
  }
}

const table = (head, rows) =>
  `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;

function crumbs(page) {
  const chain = [{ name: "Virtual Piano", path: "/" }];
  if (page.parent) chain.push({ name: page.parent.nav, path: page.parent.path });
  if (page.path !== "/") chain.push({ name: page.song ? page.song.title : page.nav, path: page.path });
  return chain;
}

function jsonLd(page) {
  const graph = [];
  const pageNode = {
    "@type": "WebPage",
    "@id": `${abs(page.path)}#webpage`,
    url: abs(page.path),
    name: page.title,
    description: page.description,
    inLanguage: SITE.locale,
    isPartOf: { "@id": `${SITE.url}/#website` },
  };
  graph.push(pageNode);
  if (page.path === "/") {
    graph.push({
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: SITE.name,
      alternateName: "Nocturne Virtual Piano",
      inLanguage: SITE.locale,
      sponsor: { "@id": `${SITE.sponsor.url}#organization` },
    });
    graph.push({ "@type": "Organization", "@id": `${SITE.sponsor.url}#organization`, name: SITE.sponsor.name, url: SITE.sponsor.url });
    graph.push({
      "@type": "WebApplication",
      "@id": `${SITE.url}/#app`,
      name: "Nocturne Virtual Piano",
      url: `${SITE.url}/`,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires JavaScript and the Web Audio API",
      isAccessibleForFree: true,
      sponsor: { "@id": `${SITE.sponsor.url}#organization` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "88-key piano keyboard",
        "Sampled Yamaha C5 grand piano sound",
        "Play with a computer keyboard, mouse or touch screen",
        "Sustain pedal",
        "MIDI keyboard input",
        "Guided song lessons",
      ],
    });
    pageNode.mainEntity = { "@id": `${SITE.url}/#app` };
  } else {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs(page).map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })),
    });
  }
  if (page.song) {
    const node = { "@type": "MusicComposition", name: page.song.title, url: abs(page.path) };
    if (page.song.composers.length) node.composer = page.song.composers.map((name) => ({ "@type": "Person", name }));
    graph.push(node);
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function layout(page, { noindex = false } = {}) {
  const url = abs(page.path);
  const navCurrent = page.parent ? page.parent.path : page.path;
  const pianoAttrs = page.piano
    ? Object.entries({ labels: page.piano.labels, song: page.piano.song, base: page.piano.base, demo: page.piano.demo })
        .filter(([, v]) => v !== undefined && v !== false)
        .map(([k, v]) => ` data-${k}="${esc(v)}"`)
        .join("")
    : "";
  const crumbNav =
    page.path === "/" || noindex
      ? ""
      : `<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs(page)
          .map((c, i, all) => (i === all.length - 1 ? `<li aria-current="page">${esc(c.name)}</li>` : `<li><a href="${c.path}">${esc(c.name)}</a></li>`))
          .join("")}</ol></nav>`;

  return `<!doctype html>
<html lang="${SITE.locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}" />
${noindex ? '<meta name="robots" content="noindex" />' : `<meta name="robots" content="index, follow, max-image-preview:large" />
<link rel="canonical" href="${url}" />
<link rel="alternate" type="text/markdown" href="${abs(mdPath(page.path))}" title="Markdown version" />`}
<meta name="theme-color" content="#07070b" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${SITE.name}" />
<meta property="og:title" content="${esc(page.title)}" />
<meta property="og:description" content="${esc(page.description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE.url}/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="The Nocturne virtual piano: a glowing 88-key grand piano keyboard" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<link rel="preload" href="/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/cormorant.woff2" as="font" type="font/woff2" crossorigin />
${noindex ? "" : `<script type="application/ld+json">${jsonLd(page)}</script>`}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="wrap">
<header class="site-head">
<a class="logo" href="/" aria-label="Nocturne virtual piano, home">Noc<em>turne</em></a>
<nav class="site-nav" aria-label="Main">${NAV.map((n) => `<a href="${n.path}"${n.path === navCurrent ? ' aria-current="page"' : ""}>${esc(n.nav)}</a>`).join("")}</nav>
</header>
<main id="main">
${crumbNav}
<header class="hero">
<h1>${esc(page.h1)}</h1>
<p class="lede">${inline(page.lede)}</p>
</header>
${
  page.piano
    ? `<div class="piano-slot${page.piano.song ? " has-song" : ""}" data-piano${pianoAttrs}>
<div class="piano-fallback"><noscript><p>Turn on JavaScript to play the piano.</p></noscript><div class="fake-keys" aria-hidden="true"></div></div>
</div>`
    : ""
}
<div class="content"><article class="prose">
${page.blocks.map(blockHtml).join("\n")}
</article></div>
</main>
<footer class="site-foot">
<nav aria-label="Footer">${[...NAV, PAGES.find((p) => p.id === "privacy")]
    .map((n) => `<a href="${n.path}">${esc(n.nav === "Piano" ? "Virtual piano" : n.nav)}</a>`)
    .join("")}</nav>
<p class="sponsor">Sponsored and provided for free by <a href="${SITE.sponsor.url}" rel="sponsored noopener">${SITE.sponsor.name}</a></p>
<p>Nocturne is a free virtual piano you can play online with your computer keyboard, mouse or touch screen.</p>
<p>Piano sound: Salamander Grand Piano V3 by Alexander Holm, <a href="https://creativecommons.org/licenses/by/3.0/" rel="noopener">CC BY 3.0</a>.</p>
</footer>
</div>
<script type="module" src="/src/main.jsx"></script>
</body>
</html>
`;
}

const notFound = {
  id: "404",
  path: "/404.html",
  title: "Page not found | Nocturne",
  description: "This page does not exist.",
  h1: "This page has gone quiet",
  lede: "We couldn't find that page. The [virtual piano](/) is still here, though.",
  blocks: [
    { type: "ul", items: ["[Play the virtual piano](/)", "[Piano keys chart](/piano-keys/)", "[Computer keyboard controls](/computer-keyboard-piano/)", "[Easy songs](/songs/)"] },
  ],
};

function writePages() {
  for (const g of GENERATED) rmSync(join(ROOT, g), { recursive: true, force: true });
  for (const page of PAGES) {
    const file = join(ROOT, htmlFile(page.path));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, layout(page));
  }
  writeFileSync(join(ROOT, "404.html"), layout(notFound, { noindex: true }));
  console.log(`site: wrote ${PAGES.length} pages + 404`);
}

// ---------------- Markdown & discovery files ----------------

function blockMd(b) {
  switch (b.type) {
    case "h2":
      return `## ${b.text}`;
    case "h3":
      return `### ${b.text}`;
    case "p":
      return mdInline(b.text);
    case "ul":
      return b.items.map((i) => `- ${mdInline(i)}`).join("\n");
    case "ol":
      return b.items.map((i, n) => `${n + 1}. ${mdInline(i)}`).join("\n");
    case "cards":
      return b.items.map((c) => `- **${c.title}.** ${mdInline(c.text)}`).join("\n");
    case "faq":
      return b.items.map((f) => `### ${plain(f.q)}\n\n${mdInline(f.a)}`).join("\n\n");
    case "songs":
      return songItems(b.exclude)
        .map((s) => `- [${s.title}](${abs(`/songs/${s.slug}/`)}) — ${s.level}, ${s.composer.split(" (")[0]}`)
        .join("\n");
    case "keychart":
      return mdTable(["Computer key", "Piano note", "Key"], keyChartRows());
    case "octave":
      return mdTable(["Note", "Key", "Frequency"], octaveRows());
    case "melody":
      return (
        "Each note is written as its letter name with the computer key in brackets. Notes held for two beats or more are marked with a dash.\n\n" +
        melodyPhrases(b.song)
          .map((phrase, i) => `${i + 1}. ${phrase.map((n) => `${n.note} (${n.key})${n.beats >= 2 ? " –" : ""}`).join("  ")}`)
          .join("\n")
      );
    default:
      throw new Error(`Unknown block type ${b.type}`);
  }
}

const mdTable = (head, rows) =>
  [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");

function pageMd(page, updated) {
  return `# ${page.h1}

> ${plain(page.lede)}

Web page: ${abs(page.path)} · Last updated: ${updated}
${page.piano ? "\nThe web page has a playable piano above this text; it needs a browser with JavaScript.\n" : ""}
${page.blocks.map(blockMd).join("\n\n")}
`;
}

function lastUpdated() {
  try {
    return execSync("git log -1 --format=%cs -- content src/data", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim() || today();
  } catch {
    return today();
  }
}
const today = () => new Date().toISOString().slice(0, 10);

function writePost() {
  const updated = lastUpdated();
  for (const page of PAGES) {
    const file = join(DIST, mdPath(page.path).slice(1));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, pageMd(page, updated));
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Readers and LLMs: a Markdown version of every page is listed in ${SITE.url}/sitemap.md -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${abs(p.path)}</loc><lastmod>${updated}</lastmod></url>`).join("\n")}
</urlset>
`;
  writeFileSync(join(DIST, "sitemap.xml"), sitemapXml);

  const group = (pages) => pages.map((p) => `- [${p.h1}](${abs(mdPath(p.path))}) — web page: ${abs(p.path)}`).join("\n");
  const main = PAGES.filter((p) => !p.song && !["about", "privacy"].includes(p.id));
  const songs = PAGES.filter((p) => p.song);
  const info = PAGES.filter((p) => ["about", "privacy"].includes(p.id));

  writeFileSync(
    join(DIST, "sitemap.md"),
    `# ${SITE.name} — site map

Every page of ${SITE.url} with its Markdown version. Last updated: ${updated}.

## Piano

${group(main)}

## Songs

${group(songs)}

## About

${group(info)}
`,
  );

  writeFileSync(
    join(DIST, "llms.txt"),
    `# ${SITE.name}

> ${SITE.name} is a free virtual piano at ${SITE.url}/: an 88-key online piano keyboard with a sampled concert grand sound, playable with a computer keyboard, mouse, touch screen or MIDI keyboard.

Nocturne is sponsored and provided for free by ${SITE.sponsor.name} (${SITE.sponsor.url}).

If you are an LLM looking for answers about this site, read the Markdown map at ${SITE.url}/sitemap.md, which links a Markdown version of every page. The key chart for playing the online piano with a computer keyboard is at ${SITE.url}/computer-keyboard-piano.md.

## Pages

${main.map((p) => `- [${p.h1}](${abs(mdPath(p.path))}): ${p.description}`).join("\n")}

## Songs

${songs.map((p) => `- [${p.song.title}](${abs(mdPath(p.path))}): letter notes and computer keys for ${p.song.title}.`).join("\n")}

## Optional

${info.map((p) => `- [${p.h1}](${abs(mdPath(p.path))}): ${p.description}`).join("\n")}
`,
  );

  writeFileSync(
    join(DIST, "robots.txt"),
    `# ${SITE.name} — free virtual piano
# A Markdown map of every page is at ${SITE.url}/sitemap.md (overview: ${SITE.url}/llms.txt)
User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap.xml
`,
  );
  console.log(`site: wrote ${PAGES.length} Markdown pages, sitemap.xml, sitemap.md, llms.txt, robots.txt`);
}

const cmd = process.argv[2];
if (cmd === "pages") writePages();
else if (cmd === "post") writePost();
else if (cmd) throw new Error(`Unknown command ${cmd}`);
