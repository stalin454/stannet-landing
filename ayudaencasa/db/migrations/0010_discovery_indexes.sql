-- 0010_discovery_indexes.sql
PRAGMA foreign_keys = ON;

-- Keep common discovery filters index-friendly without introducing a search service.
CREATE INDEX IF NOT EXISTS idx_profiles_public_city_postal
ON profiles(is_public, city, postal_prefix, user_id);

CREATE INDEX IF NOT EXISTS idx_professional_available_verification
ON professional_profiles(available, verification_status, user_id);

CREATE INDEX IF NOT EXISTS idx_professional_services_user_category
ON professional_services(user_id, category);

CREATE INDEX IF NOT EXISTS idx_service_requests_public_search
ON service_requests(status, city, category, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_rating
ON reviews(reviewee_id, rating);

CREATE INDEX IF NOT EXISTS idx_proposals_professional_created
ON proposals(professional_id, created_at DESC, id DESC);
