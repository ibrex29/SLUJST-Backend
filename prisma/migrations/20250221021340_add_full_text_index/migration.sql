-- Enable pg_trgm extension for similarity search (optional)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a GIN index for full-text search
CREATE INDEX publication_full_text_idx 
ON "Publication" USING GIN (to_tsvector('english', title || ' ' || abstract || ' ' || keywords));
