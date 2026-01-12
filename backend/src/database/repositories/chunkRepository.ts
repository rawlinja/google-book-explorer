import { query } from '../db.js';
import { Chunk } from '../models/chunk.js';

export async function insertChunk(chunk: Chunk) {
  const res = await query(
    'INSERT INTO book_chunks (book_id, content, embedding) VALUES ($1, $2, $3) RETURNING *',
    [chunk.bookId, chunk.content, chunk.embedding]
  );
  return res.rows[0];
}

export async function getChunksByBookId(bookId: string) {
  const res = await query('SELECT * FROM book_chunks WHERE book_id = $1', [bookId]);
  return res.rows;
}
