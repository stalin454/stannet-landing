PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS dev_users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,verified INTEGER NOT NULL DEFAULT 0,role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),disabled INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS dev_sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES dev_users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS dev_tokens(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES dev_users(id),purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')),expires INTEGER NOT NULL,consumed INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS dev_limits(key TEXT PRIMARY KEY,bucket INTEGER NOT NULL,count INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS dev_entitlements(user_id TEXT NOT NULL REFERENCES dev_users(id),app TEXT NOT NULL,plan TEXT NOT NULL CHECK(plan IN ('free','premium')),expires INTEGER NOT NULL,source TEXT NOT NULL CHECK(source IN ('free','sandbox-admin','stripe-test')),PRIMARY KEY(user_id,app));
CREATE TABLE IF NOT EXISTS dev_attempts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES dev_users(id),exercise TEXT NOT NULL,created INTEGER NOT NULL,completed INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS dev_attempts_user_time ON dev_attempts(user_id,created);
CREATE TABLE IF NOT EXISTS dev_progress(user_id TEXT NOT NULL REFERENCES dev_users(id),exercise TEXT NOT NULL,completed INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(user_id,exercise));
CREATE TABLE IF NOT EXISTS dev_stripe_customers(customer TEXT PRIMARY KEY,user_id TEXT UNIQUE NOT NULL REFERENCES dev_users(id));
CREATE TABLE IF NOT EXISTS dev_subscription_state(customer TEXT PRIMARY KEY,status TEXT NOT NULL,period_end INTEGER NOT NULL,cancel_at_period_end INTEGER NOT NULL,event_created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS dev_webhook_events(id TEXT PRIMARY KEY,created INTEGER NOT NULL,payload_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS dev_audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,subject TEXT NOT NULL,created INTEGER NOT NULL);
-- Local-only email sink. Never served by HTTP or deployed as a public resource.
CREATE TABLE IF NOT EXISTS dev_test_mail(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,kind TEXT NOT NULL,token TEXT NOT NULL,created INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS dev_typing_state(user_id TEXT PRIMARY KEY REFERENCES dev_users(id),attempt TEXT NOT NULL REFERENCES dev_attempts(id),draft TEXT NOT NULL DEFAULT '' CHECK(length(draft)<=16384),revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),updated INTEGER NOT NULL);
