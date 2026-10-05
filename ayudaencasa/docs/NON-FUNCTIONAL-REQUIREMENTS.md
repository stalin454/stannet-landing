# Non-functional requirements

## Security
Server-side authorization, bounded input, protected mutations, safe sessions, audit trail and least-privilege integrations.

## Performance
Public list endpoints are bounded and indexed. Avoid N+1 access. Static assets remain CDN-friendly. Private responses are not shared-cacheable.

## Reliability
Multi-record state transitions are atomic. Conflicts are explicit. External provider failures must not corrupt marketplace state.

## Maintainability
Layer boundaries, ADRs, traceability, migrations, stable error codes and automated regression tests are mandatory.

## Privacy
Data minimization by default. Logs exclude personal content and credentials. Public discovery does not expose exact home addresses.

## Accessibility
Core flows must be keyboard usable, semantically structured and tested across responsive layouts before release.

## Portability
Domain/application code must not depend directly on Cloudflare, payment or mail vendors.
