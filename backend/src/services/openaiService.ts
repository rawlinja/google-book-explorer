import { runTool } from '../clients/googlebooks.client.js';
import { getOpenAIClient } from '../lib/openai.js';

export const tools: any[] = [
  {
    type: 'function',
    name: 'get_books_by_title',
    description:
      'Search Google Books by matching book titles. Use when the user looks for a book by title or title keywords.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Exact or partial title from the user.' },
      },
      required: ['title'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_books_by_author',
    description:
      'Search Google Books by author name. Use when the user wants books by a specific author.',
    parameters: {
      type: 'object',
      properties: {
        author: { type: 'string', description: 'Author name from the user.' },
      },
      required: ['author'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function',
    name: 'get_books_by_isbn',
    description:
      'Search Google Books by ISBN-10 or ISBN-13. Use when the user provides an ISBN or wants an exact edition.',
    parameters: {
      type: 'object',
      properties: {
        isbn: {
          type: 'string',
          description: 'ISBN-10 or ISBN-13 (keep as string for leading zeros/hyphens).',
        },
      },
      required: ['isbn'],
      additionalProperties: false,
    },
    strict: true,
  },
];

export async function answerWithTools(userText: string) {
  let input: any[] = [
    { role: 'system', content: 'You are a helpful book assistant. Use tools when needed.' },
    { role: 'user', content: userText },
  ];

  const resp = await getOpenAIClient().responses.create({
    model: 'gpt-4.1',
    input,
    tools,
    tool_choice: 'auto',
  });

  console.log('OpenAI response:', resp);

  const output = resp.output ?? [];
  const toolCalls = output.filter((o: any) => o.type === 'function_call') as any[];

  if (toolCalls.length === 0) {
    const texts: string[] = [];
    for (const item of output) {
      if (item.type === 'message') {
        if (typeof item.content === 'string') texts.push(item.content);
        else if (Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.type === 'output_text') texts.push(part.text);
          }
        }
      }
    }
    return texts.join('\n').trim();
  }
  const toolOutputs = [];
  let finalOut = [];
  for (const call of toolCalls) {
    const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
    const result = await runTool(call.name, args);

    finalOut.push(...result);

    console.log(`Tool ${call.name} called with args:`, args, 'returned:', result);

    toolOutputs.push({
      type: 'function_call_output',
      call_id: call.call_id,
      output: JSON.stringify(result),
    });
  }

  input = [...input, ...output, ...toolOutputs];

  return finalOut;
}
