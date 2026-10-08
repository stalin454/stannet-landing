PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS aec_notification_outbox (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL,
 payload_json TEXT NOT NULL DEFAULT '{}',
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SENT','FAILED')),
 attempts INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_aec_notification_outbox ON aec_notification_outbox(status,created_at);

CREATE TABLE IF NOT EXISTS aec_entitlements (
 user_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 code TEXT NOT NULL,
 starts_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 expires_at TEXT,
 source TEXT NOT NULL DEFAULT 'SYSTEM',
 PRIMARY KEY(user_id,code)
);
