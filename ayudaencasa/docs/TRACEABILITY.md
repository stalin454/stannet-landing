# AyudaEnCasa — Engineering Traceability

Every production capability must link requirement -> decision -> implementation -> verification.

| ID | Requirement | Decision | Implementation | Verification | Status |
|---|---|---|---|---|---|
| SEC-001 | Prevent horizontal privilege escalation | Server-side object authorization | domain/model.cjs | domain-authorization.test.cjs | implemented |
| SEC-002 | Session theft blast radius | Opaque 256-bit token; persist digest only | application/auth.mjs | auth tests pending runtime harness | implemented |
| SEC-003 | Protect cookie-authenticated mutations | Same-origin + CSRF | api/router.mjs | API integration test pending | implemented |
| SEC-004 | Prevent SQL injection | D1 bound parameters + server allowlists | infrastructure/d1/repositories.mjs | repository integration tests pending | implemented |
| SEC-005 | Safe password storage | Salted PBKDF2-SHA256 KDF, upgradeable format | infrastructure/security/password.mjs | crypto tests pending runtime harness | implemented |
| MKT-001 | Client publishes a request | Application use case owns invariant checks | application/create-request.cjs | create-request.test.cjs | implemented |
| MKT-002 | Professional submits one proposal/request | Role + request-state + uniqueness | application/submit-proposal.cjs + DB unique constraint | submit-proposal.test.cjs | implemented |
| MKT-003 | Client accepts proposal atomically | Transactional use case | application/accept-proposal.cjs | accept-proposal.test.cjs | implemented |
| MSG-001 | Only participants access conversation | Server-side participant authorization | domain/model.cjs | domain-authorization.test.cjs | implemented |
| OPS-001 | Auditable sensitive operations | Append-only business/security audit events | audit_events | use-case tests | in progress |
| DOC-001 | Defensible degree project | ADRs + traceability + threat model + tests | docs/ | documentation review | in progress |

## Evidence rule
A feature is not “done” because a screen works. Done means its requirement, authorization rule, persistence behavior, failure behavior and regression test are documented and reproducible.
