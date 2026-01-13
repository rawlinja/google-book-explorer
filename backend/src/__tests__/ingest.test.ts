import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ingestBook, makeIngestDoc, chunkText, embedTexts } from '../rag/ingest.js';

// Mock OpenAI and DB
vi.mock('openai', () => ({
  default: class {
    embeddings = {
      create: vi.fn(async ({ input }) => ({
        data: Array.isArray(input)
          ? input.map(() => ({ embedding: [0.1, 0.2, 0.3] }))
          : [{ embedding: [0.1, 0.2, 0.3] }],
      })),
    };
  },
}));
vi.mock('../database/connection.js', () => ({
  default: {
    query: vi.fn(async (sql, params) => {
      if (sql.includes('BEGIN') || sql.includes('COMMIT') || sql.includes('ROLLBACK')) return {};
      if (sql.includes('RETURNING id')) return { rows: [{ id: 123 }] };
      if (sql.includes('INSERT INTO book_chunks')) return {};
      return {};
    }),
  },
}));

const sampleBook = {
  volumeId: 'vol-1',
  title: 'Jane Eyre',
  description: 'A tale of resilience, love, and independence.',
  authors: ['Charlotte Brontë'],
  categories: ['Romance', 'Classic'],
  metadata: { year: 1847 },
};

describe('makeIngestDoc', () => {
  it('should compose a doc string from payload', () => {
    const { doc } = makeIngestDoc({ bookId: 1, ...sampleBook });
    expect(doc).toContain('Jane Eyre');
    expect(doc).toContain('A tale of resilience, love, and independence.');
  });
});

describe('chunkText', () => {
  it('should chunk text into non-empty strings', () => {
    const chunks = chunkText('This is a long text to chunk. '.repeat(30), 20, 5);
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every((c) => typeof c === 'string' && c.length > 0)).toBe(true);
  });
});

describe('embedTexts', () => {
  it('should return embedding vectors for each input text', async () => {
    const texts = ['chunk1', 'chunk2'];
    const vectors = await embedTexts(texts, 1);
    expect(Array.isArray(vectors)).toBe(true);
    expect(vectors.length).toBe(2);
    expect(vectors[0]).toEqual([0.1, 0.2, 0.3]);
  });
});

describe('ingestBook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should ingest a book, chunk, embed, and persist', async () => {
    const result = await ingestBook(sampleBook);
    expect(result.ok).toBe(true);
    expect(result.bookId).toBe(123);
    expect(result.chunksInserted).toBeGreaterThan(0);
  });
});
