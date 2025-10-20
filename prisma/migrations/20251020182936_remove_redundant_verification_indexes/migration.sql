-- DropIndex
-- Remove redundant single-column indexes on Verification.contentHash and Verification.status
-- These are redundant because PostgreSQL can use the leftmost columns of composite indexes:
-- - Verification_contentHash_createdAt_idx can serve queries filtering only by contentHash
-- - Verification_status_createdAt_idx can serve queries filtering only by status

DROP INDEX IF EXISTS "Verification_contentHash_idx";

DROP INDEX IF EXISTS "Verification_status_idx";
