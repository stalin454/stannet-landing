# ADR-017: Marketplace acceptance invariants
Status: Accepted

Proposal acceptance is one atomic infrastructure command composed at the HTTP boundary. Application code depends on that capability, not on D1.

Database constraints/triggers are the final authority for invariants:
- at most one accepted proposal per request;
- at most one conversation per request;
- a proposal can become accepted only while its request is open;
- an assigned request must reference an accepted proposal belonging to that request.

Application prechecks improve errors but are not concurrency guarantees. D1 batch/constraints protect the write boundary; constraint races are normalized to STATE_CONFLICT.
