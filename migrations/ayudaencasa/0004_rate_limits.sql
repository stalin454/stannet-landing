CREATE TABLE IF NOT EXISTS aec_rate_limits (
 id TEXT PRIMARY KEY,
 bucket TEXT NOT NULL,
 key_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aec_rate_limits_lookup ON aec_rate_limits(bucket,key_hash,created_at);
