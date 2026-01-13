-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id BIGSERIAL PRIMARY KEY,
  volume_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[],
  categories TEXT[],
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Book chunks table for RAG
CREATE TABLE IF NOT EXISTS book_chunks (
  id BIGSERIAL PRIMARY KEY,
  book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chunk_index INT,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_book_chunks_book_id ON book_chunks(book_id);
CREATE INDEX IF NOT EXISTS idx_book_chunks_embedding ON book_chunks USING HNSW (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_books_volume_id ON books(volume_id);
