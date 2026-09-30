PRAGMA foreign_keys = ON;

CREATE TABLE users (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('CUSTOMER','PROFESSIONAL','MODERATOR','ADMIN')),
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACTIVE','SUSPENDED','DELETED')),
 email_verified_at TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE sessions (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 last_seen_at TEXT,
 revoked_at TEXT
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE TABLE service_categories (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'ACTIVE', risk_level TEXT NOT NULL DEFAULT 'STANDARD'
);
CREATE TABLE service_requests (
 id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES users(id),
 category_id TEXT REFERENCES service_categories(id), title TEXT NOT NULL,
 description TEXT NOT NULL, location_label TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'DRAFT', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX idx_requests_customer ON service_requests(customer_id,status);
CREATE TABLE proposals (
 id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
 professional_id TEXT NOT NULL REFERENCES users(id), message TEXT NOT NULL,
 amount_minor INTEGER, currency TEXT, status TEXT NOT NULL DEFAULT 'PENDING',
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(request_id,professional_id)
);
CREATE TABLE jobs (
 id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE REFERENCES service_requests(id),
 accepted_proposal_id TEXT NOT NULL UNIQUE REFERENCES proposals(id),
 customer_id TEXT NOT NULL REFERENCES users(id), professional_id TEXT NOT NULL REFERENCES users(id),
 status TEXT NOT NULL DEFAULT 'AGREED', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE conversations (
 id TEXT PRIMARY KEY, job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TEXT NOT NULL
);
CREATE TABLE conversation_participants (
 conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 joined_at TEXT NOT NULL, PRIMARY KEY(conversation_id,user_id)
);
CREATE TABLE messages (
 id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 sender_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
 created_at TEXT NOT NULL, edited_at TEXT, deleted_at TEXT
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id,created_at);
CREATE TABLE entitlements (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, source_type TEXT NOT NULL, source_id TEXT,
 starts_at TEXT NOT NULL, ends_at TEXT, revoked_at TEXT
);
CREATE TABLE audit_events (
 id TEXT PRIMARY KEY, actor_user_id TEXT REFERENCES users(id), event_type TEXT NOT NULL,
 resource_type TEXT, resource_id TEXT, metadata_json TEXT, created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_resource ON audit_events(resource_type,resource_id,created_at);
