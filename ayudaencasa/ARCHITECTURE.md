# AyudaEnCasa — Architecture Foundation

Status: foundation. This document is normative for new AyudaEnCasa code.

## Goal
Build AyudaEnCasa as a production-oriented marketplace without coupling business rules to the UI or to a specific persistence provider.

## Boundaries
- `pages/marketplace.html`: presentation shell only.
- `ayudaencasa/frontend/`: browser controllers, views and API client. No SQL, auth secrets or business authorization.
- `ayudaencasa/domain/`: pure business concepts, states and invariants. No DOM, HTTP or database imports.
- `ayudaencasa/application/`: use cases orchestrating domain + ports.
- `ayudaencasa/infrastructure/`: adapters for D1, crypto, mail and external providers.
- `ayudaencasa/api/`: HTTP boundary: parsing, validation, auth context, CSRF/origin policy, response mapping.
- `ayudaencasa/db/migrations/`: append-only D1 schema migrations.
- `tests/ayudaencasa/`: unit, authorization and integration regression tests.

Dependencies point inward: frontend/API -> application -> domain. Infrastructure implements application ports. Domain never imports infrastructure.

## Security invariants
1. Authorization is server-side and object-level. A resource ID is never proof of access.
2. Client, professional and admin capabilities are explicit; admin is never inferred from client input.
3. Passwords are never stored or logged in plaintext. Authentication code must use a slow password KDF available in the selected runtime and constant-time verification where applicable.
4. Browser sessions use opaque, high-entropy tokens; only a one-way token digest is persisted. Cookies are Secure, HttpOnly and SameSite.
5. State-changing cookie-authenticated requests require same-origin checks and CSRF protection.
6. SQL is parameterized. Dynamic identifiers/order clauses must come from server-owned allowlists.
7. Output is encoded by context. User HTML is not trusted. Avoid innerHTML for untrusted data.
8. Request bodies, strings, enums, IDs and pagination have explicit limits at the API boundary.
9. Login, registration, password recovery, chat and other abuse-sensitive endpoints are rate limited.
10. Errors returned to clients do not expose stack traces, SQL, secrets or account-existence details.
11. Secrets live in environment bindings/secrets, never Git.
12. Sensitive actions produce an audit event without storing credentials, session tokens or unnecessary personal data.
13. Personal data is minimized. Exact addresses/contact details are not exposed during marketplace discovery.
14. Migrations are append-only after release; destructive schema changes require a documented migration path.

## Initial aggregate model
- User: identity and account status.
- Profile: public/minimized user presentation.
- ServiceRequest: owned by a client; draft/open/assigned/in_progress/completed/cancelled.
- Proposal: belongs to a request + professional; pending/accepted/rejected/withdrawn.
- Conversation: created only after an accepted proposal.
- Message: belongs to a conversation; sender must be a participant.
- Review: allowed only after completion and only by an eligible participant.
- AuditEvent: security/business trace with minimized metadata.

## API rules
JSON under `/api/ayuda-en-casa/v1`. Versioning is explicit from day one.
- Authentication establishes an immutable server-side principal.
- Every use case receives the principal and performs authorization before repository mutation.
- Mutations support idempotency where duplicate submission is harmful.
- Pagination is bounded and cursor-based when datasets grow.

## Delivery gates
No foundation code reaches main until:
- syntax/tests pass;
- authorization tests include another-user/IDOR cases;
- no secrets are committed;
- migrations and rollback/forward strategy are documented;
- UI keeps working when the API is unavailable;
- production bindings are configured outside source control.

## First implementation sequence
1. D1 schema + repository ports.
2. Authentication/session boundary.
3. Registration/login/logout/me.
4. Service request lifecycle.
5. Proposal lifecycle + transactional acceptance.
6. Conversation/message authorization.
7. Completion/reviews.
8. Admin/moderation.
9. Payments/Premium only after the core authorization model is stable.
