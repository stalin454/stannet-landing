PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS aec_password_credentials (
 user_id TEXT PRIMARY KEY REFERENCES aec_users(id) ON DELETE CASCADE,
 password_hash TEXT NOT NULL,
 algorithm TEXT NOT NULL DEFAULT 'PBKDF2-SHA256',
 iterations INTEGER NOT NULL CHECK(iterations >= 100000),
 salt TEXT NOT NULL,
 changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
