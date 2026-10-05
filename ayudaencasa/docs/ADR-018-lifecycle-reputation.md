# ADR-018: Completion and reputation integrity
Status: Accepted

Request completion and review creation are auditable atomic commands.

A review is a marketplace fact, not an editable profile attribute. D1 enforces that the request is completed and that reviewer/reviewee are the two participants in the request conversation. Existing uniqueness constraints permit at most one review for a given request/reviewer/reviewee pair.

Application checks provide useful errors; database triggers and constraints remain the final integrity boundary.

Reviews are immutable in the core model. Future moderation will hide/flag content through explicit moderation state rather than rewriting historical ratings.
