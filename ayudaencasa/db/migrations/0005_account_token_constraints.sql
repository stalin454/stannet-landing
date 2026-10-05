-- 0005_account_token_constraints.sql
CREATE INDEX IF NOT EXISTS idx_verification_token_lookup ON email_verification_tokens(token_digest,expires_at);
CREATE INDEX IF NOT EXISTS idx_reset_token_lookup ON password_reset_tokens(token_digest,expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id,revoked_at,expires_at);
