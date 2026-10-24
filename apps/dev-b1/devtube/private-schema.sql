-- Private StanTube-only D1. NEVER use the public catalog's sandbox DB.
-- Apply to a NEW dedicated Cloudflare D1 binding STANTUBE_DB before enabling login.
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS stantube_users (
 sub TEXT PRIMARY KEY NOT NULL,
 email TEXT NOT NULL,
 created INTEGER NOT NULL,
 disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1))
);
CREATE TABLE IF NOT EXISTS stantube_sessions (
 hash TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES stantube_users(sub) ON DELETE CASCADE,
 expires INTEGER NOT NULL,
 created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS stantube_sessions_expiry ON stantube_sessions(expires);
CREATE TABLE IF NOT EXISTS stantube_library (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES stantube_users(sub) ON DELETE CASCADE,
 json TEXT NOT NULL CHECK(length(json)<=120000),
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
 updated INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS stantube_flows (
 hash TEXT PRIMARY KEY NOT NULL,
 nonce TEXT NOT NULL,
 verifier TEXT NOT NULL,
 expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS stantube_flows_expiry ON stantube_flows(expires);
CREATE TABLE IF NOT EXISTS stantube_pairs (
 id TEXT PRIMARY KEY NOT NULL,
 secret_hash TEXT NOT NULL,
 code_hash TEXT NOT NULL UNIQUE,
 expires INTEGER NOT NULL,
 user_id TEXT REFERENCES stantube_users(sub) ON DELETE SET NULL,
 consumed INTEGER NOT NULL DEFAULT 0 CHECK(consumed IN (0,1))
);
CREATE INDEX IF NOT EXISTS stantube_pairs_code ON stantube_pairs(code_hash,expires);
CREATE TABLE IF NOT EXISTS stantube_limits (
 key TEXT PRIMARY KEY NOT NULL,
 bucket INTEGER NOT NULL,
 count INTEGER NOT NULL
);
-- Scheduled cleanup should expire sessions, flows, pairs, and rate buckets.
