import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../hooks/requireAuth.js';
import { searchBooks } from '../services/bookSearch.js';

const searchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
});

export default async function booksRoutes(fastify: FastifyInstance) {
  fastify.get('/api/books/search', { onRequest: requireAuth }, async (req, reply) => {
    const parsed = searchSchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Missing or invalid query parameter: q' });
    }

    const { q, page } = parsed.data;
    const startIndex = (page - 1) * 10;
    const { items, totalItems } = await searchBooks(q, startIndex);

    return reply.send({ totalItems, items });
  });
}
