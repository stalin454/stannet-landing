# ADR-004: Versioned same-origin API contract
Status: Accepted

## Decision
Expose AyudaEnCasa through a versioned JSON API under `/api/ayuda-en-casa/v1`. The browser uses a single API client module and same-origin credentials. Stable machine-readable error codes are separate from display messages.

## Rationale
This prevents fetch logic and security headers from being duplicated across UI components, supports future mobile/PWA clients, and allows v2 evolution without silently breaking v1 consumers.
