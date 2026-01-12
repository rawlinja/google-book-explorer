-- Ensure vector extension is available in this DB
CREATE EXTENSION IF NOT EXISTS vector;

-- Book metadata table
CREATE TABLE IF NOT EXISTS books (
  id BIGSERIAL PRIMARY KEY,
  volume_id TEXT UNIQUE,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks + embeddings for vector similarity search
CREATE TABLE IF NOT EXISTS book_chunks (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index to accelerate direct book lookups
CREATE INDEX IF NOT EXISTS idx_book_chunks_book_id ON book_chunks(book_id);

-- HNSW index to accelerate embedding similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_book_chunks_embedding_cosine
  ON book_chunks USING hnsw (embedding vector_cosine_ops);
