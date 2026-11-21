-- Enable pg_trgm extension for accelerated ILIKE / substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN trigram indexes on searched text columns to avoid full table scans on ILIKE '%term%'
CREATE INDEX IF NOT EXISTS "Job_title_trgm_idx" ON "Job" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Job_description_trgm_idx" ON "Job" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Job_location_trgm_idx" ON "Job" USING GIN ("location" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Job_department_trgm_idx" ON "Job" USING GIN ("department" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Company_name_trgm_idx" ON "Company" USING GIN ("name" gin_trgm_ops);

-- Add composite index for active jobs sorted by postedAt
CREATE INDEX IF NOT EXISTS "Job_isActive_postedAt_idx" ON "Job"("isActive", "postedAt" DESC);
