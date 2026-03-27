-- Migration: change memories.embedding from vector(1536) to vector(768)
-- Reason: switching to Groq nomic-embed-text-v1.5 which produces 768-dimensional embeddings

ALTER TABLE "memories" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "memories" ADD COLUMN "embedding" vector(768);
