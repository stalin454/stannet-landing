# AyudaEnCasa — Threat model v1

## Assets
Accounts, profiles, contact/location data, requests, proposals, private messages, reviews, moderation data, session credentials and future payment/subscription state.

## Trust boundaries
1. Untrusted browser <-> Cloudflare Worker API.
2. Worker <-> D1.
3. Worker <-> future mail/payment providers.
4. Public marketplace data <-> authenticated private data.
5. Normal users <-> administrative capabilities.

## Primary threats and controls
- IDOR/BOLA: load resource server-side; verify ownership/participation on every operation.
- Credential stuffing/brute force: generic login errors, rate limits, future abuse telemetry.
- Session theft: Secure HttpOnly cookies, random opaque tokens, digest persistence, expiry/revocation.
- CSRF: same-origin + CSRF token for mutations.
- XSS: treat user content as text; contextual encoding; CSP; no trusted user HTML.
- SQL injection: bound D1 parameters; no client-controlled SQL fragments.
- Enumeration: generic auth/recovery responses and bounded public profile exposure.
- Chat abuse: participant checks, body limits, rate limits, reporting/moderation path.
- Spam/fake profiles: verification states, audit trail, moderation.
- Privilege escalation: admin never self-selectable; explicit role checks.
- Race conditions: transactional/atomic acceptance semantics and DB uniqueness constraints.
- Privacy leakage: data minimization, public/private profile split, no exact address in discovery.
- Supply-chain/deployment: lock dependencies, least-privilege secrets/bindings, staging separate from production.

## Residual work before launch
Abuse-rate implementation, email verification, recovery, CSP review, privacy/export/deletion, admin hardening, payment threat model, automated D1 integration tests, full E2E and security regression suite.
