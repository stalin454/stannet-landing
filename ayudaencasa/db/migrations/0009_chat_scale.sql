-- 0009_chat_scale.sql
PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_messages_sender_recent
ON messages(sender_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_rate_limit_expiry
ON rate_limit_buckets(expires_at);

CREATE TRIGGER IF NOT EXISTS trg_message_sender_is_participant
BEFORE INSERT ON messages
BEGIN
 SELECT CASE WHEN NOT EXISTS (
  SELECT 1 FROM conversations c
  WHERE c.id=NEW.conversation_id
    AND NEW.sender_id IN (c.client_id,c.professional_id)
 ) THEN RAISE(ABORT,'message sender must be conversation participant') END;
END;
