PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS aec_reports (
 id TEXT PRIMARY KEY,
 reporter_id TEXT NOT NULL REFERENCES aec_users(id),
 subject_user_id TEXT REFERENCES aec_users(id),
 job_id TEXT REFERENCES aec_jobs(id),
 reason TEXT NOT NULL CHECK(length(reason) BETWEEN 3 AND 80),
 details TEXT NOT NULL DEFAULT '' CHECK(length(details)<=2000),
 status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','REVIEWING','RESOLVED','DISMISSED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aec_reports_status ON aec_reports(status,created_at);

CREATE TABLE IF NOT EXISTS aec_blocks (
 blocker_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 blocked_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(blocker_id,blocked_id),
 CHECK(blocker_id<>blocked_id)
);

CREATE TABLE IF NOT EXISTS aec_privacy_requests (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES aec_users(id),
 kind TEXT NOT NULL CHECK(kind IN ('EXPORT','DELETE')),
 status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED','PROCESSING','COMPLETED','REJECTED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_aec_privacy_user ON aec_privacy_requests(user_id,created_at);
