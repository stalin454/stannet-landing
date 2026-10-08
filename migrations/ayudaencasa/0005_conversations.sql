PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS aec_conversations (
 id TEXT PRIMARY KEY,
 job_id TEXT NOT NULL UNIQUE REFERENCES aec_jobs(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS aec_conversation_participants (
 conversation_id TEXT NOT NULL REFERENCES aec_conversations(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE IF NOT EXISTS aec_messages (
 id TEXT PRIMARY KEY,
 conversation_id TEXT NOT NULL REFERENCES aec_conversations(id) ON DELETE CASCADE,
 sender_id TEXT NOT NULL REFERENCES aec_users(id),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 3000),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aec_messages_conversation ON aec_messages(conversation_id,created_at);
