# ADR-002: Server-side opaque sessions
Status: Accepted

## Context
A browser marketplace needs revocable authentication, object-level authorization and safe logout. Long-lived self-contained bearer tokens complicate immediate revocation.

## Decision
Use high-entropy opaque session tokens in Secure, HttpOnly, SameSite cookies. Persist only SHA-256 token digests. Protect state-changing routes with same-origin validation and a CSRF secret tied to the session.

## Consequences
Sessions can be revoked immediately. A database leak does not directly expose reusable session tokens. D1 is consulted for authenticated requests; this is an intentional security tradeoff.
