# ADR-005: Scale with bounded queries and modular monolith
Status: Accepted

## Context
AyudaEnCasa needs room to grow, but premature distributed services would increase operational complexity before product-market validation.

## Decision
Keep a modular monolith at the edge with strict internal boundaries. Scale data access through bounded queries, indexes and cursor pagination. Keep provider integrations behind ports. Do not introduce a service merely because it is fashionable.

## Rules
- No unbounded collection endpoint.
- Default page size 20; hard maximum 50 unless an ADR changes it.
- Public list queries select only fields needed by the view.
- Filters are allowlisted; never convert arbitrary query parameters into SQL.
- Add indexes from observed query patterns, not guesses alone.
- External mail/payment/search providers remain replaceable adapters.
- Split a module into an independent service only after measurable isolation/scaling/operational need.

## Consequences
The system remains cheap and understandable now while preserving clean seams for later extraction.
