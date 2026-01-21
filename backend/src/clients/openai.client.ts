import { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources';
import { getOpenAIClient } from '../lib/openai.js';

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_books_by_title',
      description:
        'Search for books using the Google Books API by matching book titles. Use this function when the user is looking for specific books by their title or wants to find books with titles containing certain keywords.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The search query string to send to the Google Books API. This should contain the book title or title keywords the user is searching for.',
          },
          title: {
            type: 'string',
            description:
              'The specific title of the book to search for. This should be the exact or partial title as provided by the user.',
          },
        },
        required: ['query', 'title'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_books_by_author',
      description:
        "Search for books using the Google Books API by author name. Use this function when the user wants to find books written by a specific author or when they mention an author's name in their request.",
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              "The search query string to send to the Google Books API. This should include the author's name and any additional search terms.",
          },
          author: {
            type: 'string',
            description:
              "The author's name to search for. This should be the full name or partial name of the author as provided by the user (e.g., 'Stephen King', 'J.K. Rowling', 'Tolkien').",
          },
        },
        required: ['query', 'author'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_books_by_isbn',
      description:
        'Search for a specific book using the Google Books API by its ISBN (International Standard Book Number). Use this function when the user provides an ISBN-10 or ISBN-13 number, or when they want to find the exact edition of a book.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The search query string to send to the Google Books API. This should include the ISBN and any additional search terms if needed.',
          },
          isbn: {
            type: 'string',
            description:
              "The ISBN number to search for. This can be either ISBN-10 (10 digits) or ISBN-13 (13 digits) format. Should be provided as a string to preserve leading zeros and hyphens (e.g., '978-0-123456-78-9' or '0123456789').",
          },
        },
        required: ['query', 'isbn'],
        additionalProperties: false,
      },
    },
  },
];

async function sendChatCompletion(
  messages: Array<ChatCompletionMessageParam>
): Promise<ChatCompletionMessageToolCall[] | undefined> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    tools: tools as any,
  });

  return completion.choices[0].message.tool_calls;
}

export { sendChatCompletion };
