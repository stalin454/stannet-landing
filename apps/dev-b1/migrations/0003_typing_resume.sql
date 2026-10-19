-- Additive only. B1 can continue using schema_version=2 during code rollback.
-- Never re-run bootstrap against the existing remote database.
ALTER TABLE dev_environment ADD COLUMN typing_revision INTEGER NOT NULL DEFAULT 1 CHECK(typing_revision=1);
CREATE TABLE dev_typing_state(
 user_id TEXT PRIMARY KEY REFERENCES dev_users(id),
 attempt TEXT NOT NULL REFERENCES dev_attempts(id),
 draft TEXT NOT NULL DEFAULT '' CHECK(length(draft)<=16384),
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
 updated INTEGER NOT NULL
);
