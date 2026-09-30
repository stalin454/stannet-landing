PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS aec_sessions (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_seen_at TEXT,
 revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_aec_sessions_user ON aec_sessions(user_id,revoked_at,expires_at);

CREATE TABLE IF NOT EXISTS aec_auth_tokens (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 purpose TEXT NOT NULL CHECK(purpose IN ('VERIFY_EMAIL','RESET_PASSWORD')),
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 consumed_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aec_auth_tokens_user ON aec_auth_tokens(user_id,purpose,consumed_at);

CREATE TABLE IF NOT EXISTS aec_login_events (
 id TEXT PRIMARY KEY,
 email_hash TEXT,
 user_id TEXT REFERENCES aec_users(id) ON DELETE SET NULL,
 outcome TEXT NOT NULL CHECK(outcome IN ('SUCCESS','FAILURE','LOCKED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aec_login_events_user ON aec_login_events(user_id,created_at);
