# Delivery summary

Status: **implemented locally and verified; not deployed.** Live delivery, indexing and rankings are not verified.

## Built

- Static multi-page site (Vite MPA). Every page's text is in the HTML, so it is indexable without JavaScript; the piano mounts into a reserved slot.
- 12 indexable pages: `/`, `/piano-keys/`, `/computer-keyboard-piano/`, `/songs/` + 6 song pages, `/about/`, `/privacy/`; plus a noindex `404.html`.
- Per page: unique title (≤ 62 chars) and description (110–165), canonical, Open Graph/Twitter image, breadcrumbs, one H1.
- JSON-LD: WebSite + WebApplication (home), WebPage + BreadcrumbList (all), MusicComposition (songs). No ratings or reviews were invented.
- `sitemap.xml`, `robots.txt` (with Sitemap line), favicon set, web manifest, 1200×630 share image.
- Owner Markdown profile: a `.md` copy of every page, `/sitemap.md`, `/llms.txt`, navigation comments in robots.txt and sitemap.xml, `<link rel="alternate" type="text/markdown">`. These are content copies, not a ranking or crawler control.
- Performance: fonts and samples self-hosted (no third-party requests), samples load only on "Start playing", CLS 0.0000 at 1440/1024/390/360 px.
- Tool fixes for a content site: keyboard input only while the piano is on screen (Space scrolls the page otherwise); keys mapped by physical position so AZERTY/QWERTZ work.

## Verified (2026-10-19, local preview, headless Chromium)

- `npm test`: 14 unit tests pass (notes, songs fit the computer keys and bar lengths, demo stop).
- `npm run check`: titles, descriptions, canonicals, single H1, JSON-LD parses, all internal links and Markdown copies resolve, sitemap/robots present.
- Browser: no console errors, no failed or external requests on any page; chords, out-of-view keyboard, song guide (advances only on the right note), Listen/Stop all behave.

## Not done / needs the owner

1. Deploy `dist/` (or connect the repo to Netlify with base directory `virtual-piano`).
2. Add the site to Google Search Console and Bing Webmaster Tools and submit `sitemap.xml`.
3. Strongly consider a custom domain before building links; moving later needs redirects. If the URL changes, rebuild with `SITE_URL=https://your-domain npm run build`.
4. Check after deploy: `/*.md` served as `text/markdown`, `404.html` served for unknown URLs, share preview via a card validator.
5. Off-site work for the head terms (see keyword-map.md).

## Sponsor (2026-10-19)

- Every page credits the sponsor in the footer: "Sponsored and provided for free by Pianoers.com"; also the About page, home FAQ and privacy page, and JSON-LD (`sponsor` → Organization).
- **Owner decision:** links to https://pianoers.com/ are plain followed links (no `nofollow` / `sponsored`). Recorded risk: Google's spam policies treat paid or sponsored links that pass ranking credit as link schemes; possible outcomes are the links being ignored or a manual action against either site. `npm run check` enforces the owner's choice (credit present, link followed).

## Layout (2026-10-19)

- Pages with a piano open with the piano filling the first screen, edge to edge; the title sits top-left and the content follows below. Measured: the piano ends at the bottom of the viewport at 1280×720, 1440×900 and 1920×1080; CLS 0 at all tested sizes. On phones the controls wrap, so the piano section runs slightly taller than one screen.
