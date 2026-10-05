# Deployment model

AyudaEnCasa remains isolated inside the StanNet repository.

- Cloudflare Worker: HTTP/API execution.
- D1: relational persistence.
- Pages/static assets: frontend delivery.
- Secrets: Cloudflare environment bindings, never Git.
- Migrations: append-only and applied before application rollout that requires them.
- CI: AyudaEnCasa-specific path filter prevents unrelated StanNet changes from paying its database setup cost.

Production deployment is intentionally not automated until staging bindings, migration verification, rollback procedure and release gates are complete.
