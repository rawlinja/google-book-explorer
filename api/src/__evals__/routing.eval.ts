import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const { selectTool } = await import('../lib/llm.js');
const { TOOLS, SYSTEM_PROMPT } = await import('../services/bookSearch.tools.js');

const cases: { query: string; expected: string }[] = [
  { query: 'The Shining',                  expected: 'get_books_by_title' },
  { query: 'find a book called Dune',      expected: 'get_books_by_title' },
  { query: 'books by Stephen King',        expected: 'get_books_by_author' },
  { query: 'Toni Morrison novels',         expected: 'get_books_by_author' },
  { query: 'Stephen King',                 expected: 'get_books_by_author' },
  { query: '9780743273565',                expected: 'get_books_by_isbn' },
  { query: '978-0-7432-7356-5',            expected: 'get_books_by_isbn' },
  { query: 'horror books',                 expected: 'get_books_by_subject' },
  { query: 'books about machine learning', expected: 'get_books_by_subject' },
  { query: 'books about Stephen King',     expected: 'get_books_by_subject' },
  { query: 'books from Penguin',           expected: 'get_books_by_publisher' },
  { query: "O'Reilly books",               expected: 'get_books_by_publisher' },
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

const total = cases.length;
const pct = Math.round((passed / total) * 100);
console.log(`\nScore: ${passed}/${total} (${pct}%)`);
