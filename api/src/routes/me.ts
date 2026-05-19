import { FastifyInstance } from 'fastify';

export default async function meRoutes(fastify: FastifyInstance) {
  fastify.get('/api/me', async (req, reply) => {
    if (!req.session.authenticated) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    return reply.send({
      isLoggedIn: true,
      expiresAt: req.session.expiresAt,
    });
  });
}
