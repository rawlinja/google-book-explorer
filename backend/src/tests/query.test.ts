import { retrieveRelevantChunks } from '../rag/query.js';

describe('retrieveRelevantChunks', () => {
  it('should retrieve relevant chunks for a query', async () => {
    const query = 'What is the main idea?';
    const bookId = 1;
    const chunks = await retrieveRelevantChunks(query, bookId, 3);
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeLessThanOrEqual(3);
    expect(chunks.every((chunk) => typeof chunk.text === 'string')).toBe(true);
  });
});
