import {
  searchByTitle,
  searchByAuthor,
  searchByIsbn,
  searchBySubject,
  searchByPublisher,
  searchByLccn,
} from './googleBooks.js';
import type { GoogleBooksResult } from './googleBooks.js';
import { TOOLS, SYSTEM_PROMPT } from './bookSearch.tools.js';
import { selectTool } from '../lib/llm.js';

async function runTool(
  name: string,
  args: Record<string, string>,
  startIndex: number
): Promise<GoogleBooksResult> {
  switch (name) {
    case 'get_books_by_title':
      return searchByTitle(args.title ?? '', startIndex);
    case 'get_books_by_author':
      return searchByAuthor(args.author ?? '', startIndex);
    case 'get_books_by_isbn':
      return searchByIsbn(args.isbn ?? '', startIndex);
    case 'get_books_by_subject':
      return searchBySubject(args.subject ?? '', startIndex);
    case 'get_books_by_publisher':
      return searchByPublisher(args.publisher ?? '', startIndex);
    case 'get_books_by_lccn':
      return searchByLccn(args.lccn ?? '', startIndex);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function searchBooks(query: string, startIndex: number): Promise<GoogleBooksResult> {
  const tool = await selectTool(query, TOOLS, SYSTEM_PROMPT);
  if (!tool) return { items: [], totalItems: 0 };
  return runTool(tool.name, tool.args, startIndex);
}
