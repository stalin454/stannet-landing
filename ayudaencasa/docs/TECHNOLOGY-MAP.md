# Technology map

## Runtime and delivery
- Cloudflare Workers: edge HTTP/API runtime.
- Cloudflare Pages/Assets: static application delivery.
- Cloudflare D1 / SQLite semantics: relational persistence.
- Web Crypto API: cryptographic primitives.
- Native Fetch/Request/Response: standards-based HTTP boundary.

## Application architecture
- Layered modular architecture with dependency inversion.
- Domain invariants and explicit finite-state workflow.
- Repository ports/adapters.
- Versioned REST-style JSON API.
- Opaque server-side sessions, CSRF and object-level authorization.
- Append-only SQL migrations.
- ADRs, threat modeling and requirement traceability.

## Frontend
- Progressive enhancement over existing HTML/CSS/JavaScript.
- Centralized API client.
- Semantic/responsive UI to be audited for WCAG-oriented accessibility.
- PWA/offline capabilities are candidates only where they add product value; private mutable data must not be carelessly cached.

## Quality engineering
- Node syntax/unit regression gate.
- D1 integration tests: required next.
- E2E browser tests: required before launch.
- Security regression matrix: IDOR/BOLA, CSRF, XSS, SQL injection, session and role escalation.
- Request IDs + minimized audit events for diagnosis and accountability.

## Technology-selection principle
Prefer web standards and platform primitives before dependencies. Add a library/service only when it provides a measurable security, correctness, developer-experience or product advantage. “Modern” does not mean “more dependencies.”
