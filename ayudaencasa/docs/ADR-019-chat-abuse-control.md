# ADR-019: Chat integrity and abuse control
Status: Accepted

Chat remains part of the marketplace modular monolith.

Only conversation participants may insert messages. This is enforced both in application authorization and by a D1 trigger. Normal admin access cannot impersonate a participant.

Message creation and its audit event are one atomic batch. Message bodies are bounded to 4000 characters and timeline reads use indexed composite cursor pagination.

Rate limiting uses one atomic SQLite UPSERT with RETURNING instead of a read-then-update sequence, preventing lost increments under concurrent requests.

A separate cache, queue or realtime service is not introduced until measured load or product requirements justify it.
