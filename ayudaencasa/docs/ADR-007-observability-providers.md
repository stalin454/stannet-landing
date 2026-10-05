# ADR-007: Minimal structured observability and provider ports
Status: Accepted

## Decision
Use structured JSON application logs with an explicit allowlist of fields. Correlate responses and logs with request IDs. Never log request bodies, email addresses, tokens, message text or profile data by default.

Mail and payment systems enter through application ports. Provider SDK/API details remain infrastructure adapters.

## Why
Operational visibility is necessary; a telemetry stack is not automatically necessary. Cloudflare runtime logs plus structured events are sufficient until measured requirements justify an external observability platform.

Provider isolation avoids vendor lock-in and keeps tests deterministic.

## Escalation rule
Add external tracing/error aggregation only when incident volume, retention/search needs or service-level objectives demonstrate the need.
