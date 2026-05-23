import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../hooks/requireAuth.js';
import { getBookshelves, addToShelf, removeFromShelf } from '../services/bookshelf.js';

const shelfParamSchema = z.object({
  shelfId: z.coerce.number().int().min(0),
});

const addVolumeSchema = z.object({
  volumeId: z.string().min(1),
});

export default async function bookshelvesRoutes(fastify: FastifyInstance) {
  fastify.get('/api/bookshelves', { onRequest: requireAuth }, async (req, reply) => {
    try {
      const shelves = await getBookshelves(req.session.sessionId, fastify.redis);
      return reply.send({ shelves });
    } catch {
      return reply.status(502).send({ error: 'Failed to fetch bookshelves' });
    }
  });

  fastify.post('/api/bookshelves/:shelfId/add', { onRequest: requireAuth }, async (req, reply) => {
    const paramParsed = shelfParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return reply.status(400).send({ error: 'Invalid shelf ID' });
    }

    const queryParsed = addVolumeSchema.safeParse(req.query);
    if (!queryParsed.success) {
      return reply.status(400).send({ error: 'Missing or invalid query parameter: volumeId' });
    }

    try {
      await addToShelf(
        req.session.sessionId,
        paramParsed.data.shelfId,
        queryParsed.data.volumeId,
        fastify.redis
      );
      return reply.send({ ok: true });
    } catch {
      return reply.status(502).send({ error: 'Failed to add book to shelf' });
    }
  });

  fastify.post(
    '/api/bookshelves/:shelfId/remove',
    { onRequest: requireAuth },
    async (req, reply) => {
      const paramParsed = shelfParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        return reply.status(400).send({ error: 'Invalid shelf ID' });
      }

      const queryParsed = addVolumeSchema.safeParse(req.query);
      if (!queryParsed.success) {
        return reply.status(400).send({ error: 'Missing or invalid query parameter: volumeId' });
      }

      try {
        await removeFromShelf(
          req.session.sessionId,
          paramParsed.data.shelfId,
          queryParsed.data.volumeId,
          fastify.redis
        );
        return reply.send({ ok: true });
      } catch {
        return reply.status(502).send({ error: 'Failed to remove book from shelf' });
      }
    }
  );
}
