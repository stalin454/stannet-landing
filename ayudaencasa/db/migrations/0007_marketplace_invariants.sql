-- 0007_marketplace_invariants.sql
PRAGMA foreign_keys = ON;

CREATE UNIQUE INDEX IF NOT EXISTS uq_conversation_request
ON conversations(request_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accepted_proposal_per_request
ON proposals(request_id)
WHERE status='accepted';

CREATE TRIGGER IF NOT EXISTS trg_accept_only_open_request
BEFORE UPDATE OF status ON proposals
WHEN NEW.status='accepted'
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM service_requests sr
  WHERE sr.id=NEW.request_id AND sr.status='open'
 ) THEN RAISE(ABORT,'proposal can only be accepted for open request') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_assigned_requires_accepted_proposal
BEFORE UPDATE OF status,accepted_proposal_id ON service_requests
WHEN NEW.status='assigned'
BEGIN
 SELECT CASE WHEN NEW.accepted_proposal_id IS NULL OR NOT EXISTS (
  SELECT 1 FROM proposals p
  WHERE p.id=NEW.accepted_proposal_id
    AND p.request_id=NEW.id
    AND p.status='accepted'
 ) THEN RAISE(ABORT,'assigned request requires accepted proposal') END;
END;
