# AyudaEnCasa release gates

A production merge is forbidden until all BLOCKER items pass.

## BLOCKER
- [ ] D1-backed atomic proposal acceptance (no partial accepted/assigned/conversation state).
- [ ] D1 integration test suite against migrations.
- [ ] Auth crypto/runtime tests in Workers-compatible environment.
- [ ] Email verification flow.
- [ ] Password recovery flow with non-enumerating responses.
- [ ] Rate limiting for recovery and sensitive mutations.
- [ ] Complete IDOR/BOLA regression matrix.
- [ ] CSP/XSS review of marketplace rendering.
- [ ] Privacy export/deletion/retention workflow.
- [ ] Admin authorization + moderation audit.
- [ ] End-to-end happy path and adversarial path.
- [ ] Separate staging/production D1 bindings and migrations applied deliberately.

## PRODUCT
- [ ] Client onboarding/profile.
- [ ] Professional onboarding/profile/verification.
- [ ] Search/filter/pagination.
- [ ] Request/proposal dashboards.
- [ ] Conversation UI.
- [ ] Completion/review UI.
- [ ] Responsive/mobile accessibility pass.
- [ ] Empty/loading/error/offline states.

## LATER / intentionally deferred
Payments/Premium are not allowed to become a dependency of the core marketplace until identity, authorization and lifecycle are stable.
