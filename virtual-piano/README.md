# Nocturne — virtual piano site

A free online piano (88 keys, Salamander Grand Piano samples) and its SEO site.

```bash
npm install
npm run dev      # local site with the piano
npm test         # unit tests
npm run build    # generate pages, build to dist/, write Markdown copies, sitemap, robots, llms.txt
npm run check    # SEO and link checks on dist/
```

- Page content: `content/pages.js` (one source for HTML and Markdown).
- Page renderer: `scripts/site.mjs`. Generated HTML files in this folder are git-ignored.
- Piano widget: `src/Piano.jsx`; songs: `src/data/songs.js`.
- Site URL: set `SITE_URL` when building for another domain.
- SEO notes (private): `seo/`.
