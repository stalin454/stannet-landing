-- 0004_user_roles.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('client','professional','admin')),
  granted_at TEXT NOT NULL,
  granted_by TEXT REFERENCES users(id),
  PRIMARY KEY(user_id, role)
);

INSERT OR IGNORE INTO user_roles(user_id,role,granted_at)
SELECT id,role,created_at FROM users;

CREATE INDEX IF NOT EXISTS idx_user_roles_role_user
ON user_roles(role,user_id);
