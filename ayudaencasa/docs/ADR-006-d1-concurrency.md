# ADR-006: D1 atomic batches for marketplace state transitions
Status: Accepted

## Context
Proposal acceptance changes multiple related records. Separate autocommit writes could leave a request assigned without a conversation, or a proposal accepted without the request transition.

## Decision
Use D1 `batch()` for the acceptance write set. Cloudflare documents batched statements as SQL transactions: statements execute sequentially and a failing statement aborts/rolls back the sequence.

Use conditional UPDATE predicates (`status='pending'`, `status='open'`) and verify affected-row counts. Database uniqueness/triggers reinforce application invariants.

## Consequences
No new distributed transaction service is introduced. Contention produces a controlled conflict instead of silently corrupting state. Reads used to prepare the command remain advisory; the conditional writes are the concurrency guard.

## Future
If read-heavy global traffic warrants it, D1 Sessions/read replication can be adopted at repository boundaries without changing domain use cases.
