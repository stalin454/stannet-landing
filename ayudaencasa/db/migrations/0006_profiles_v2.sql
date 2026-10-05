-- 0006_profiles_v2.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS professional_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  headline TEXT,
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK(experience_years BETWEEN 0 AND 80),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified','pending','verified','rejected')),
  available INTEGER NOT NULL DEFAULT 1 CHECK(available IN (0,1)),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS professional_services (
  user_id TEXT NOT NULL REFERENCES professional_profiles(user_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(user_id,category)
);

CREATE INDEX IF NOT EXISTS idx_professional_discovery
ON professional_profiles(verification_status,available,experience_years DESC);

CREATE INDEX IF NOT EXISTS idx_professional_services_category
ON professional_services(category,user_id);
