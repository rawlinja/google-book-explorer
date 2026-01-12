import { z } from 'zod';

export const ChunkSchema = z.object({
  bookId: z.string(),
  content: z.string(),
  embedding: z.array(z.number()),
});
