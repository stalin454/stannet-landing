-- 0008_review_invariants.sql
PRAGMA foreign_keys = ON;

CREATE TRIGGER IF NOT EXISTS trg_review_completed_request
BEFORE INSERT ON reviews
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM service_requests sr
  WHERE sr.id=NEW.request_id AND sr.status='completed'
 ) THEN RAISE(ABORT,'review requires completed request') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_review_participants
BEFORE INSERT ON reviews
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.request_id=NEW.request_id
    AND (
      (c.client_id=NEW.reviewer_id AND c.professional_id=NEW.reviewee_id)
      OR
      (c.professional_id=NEW.reviewer_id AND c.client_id=NEW.reviewee_id)
    )
 ) THEN RAISE(ABORT,'review parties must be request participants') END;
END;


-- One review per participant per completed request/direction.
CREATE UNIQUE INDEX IF NOT EXISTS uq_review_reviewer_request
ON reviews(request_id, reviewer_id);
