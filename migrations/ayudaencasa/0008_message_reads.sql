PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS aec_message_reads (
 conversation_id TEXT NOT NULL REFERENCES aec_conversations(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 last_read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(conversation_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_aec_messages_conversation_created ON aec_messages(conversation_id,created_at);
