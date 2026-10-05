# ADR-008: One identity, multiple marketplace roles
Status: Accepted

## Decision
A user has one identity and zero or more roles in `user_roles`. Client and professional are self-selectable marketplace capabilities. Admin is privileged and must never be granted through public registration/profile APIs.

The legacy `users.role` column remains temporarily as a compatibility field during the foundation branch and will not be the long-term authorization source.

## Why
A real person may both hire and offer services. Separate accounts create duplicate identity, fragmented reputation and awkward recovery/privacy workflows. A role join table keeps identity singular while capabilities evolve independently.

## Security
- Public APIs may grant only client/professional.
- Admin provisioning is an operational action with audit evidence.
- Authorization is always server-side.
- Pending/unverified identities may authenticate for verification UX but cannot perform marketplace mutations.

## Migration
Existing `users.role` values are copied idempotently into `user_roles`. Application code moves to `principal.roles` incrementally; the compatibility column is removed only in a later, explicitly reviewed migration.
