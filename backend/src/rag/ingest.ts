// Alias for test compatibility
export const getEmbeddings = embedTexts;
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import { encoding_for_model } from 'tiktoken';
const encoder = encoding_for_model('text-embedding-3-small'); // match embedding model
import pool from '../database/connection.js'; // your shared Pool singleton

export type IngestPayload = {
  volumeId: string;
  title: string;
  description?: string;
  authors?: string[];
  categories?: string[];
  metadata?: Record<string, any>;
};

export async function ingestBook(payload: IngestPayload) {
  try {
    console.log('[ingestBook] Input:', JSON.stringify(payload));
    await pool.query('BEGIN');

    // 1. Upsert book metadata
    console.log('[ingestBook] Upserting book metadata...');
    const bookRes = await pool.query(
      `INSERT INTO books (volume_id, title, description, authors, categories, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (volume_id)
       DO UPDATE SET 
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         metadata = EXCLUDED.metadata,
         updated_at = now()
       RETURNING id;`,
      [
        payload.volumeId,
        payload.title,
        payload.description ?? null,
        payload.authors ?? [],
        payload.categories ?? [],
        payload.metadata ?? {},
      ]
    );
    console.log('[ingestBook] Upsert result:', bookRes.rows);

    const bookId = Number(bookRes.rows[0].id);
    console.log('[ingestBook] Book ID:', bookId);

    // 2. Compose and chunk searchable text
    const { doc } = makeIngestDoc({ ...payload, bookId });
    console.log('[ingestBook] Document:', doc);
    const chunks = chunkText(doc);
    console.log('[ingestBook] Chunks:', chunks);

    if (chunks.length === 0) throw new Error('No content to embed');

    // 3. Embed chunks
    console.log('[ingestBook] Embedding chunks...');
    const vectors = await embedTexts(chunks);
    console.log('[ingestBook] Embeddings:', vectors);

    // 4. Insert chunk + vector rows in bulk
    const insertParams: any[] = [];
    const valueRows: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const base = i * 4;
      insertParams.push(bookId, i, chunks[i], JSON.stringify(vectors[i]));
      valueRows.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
    }
    console.log('[ingestBook] Bulk insert params:', insertParams);
    console.log('[ingestBook] Bulk insert valueRows:', valueRows);

    await pool.query(
      `INSERT INTO book_chunks (book_id, chunk_index, content, embedding)
       VALUES ${valueRows.join(',')};`,
      insertParams
    );
    console.log('[ingestBook] Book chunks inserted.');

    await pool.query('COMMIT');
    console.log(`📚 Book '${payload.title}' ingested with ${chunks.length} chunks ✅`);
    return { ok: true, bookId, chunksInserted: chunks.length };
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Ingest failed:', err);
    throw err;
  } finally {
    //pool.end();
  }
}

export function makeIngestDoc(payload: {
  bookId: number;
  title: string;
  description?: string;
  text?: string;
  metadata?: Record<string, any>;
}): { doc: string } {
  const parts = [
    '# Book',
    `Title: ${payload.title.trim()}`,
    `Description: ${payload.description?.trim() ?? ''}`,
    '',
    '# Content',
    payload.text?.trim() ?? '',
  ];

  const doc = parts.join('\n').trim();
  return { doc };
}

export function chunkText(text: string, maxTokens = 300, overlap = 40): string[] {
  const tokens = encoder.encode(text);
  const chunks: string[] = [];

  let start = 0;
  while (start < tokens.length) {
    const end = start + maxTokens;
    const slice = tokens.slice(start, end);
    // tiktoken's decode may return Uint8Array; convert to string
    const decoded = encoder.decode(slice);
    const decodedStr =
      typeof decoded === 'string' ? decoded : Buffer.from(decoded).toString('utf-8');
    if (decodedStr.length > 0) {
      chunks.push(decodedStr);
    }
    if (slice.length < maxTokens) break;
    start += maxTokens - overlap;
  }

  console.debug(`Chunked text into ${chunks.length} chunks.`);
  console.debug('Chunks:', chunks);

  return chunks;
}

export async function embedTexts(texts: string[], batchSize = 25): Promise<number[][]> {
  console.log('[embedTexts] Input texts:', texts);
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`[embedTexts] Batch ${i / batchSize + 1}:`, batch);

    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    console.log(`[embedTexts] API response for batch ${i / batchSize + 1}:`, res.data);

    const vectors = res.data.map((d) => d.embedding);
    console.log(`[embedTexts] Vectors for batch ${i / batchSize + 1}:`, vectors);
    results.push(...vectors);
  }

  console.log(`[embedTexts] Output vectors:`, results);
  console.log(`✅ Generated ${results.length} embedding vectors`);
  return results;
}
