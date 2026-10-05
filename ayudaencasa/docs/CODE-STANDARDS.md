# AyudaEnCasa code standards

## Mandatory
1. One responsibility per module/use case.
2. Business rules belong in domain/application, not HTML or route handlers.
3. HTTP routes translate protocol concerns; repositories translate persistence concerns.
4. No raw SQL outside infrastructure/migrations.
5. No credentials/secrets in source, browser storage or logs.
6. Bound every user-controlled string, body and collection.
7. Prefer explicit names and small functions over clever abstractions.
8. Do not duplicate authorization logic: reuse domain rules/guards.
9. Public DTOs expose the minimum necessary data.
10. Every security/business regression gets a test before the fix is considered durable.
11. Comments explain *why*, not obvious syntax.
12. Dependencies require a documented reason; prefer platform/web standards.

## Performance
- Never SELECT * for public list endpoints.
- Paginate lists.
- Avoid N+1 queries; aggregate/join deliberately when needed.
- Do not cache private authenticated responses in shared caches.
- Measure before adding complexity.

## Review smell list
Reject: giant route handlers, DOM+SQL coupling, magic role strings scattered everywhere, arbitrary status writes, swallowed errors, duplicated fetch wrappers, user-controlled HTML, unbounded chat/history fetches, and provider-specific logic inside use cases.
