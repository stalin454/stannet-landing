# ADR-014: Read-optimized professional discovery
Status: Accepted

Professional discovery is a read model, not a dump of account/profile tables.

A single bounded SQL query joins only public profile data, professional capability data and aggregated review reputation. Service-category filtering uses EXISTS rather than loading services per professional.

Reputation is derived from persisted reviews and is never client-editable. Results use bounded cursor pagination and expose coarse location only.

This deliberately avoids an additional search engine until measured search volume/features justify one.
