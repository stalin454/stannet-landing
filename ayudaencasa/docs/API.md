# AyudaEnCasa API v1

Base path: `/api/ayuda-en-casa/v1`

## Contract rules
- JSON only for request/response bodies.
- Authentication: opaque HttpOnly session cookie.
- Mutation protection: same-origin plus `X-CSRF-Token`.
- Errors: `{ "error": { "code": "...", "message": "..." }, "requestId": "..." }`.
- Client code must branch on stable error codes, never parse human-readable messages.
- IDs are opaque. Possessing an ID grants no access.
- API is explicitly versioned to allow compatible evolution.

## Implemented auth endpoints
- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

## Marketplace endpoints being wired
- `POST /requests`
- `GET /requests/:id`
- `POST /requests/:id/proposals`
- `POST /requests/:id/accept/:proposalId`
- `POST /requests/:id/complete`
- `POST /conversations/:id/messages`
- `POST /requests/:id/reviews`

The application use cases already exist before these HTTP routes. This is intentional: HTTP is an adapter, not the business layer.
