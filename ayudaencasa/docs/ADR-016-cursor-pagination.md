# ADR-016: Opaque composite cursor pagination
Status: Accepted

Ordered collections use a stable tuple `(created_at, id)` rather than timestamp-only pagination.

For descending order, the next page predicate is:
`created_at < cursor.createdAt OR (created_at = cursor.createdAt AND id < cursor.id)`.

The API cursor is an opaque, versioned base64url payload. Clients must treat it as an uninterpreted token. Versioning lets the server evolve pagination without changing the HTTP contract.

Offset pagination is avoided for growing marketplace timelines because concurrent inserts can cause duplicates/skips and large offsets become increasingly expensive.
