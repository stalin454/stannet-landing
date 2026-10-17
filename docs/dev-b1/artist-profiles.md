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
