# StanTube private accounts — gated rollout

**Status:** Implementation prepared on PR #193. User authorization covers adding secure login, private account libraries, and TV linking. This file intentionally includes **no live credentials, database IDs, user email addresses, or copied user videos**.

## Architecture
- Public: `/stantube/`, original Artist Universe videos, index pages. Never gate or move these.
- Private: `/api/stantube/*` executed by `stannet-dev-portal` Worker (no cache). Requires **new dedicated** D1 binding `STANTUBE_DB` and Google OAuth configuration. Do **not** repurpose the B1 sandbox D1 (`DEV_DB`) or authorization sandbox.
- OAuth2 code flow with PKCE, exact redirect/state cookie/nonce verification, cryptographically validated Google RS256 ID token against Google JWKS, restricted client ID and verified email, HttpOnly Secure SameSite=Lax short-lived sessions. Optional owner email allowlist `STANTUBE_ALLOWED_EMAILS`.
- Per-user D1 library scoped by Google subject (`sub`); optimistic revision check; CSRF origin and custom header; bounded personal data; validation of video IDs; no public KV/localStorage source of truth.
- TV: unauthenticated guest requests a short-lived 8-digit code on the television; a signed-in computer/mobile authorizes it. Device keeps a 256-bit secret and claims a one-use session cookie. No password on TV.
- Legacy videos: kept inaccessible to guests, *explicitly* imported after sign-in, only deleted from old browser storage after confirmed server persistence.
- If D1 / OAuth credentials are not provisioned, `GET /api/stantube/session` responds `{authenticated:false,ready:false}` and private writes fail with HTTP 503. The public media experience remains available.

## Required provider setup (operator — never paste secrets into chat)
1. Check Cloudflare free-plan D1 capacity and current billing before any resource creation. Create a **new** D1 database with a distinct name, for example `stannet-stantube-private`.
2. Apply `apps/dev-b1/devtube/private-schema.sql` to the new D1. Verify users/library tables exist but do not create dummy user accounts. Example commands after confirming quota and selecting the correct Cloudflare account:
   ```sh
   npx wrangler d1 create stannet-stantube-private
   npx wrangler d1 execute stannet-stantube-private --remote --file=apps/dev-b1/devtube/private-schema.sql
   ```
3. Add the actual D1 UUID returned by Cloudflare **only after checking it** to *all three* Dev portal configs (`apps/dev-b1/portal-domain.jsonc`, `portal-worker.jsonc`, `portal-preview.jsonc`) using:
   ```json
   "d1_databases": [{"binding":"STANTUBE_DB","database_name":"stannet-stantube-private","database_id":"<UUID PROVIDED BY CLOUDFLARE>"}]
   ```
   Do not guess or reuse the old B1 data store. Candidate and production must target the same intended *new* database if QA includes account state. Check rollback.
4. Google Cloud Console → APIs & Services → Credentials → create **OAuth client ID: Web application** (this is **not** the YouTube Data API key). Authorized redirect URI exactly `https://stannet.dev/api/stantube/callback`. Configure OAuth consent and test/approved users. Set separate Cloudflare Worker secrets `STANTUBE_GOOGLE_CLIENT_ID` and `STANTUBE_GOOGLE_CLIENT_SECRET`; optional secret `STANTUBE_ALLOWED_EMAILS` if you want to restrict sign-in to one or a few specified email addresses.
5. Redeploy the protected Dev portal with the D1 binding. Verify:
   - Public catalog works as guest; `GET /api/stantube/session` reports `ready:true`.
   - Unauthenticated library GET returns 401 and does not leak any user IDs.
   - OAuth2 callback creates a secure cookie and redirects back to StanTube.
   - A second Google account cannot read or alter the owner's videos.
   - Add + move + delete, queue + favorites + history persist across browsers; concurrent modifications respond 409, never silently overwrite.
   - TV pair codes expire and are single-use; Google account owner approves from already-logged-in PC.
6. Only after live QA, enable the sign-in UI. Until then do **not** claim login or sync is working.

## Current limitations
- User must create OAuth credentials and the D1 resource with permission and plan awareness before login is usable.
- Sync merges are revision-checked; if edited concurrently, client warns and asks to refresh rather than overwriting.
- Browser-local legacy clips are deliberately hidden from guests. Their raw old storage still exists on that original browser until explicitly imported, so shared devices should use private profiles or clear browser data after migration.
- TV browser compatibility of Google's native sign-in is variable; the pairing flow avoids typing credentials on the television.
- This design synchronizes *metadata and links*, not downloaded YouTube video files. Playback respects YouTube embedding rights and official player policies.

## Security notes
- Never deploy secrets as assets, GitHub variables in plaintext, query parameters or logs.
- Never enable public schema auto-migration as a side effect of a GET request.
- Review D1 backups, rate limiting, account/session revocation, cookie/security headers and recovery before production activation.
- All private endpoints must remain fail-closed if database, OAuth provider, or session validation is unavailable.
