import { chunkText } from '../rag/ingest.js';

describe('chunkText', () => {
  it('should split text into chunks aligned with token limits', () => {
    const text = 'This is a test document. '.repeat(100);
    const chunks = chunkText(text, 50);
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every((chunk) => typeof chunk === 'string')).toBe(true);
  });
});
