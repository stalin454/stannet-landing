# ADR-001: Modular layered architecture
Status: Accepted

## Context
AyudaEnCasa starts inside the StanNet repository but must evolve as an independently maintainable marketplace. Mixing DOM, SQL, authorization and business rules would create coupling and make security review difficult.

## Decision
Use a modular layered architecture:
- presentation/frontend
- HTTP/API boundary
- application use cases
- domain invariants
- infrastructure adapters
- D1 persistence

Dependencies point inward. Cloudflare-specific code stays at the infrastructure/API edges.

## Consequences
Business rules are unit-testable without a browser or database. D1 or UI can be replaced without rewriting the domain. More files exist, but responsibilities are explicit and reviewable.
