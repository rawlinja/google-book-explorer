import { query } from '../db.js';
import { Book } from '../models/book.js';

export async function insertBook(book: Book) {
  const res = await query(
    'INSERT INTO books (volume_id, title, authors, categories, description, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [book.volumeId, book.title, book.authors, book.categories, book.description, book.metadata]
  );
  return res.rows[0];
}

export async function getBookById(id: string) {
  const res = await query('SELECT * FROM books WHERE id = $1', [id]);
  return res.rows[0];
}
