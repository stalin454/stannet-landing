# ADR-010: Explicit composition root
Status: Accepted

Application modules depend on capabilities, not infrastructure implementations. The API/router boundary composes D1 repositories, password hashing, mail, payments and other adapters.

This keeps domain/application testable without Cloudflare bindings and prevents infrastructure choices from spreading through business logic. Adapters can be replaced or versioned without rewriting use cases.
