# Keyword map

Date: 2026-10-19. Evidence: owner's target list; US web search results for "virtual piano online", "online piano using computer keyboard" and "piano keys online" on 2026-10-19. No Search Console, volume or ranking data was available, so volumes are not stated.

## What the results showed (observed)

- Intent is to **play immediately in the browser**. Ranking pages are tools (virtualpiano.net, Mixbutton, Violet Recording, Multiplayer Piano), plus listicles.
- Tool pages that rank explain **which computer key plays which note**; mappings differ between sites, so a clear key chart is useful.
- Competitors add songs/sheets, sustain, MIDI and recording. Many results for "piano keys online" were thin or spam pages.

## One owner page per query family (decision)

| Query family | Owner page | Notes |
| --- | --- | --- |
| virtual piano, online piano, online playable piano, virtual piano keyboard, interactive piano keyboard, online piano board | `/` | Head terms. The tool is the first thing on the page; supporting text covers features, how-to and FAQ. Synonyms used once each, naturally. |
| online piano using keyboard (computer keyboard piano, piano keyboard keys chart) | `/computer-keyboard-piano/` | Full key chart table, octave shift, chords, AZERTY/QWERTZ, key ghosting. |
| piano keys online (piano key names, middle C, how many keys) | `/piano-keys/` | Piano with every key labelled; naming, octaves, frequencies table. |
| easy piano songs online, "<song> piano notes" | `/songs/` and `/songs/<song>/` | Six public-domain songs with letter notes, keys, listen and guided play. Long-tail support for the head terms. |

Cannibalization guard: subpages link to `/` with "virtual piano" anchors; `/` links to subpages with their own query as anchor text. Titles and H1s are unique per page (enforced by `npm run check`).

## Head-term leadership track

"virtual piano" and "online piano" are owned by long-established domains. A new `*.netlify.app` subdomain will not win these on on-page work alone. Needed over time: a custom domain, real links and mentions (music-teacher resource lists, Reddit/forums, Product Hunt-style launches), and steady usage. Nearer-term wins are more likely on the song and key-chart long tail.
