-- Additive upgrade: old application code remains compatible; do not DROP tables to roll back code.
CREATE TABLE dev_environment(id INTEGER PRIMARY KEY CHECK(id=1),app TEXT NOT NULL CHECK(app='stannet-dev-b1'),environment_id TEXT NOT NULL,schema_version INTEGER NOT NULL CHECK(schema_version=2));
-- The provisioning tool inserts an environment ID only after verifying a new dedicated DB.
CREATE INDEX dev_sessions_user ON dev_sessions(user_id,expires);
CREATE INDEX dev_sessions_expiry ON dev_sessions(expires);
CREATE INDEX dev_tokens_user ON dev_tokens(user_id,purpose,expires);
CREATE INDEX dev_tokens_expiry ON dev_tokens(expires);
CREATE INDEX dev_audit_actor ON dev_audit(actor,created);
CREATE INDEX dev_limits_bucket ON dev_limits(bucket);
