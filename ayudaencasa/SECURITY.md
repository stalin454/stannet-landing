# Security baseline — AyudaEnCasa

This is a release gate, not optional documentation.

## Identity
- Registration exposes only client/professional roles. Admin cannot be self-assigned.
- Email is normalized and unique.
- Password policy is enforced server-side. Password hashes are salted KDF outputs.
- Login errors are intentionally generic.
- Email verification and password reset use one-time, expiring, digested tokens.

## Sessions
- 256-bit opaque random session tokens.
- Only SHA-256 token digests are persisted.
- Secure + HttpOnly + SameSite cookie.
- State-changing authenticated routes require same-origin + CSRF token.
- Logout revokes server-side session.

## Authorization
- Every object mutation loads the object server-side and checks ownership/role.
- IDs are locators, never authorization.
- Chat requires conversation participation.
- Proposal acceptance is one transaction and creates one conversation.
- Admin capabilities are explicit and separately tested.

## Data / SQL
- D1 queries use bound parameters.
- Dynamic update columns come only from server-owned allowlists.
- Public discovery uses city/postal prefix; exact address/contact data is not public.
- User-generated content is rendered as text, never trusted HTML.

## Abuse / privacy
- Rate limits required on auth, recovery, chat and expensive endpoints before production.
- Logs/audit must never contain passwords, raw tokens, CSRF tokens or full sensitive request bodies.
- Account deletion/export and retention policy are required before public launch.
- Cookie/analytics consent is separate from strictly necessary authentication cookies.

## Deployment
- AYUDA_DB is an environment binding; secrets are Cloudflare secrets/vars, never source.
- Migrations are append-only.
- Preview/staging uses a separate database from production.
- Production launch requires authorization, CSRF, IDOR, XSS, SQLi, rate-limit and E2E tests.
