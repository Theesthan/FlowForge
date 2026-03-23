-- Run once when PostgreSQL container first starts.
-- Enables the pgvector extension required for agent memory embeddings.
CREATE EXTENSION IF NOT EXISTS vector;
