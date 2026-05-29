import OpenAI from 'openai';

export const SYSTEM_PROMPT = `You are a book search assistant. Always call exactly one tool.
- Title → get_books_by_title ("The Shining", "find a book called...")
- Author → get_books_by_author ("books by Stephen King", "Stephen King novels")
- ISBN → get_books_by_isbn (any 10 or 13-digit number)
- Subject/genre → get_books_by_subject ("horror books", "books about climate")
- Publisher → get_books_by_publisher ("Penguin books", "published by O'Reilly")
- LCCN → get_books_by_lccn (Library of Congress number)
If the query is ambiguous (e.g. a person's name with no context), prefer author.`;

export const TOOLS: OpenAI.Responses.Tool[] = [
  {
    type: 'function',
    name: 'get_books_by_title',
    description:
      'Search Google Books by title. Use when the query is clearly a book title. Do not use for author names.',
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
    description:
      'Search Google Books by author name. Use when the user names a person or asks for works by someone.',
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
    description:
      'Search Google Books by ISBN. Use when the query is or contains a numeric ISBN (10 or 13 digits, with or without hyphens).',
    parameters: {
      type: 'object',
      properties: { isbn: { type: 'string' } },
      required: ['isbn'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_books_by_subject',
    description:
      "Search Google Books by subject, genre, or theme. Use when the user asks for books about a topic — not a specific title or author. Examples: 'horror', 'machine learning', 'World War II'.",
    parameters: {
      type: 'object',
      properties: { subject: { type: 'string' } },
      required: ['subject'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_books_by_publisher',
    description:
      'Search Google Books by publisher name. Use when the user asks for books from a specific publisher.',
    parameters: {
      type: 'object',
      properties: { publisher: { type: 'string' } },
      required: ['publisher'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_books_by_lccn',
    description:
      'Search Google Books by Library of Congress Control Number (LCCN). Use when the query contains an LCCN — a unique catalog identifier, distinct from an ISBN.',
    parameters: {
      type: 'object',
      properties: { lccn: { type: 'string' } },
      required: ['lccn'],
      additionalProperties: false,
    },
    strict: true,
  },
];
