import { getEmbeddings } from '../rag/ingest.js';

describe('getEmbeddings', () => {
  it('should return embeddings for input texts', async () => {
    const texts = ['Hello world', 'Test document'];
    const embeddings = await getEmbeddings(texts);
    expect(Array.isArray(embeddings)).toBe(true);
    expect(embeddings.length).toBe(texts.length);
    expect(embeddings[0]).toBeInstanceOf(Array);
    expect(typeof embeddings[0][0]).toBe('number');
  });
});
