// Wrapper for test compatibility
export async function retrieveRelevantChunks(query: string, bookId: number, k = 3) {
  const vector = await embedQuery(query);
  // You may want to filter by bookId if your schema supports it
  const rows = await searchChunks(vector, k);
  // Add a .text property for test compatibility
  return rows.map((row: any) => ({ ...row, text: row.content }));
}
import OpenAI from 'openai';
import pool from '../database/db.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function embedQuery(q: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: q,
  });
  if (!res.data.length) {
    throw new Error('No embedding returned for query');
  }
  return res.data[0].embedding;
}

export async function searchChunks(vector: number[], k = 5) {
  const res = await pool.query(
    `SELECT book_id, chunk_index, content
     FROM book_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2;`,
    [vector, k]
  );
  return res.rows;
}
