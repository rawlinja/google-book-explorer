import OpenAI from 'openai';
import { searchByTitle, searchByAuthor, searchByIsbn } from './googleBooks.js';
import type { GoogleBooksResult } from './googleBooks.js';

const TOOLS: OpenAI.Responses.Tool[] = [
  {
    type: 'function',
    name: 'get_books_by_title',
    description: 'Search Google Books by title. Use when the user looks for a book by title.',
    parameters: {
      type: 'object',
      properties: { title: { type: 'string' } },
      required: ['title'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_books_by_author',
    description: 'Search Google Books by author name.',
    parameters: {
      type: 'object',
      properties: { author: { type: 'string' } },
      required: ['author'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_books_by_isbn',
    description: 'Search Google Books by ISBN-10 or ISBN-13.',
    parameters: {
      type: 'object',
      properties: { isbn: { type: 'string' } },
      required: ['isbn'],
      additionalProperties: false,
    },
    strict: true,
  },
];

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
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function searchBooks(query: string, startIndex: number): Promise<GoogleBooksResult> {
  const client = new OpenAI();

  const response = await client.responses.create({
    model: 'gpt-4.1',
    input: [
      { role: 'system', content: 'You are a helpful book assistant. Use tools when needed.' },
      { role: 'user', content: query },
    ],
    tools: TOOLS,
    tool_choice: 'auto',
  });

  const toolCalls = (response.output ?? []).filter((o) => o.type === 'function_call');
  if (!toolCalls.length) return { items: [], totalItems: 0 };

  let totalItems = 0;
  const items = [];

  for (const call of toolCalls) {
    const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
    const result = await runTool(call.name, args, startIndex);
    items.push(...result.items);
    totalItems = Math.max(totalItems, result.totalItems);
  }

  return { items, totalItems };
}
