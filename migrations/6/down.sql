
-- Remover índices das tabelas de tokens
DROP INDEX idx_email_verification_tokens_user_id;
DROP INDEX idx_email_verification_tokens_token;
DROP INDEX idx_password_reset_tokens_expires_at;
DROP INDEX idx_password_reset_tokens_user_id;
DROP INDEX idx_password_reset_tokens_token;

-- Remover tabelas de tokens
DROP TABLE email_verification_tokens;
DROP TABLE password_reset_tokens;

-- Remover campos adicionados à tabela users
ALTER TABLE users DROP COLUMN is_email_verified;
ALTER TABLE users DROP COLUMN salt;
ALTER TABLE users DROP COLUMN password_hash;
