# Astrid Nova & STAN6IX · official artist profiles (StanNet Dev)

## Scope and isolation

The branch `feat/stannet-dev-artists-seo-20261017` is based on `feat/stannet-dev-open-learning-20261015` (source preserved as a restore baseline). **Do not merge or deploy to Space/main without owner review.**

Public canonical routes (after the Dev build is released):
- https://stannet.dev/artistas/astrid-nova/
- https://stannet.dev/artistas/stan6ix/

The existing `/open/artists/` profile hub and its seven approved virtual character photos are preserved. The StanNet.Space source and production are unchanged.

## Features

- Original encyclopedic-style artist bios with explicit `virtual/fictional` disclosure, English primary text and Spanish summaries.
- Existing authorized portraits: Astrid (1), and Zay, Kai, Juno, Ace, Noah, Arjun (6).
- Mobile-first layout, keyboard accessible navigation, photo gallery and separate identity facts panel.
- Crawlable HTML title, meta description, canonical, Open Graph, social cover, MusicGroup JSON-LD and links from the homepage and artist hub.
- Addition of both pages to `sitemap.xml`, and `robots.txt` remains public.
- Video library: a verified YouTube ID is validated when building HTML; video players use `youtube-nocookie.com` and **only load after a direct Play click**. Valid published videos receive their own VideoObject JSON-LD.

## How to publish a video

The isolated Dev portal is static and intentionally has no public upload endpoint. **Do not create a public uploader without authenticated admin access, CSRF protection, storage limits, media validation and rate limiting.** An HTML file input alone is not a secure uploader and does not publish a remote video.

1. Upload the official video to the owner's YouTube channel (@StanNetSpace).
2. Copy its **real** YouTube URL and extract its 11-character video ID (the `v` value, e.g. from `watch?v=...`; never invent an ID).
3. Edit `apps/dev-b1/artist-videos.json` on this Dev branch or another carefully reviewed Dev feature branch. Add entries to the relevant list:

```json
{
  "astrid-nova": [
    {
      "youtubeId": "REPLACE_WITH_REAL_11_CHAR_ID",
      "title": "ASTRID NOVA – LOUDER THAN FEAR (Official Music Video)",
      "description": "Official music video by Astrid Nova, StanNet Music.",
      "uploadDate": "2026-10-17"
    }
  ],
  "stan6ix": []
}
```

4. Rebuild with `node apps/dev-b1/build-portal.mjs`, check browser and metadata tests, then use the Dev-only review/release process.
5. Do not claim videos or songs are uploaded to the site before confirmed URLs exist.

A future admin-backed direct MP4 upload would require a secured Cloudflare R2 bucket (or another approved media service), signed uploads, access control, an audit log, content moderation and a database/media manifest. No Dev media-upload endpoint is enabled by this branch.

## SEO publication checklist

After the owner authorizes a **Dev-only** release, verify HTTP 200 and canonical URLs on both pages, the actual image responses, JSON-LD, `/sitemap.xml`, and video loads at 320, 390 and 1280 px. Then verify DNS and use Google Search Console to submit the sitemap and request indexing. Indexing and Google ranking cannot be guaranteed.

## Tests (on a checkout with Node 24 and browser dependencies)

```bash
node apps/dev-b1/build-portal.mjs
npm test
# Serve apps/dev-b1/site-build locally, then run the existing portal-browser.cjs suite with Chromium
```

Existing release workflows are gated to explicitly named branches; this feature branch is **not authorized for automatic deployment**. The user must separately authorize the Dev release after reviewing the PR.

## Final release preparation — 2026-10-17

The owner explicitly authorized implementation, tests and deployment solely to Dev. No merge to main is authorized. Original source restoration point: `d909e7ba4fa00afdf40eff0795b05b65fc42a244`; verified local Git bundle `artists-pre-final.bundle`.

Hero source: Library original `Portal Cósmico de Luz Dorada.png` (`libfile_68ff2413dcac8191a59eb17fbf36a9ce`), 1672 × 941. Converted without creative changes to WebP quality 88, 282786 bytes. Text is real HTML.

YouTube oEmbed verified both IDs, titles, and author StanNet / @StanNetSpace. No upload dates asserted. VideoObject rich results remain omitted until upload dates are verified. Artist identity schema and canonical metadata are included.

A separate staging Worker `stannet-dev-artists-preview` is necessary because updating the already bound `stannet-dev-portal` also updates stannet.dev immediately. The release pipeline tests the preview first, checks root ownership/DNS read-only, then deploys the same build to the existing Dev portal. It snapshots and compares Space/academy deployment IDs and retains a Dev rollback snapshot as an Actions artifact. No database migrations or writes are included.

### Google Search Console pending owner access

Open Google Search Console using the owner's account, select the existing stannet.dev property or add a URL-prefix property `https://stannet.dev/`. For URL-prefix verification, provide Google's exact HTML verification filename/content or meta tag; do not invent a token. Domain-property verification requires an owner-managed DNS TXT record. No DNS changes are included in this release. After verification submit `https://stannet.dev/sitemap.xml` and inspect both artist URLs to request indexing. Google controls indexing and ranking.
