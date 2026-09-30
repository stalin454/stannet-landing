PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS aec_users (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 role TEXT NOT NULL CHECK(role IN ('CUSTOMER','PROFESSIONAL','MODERATOR','ADMIN')),
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACTIVE','SUSPENDED','DELETED')),
 email_verified_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aec_categories (
 id TEXT PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS aec_professional_profiles (
 user_id TEXT PRIMARY KEY REFERENCES aec_users(id) ON DELETE CASCADE,
 display_name TEXT NOT NULL,
 bio TEXT NOT NULL DEFAULT '',
 location_label TEXT NOT NULL,
 postal_prefix TEXT,
 hourly_rate_minor INTEGER CHECK(hourly_rate_minor IS NULL OR hourly_rate_minor >= 0),
 currency TEXT NOT NULL DEFAULT 'EUR',
 published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aec_professional_services (
 professional_id TEXT NOT NULL REFERENCES aec_users(id) ON DELETE CASCADE,
 category_id TEXT NOT NULL REFERENCES aec_categories(id),
 PRIMARY KEY(professional_id,category_id)
);

CREATE TABLE IF NOT EXISTS aec_requests (
 id TEXT PRIMARY KEY,
 customer_id TEXT NOT NULL REFERENCES aec_users(id),
 category_id TEXT REFERENCES aec_categories(id),
 title TEXT NOT NULL,
 description TEXT NOT NULL,
 location_label TEXT NOT NULL,
 postal_prefix TEXT,
 status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','MATCHING','PROPOSALS','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aec_requests_market ON aec_requests(status,category_id,postal_prefix,created_at);

CREATE TABLE IF NOT EXISTS aec_proposals (
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL REFERENCES aec_requests(id) ON DELETE CASCADE,
 professional_id TEXT NOT NULL REFERENCES aec_users(id),
 message TEXT NOT NULL,
 amount_minor INTEGER CHECK(amount_minor IS NULL OR amount_minor >= 0),
 currency TEXT NOT NULL DEFAULT 'EUR',
 status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN','EXPIRED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(request_id,professional_id)
);

CREATE TABLE IF NOT EXISTS aec_jobs (
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL UNIQUE REFERENCES aec_requests(id),
 accepted_proposal_id TEXT NOT NULL UNIQUE REFERENCES aec_proposals(id),
 customer_id TEXT NOT NULL REFERENCES aec_users(id),
 professional_id TEXT NOT NULL REFERENCES aec_users(id),
 status TEXT NOT NULL DEFAULT 'AGREED' CHECK(status IN ('AGREED','SCHEDULED','IN_PROGRESS','COMPLETED','DISPUTED','CANCELLED')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aec_reviews (
 id TEXT PRIMARY KEY,
 job_id TEXT NOT NULL REFERENCES aec_jobs(id) ON DELETE CASCADE,
 author_id TEXT NOT NULL REFERENCES aec_users(id),
 subject_id TEXT NOT NULL REFERENCES aec_users(id),
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
 body TEXT NOT NULL DEFAULT '' CHECK(length(body)<=2000),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(job_id,author_id)
);

CREATE TABLE IF NOT EXISTS aec_audit_events (
 id TEXT PRIMARY KEY,
 actor_user_id TEXT REFERENCES aec_users(id),
 event_type TEXT NOT NULL,
 resource_type TEXT,
 resource_id TEXT,
 metadata_json TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_aec_audit_resource ON aec_audit_events(resource_type,resource_id,created_at);

INSERT OR IGNORE INTO aec_categories(id,slug,name) VALUES
 ('cleaning','limpieza-organizacion','Limpieza y organización'),
 ('care','cuidados-acompanamiento','Cuidados y acompañamiento'),
 ('garden','jardin-exterior','Jardín y exterior'),
 ('repairs','hogar-reparaciones','Hogar y reparaciones'),
 ('trades','profesionales-hogar','Profesionales del hogar'),
 ('physical','ayuda-fisica','Ayuda física'),
 ('wellbeing','bienestar-cuidado-personal','Bienestar y cuidado personal');