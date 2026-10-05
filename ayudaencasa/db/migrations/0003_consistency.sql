-- 0003_consistency.sql
PRAGMA foreign_keys = ON;

CREATE UNIQUE INDEX IF NOT EXISTS uq_request_accepted_proposal
ON service_requests(accepted_proposal_id)
WHERE accepted_proposal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requests_discovery
ON service_requests(status, city, category, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_page
ON messages(conversation_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_request_status
ON proposals(request_id, status, created_at DESC);

CREATE TRIGGER IF NOT EXISTS trg_request_accepted_proposal_matches
BEFORE UPDATE OF accepted_proposal_id ON service_requests
WHEN NEW.accepted_proposal_id IS NOT NULL
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM proposals p
  WHERE p.id=NEW.accepted_proposal_id AND p.request_id=NEW.id
 ) THEN RAISE(ABORT,'accepted proposal must belong to request') END;
END;
