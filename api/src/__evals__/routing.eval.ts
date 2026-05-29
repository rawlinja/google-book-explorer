import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const { selectTool } = await import('../lib/llm.js');
const { TOOLS, SYSTEM_PROMPT } = await import('../services/bookSearch.tools.js');

const cases: { query: string; expected: string }[] = [
  // clear title
  { query: 'The Shining', expected: 'get_books_by_title' },
  { query: 'find a book called Dune', expected: 'get_books_by_title' },
  { query: 'Harry Potter', expected: 'get_books_by_title' },
  { query: 'The Great Gatsby by F. Scott Fitzgerald', expected: 'get_books_by_title' },
  // short / tricky titles
  { query: '1984', expected: 'get_books_by_title' },
  { query: 'It', expected: 'get_books_by_title' },
  // clear author
  { query: 'books by Stephen King', expected: 'get_books_by_author' },
  { query: 'Toni Morrison novels', expected: 'get_books_by_author' },
  { query: 'Stephen King', expected: 'get_books_by_author' },
  { query: 'Hemingway', expected: 'get_books_by_author' },
  { query: 'Harper Lee', expected: 'get_books_by_author' },
  { query: 'new Stephen King', expected: 'get_books_by_author' },
  // isbn
  { query: '9780743273565', expected: 'get_books_by_isbn' },
  { query: '978-0-7432-7356-5', expected: 'get_books_by_isbn' },
  { query: 'ISBN 9780743273565', expected: 'get_books_by_isbn' },
  { query: '0-7432-7356-X', expected: 'get_books_by_isbn' },
  // subject
  { query: 'horror books', expected: 'get_books_by_subject' },
  { query: 'books about machine learning', expected: 'get_books_by_subject' },
  { query: 'books about Stephen King', expected: 'get_books_by_subject' },
  { query: 'books about Hemingway', expected: 'get_books_by_subject' },
  { query: 'bestselling thrillers', expected: 'get_books_by_subject' },
  // publisher
  { query: 'books from Penguin', expected: 'get_books_by_publisher' },
  { query: "O'Reilly books", expected: 'get_books_by_publisher' },
  { query: 'books by Random House', expected: 'get_books_by_publisher' },
];

console.log('Running routing evals...\n');

let passed = 0;

for (const { query, expected } of cases) {
  const tool = await selectTool(query, TOOLS, SYSTEM_PROMPT);
  const got = tool?.name ?? null;
  const ok = got === expected;
  if (ok) passed++;

  const icon = ok ? '✓' : '✗';
  const label = query.padEnd(32);
  const exp = expected.replace('get_books_by_', '').padEnd(10);
  const actual = got ? got.replace('get_books_by_', '') : 'none';
  console.log(`${icon}  "${label}"  expected: ${exp}  got: ${actual}`);
}

const THRESHOLD = 90;
const total = cases.length;
const pct = Math.round((passed / total) * 100);
console.log(`\nScore: ${passed}/${total} (${pct}%)`);

if (pct < THRESHOLD) {
  console.error(`\nFailed: score ${pct}% is below the ${THRESHOLD}% threshold.`);
  process.exit(1);
}
