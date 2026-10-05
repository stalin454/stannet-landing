-- 0002_hardening.sql
PRAGMA foreign_keys = ON;
CREATE INDEX IF NOT EXISTS idx_users_status_role ON users(status, role);
CREATE INDEX IF NOT EXISTS idx_requests_city_category ON service_requests(status, city, category, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id, created_at);

CREATE TABLE email_verification_tokens (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_digest TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 consumed_at TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX idx_email_verify_user ON email_verification_tokens(user_id, expires_at);

CREATE TABLE password_reset_tokens (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_digest TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 consumed_at TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id, expires_at);

CREATE TABLE rate_limit_buckets (
 bucket_key TEXT PRIMARY KEY,
 window_started_at INTEGER NOT NULL,
 hit_count INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX idx_rate_limit_expiry ON rate_limit_buckets(expires_at);
