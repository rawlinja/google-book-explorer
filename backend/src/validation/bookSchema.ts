import { z } from 'zod';

export const BookSchema = z.object({
  volumeId: z.string(),
  title: z.string(),
  authors: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  description: z.string().optional(),
  metadata: z.any().optional(),
});
