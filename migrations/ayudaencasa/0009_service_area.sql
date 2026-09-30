PRAGMA foreign_keys = ON;
ALTER TABLE aec_professional_profiles ADD COLUMN service_radius_km INTEGER NOT NULL DEFAULT 15 CHECK(service_radius_km BETWEEN 1 AND 100);
CREATE INDEX IF NOT EXISTS idx_aec_professional_location ON aec_professional_profiles(postal_prefix,published);
