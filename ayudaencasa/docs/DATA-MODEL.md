# Data model and privacy boundaries

## Identity (private)
`users`, `user_roles`, `sessions`, verification/reset tokens. Never public.

## General profile (public only when opted in)
Display name, biography, city, postal prefix and avatar reference. Exact address and private contact data are excluded.

## Professional capability
Professional headline, experience years, availability, verification state and normalized service categories.

## Marketplace
Service requests, proposals, accepted assignment, conversation/messages, completion and reviews.

## Operational
Audit events and rate-limit buckets.

### Design rule
Tables follow ownership and privacy boundaries, not individual screens. UI redesigns must not force identity/database redesigns.
