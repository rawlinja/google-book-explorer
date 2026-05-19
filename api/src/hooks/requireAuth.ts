import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.session.authenticated) {
    return reply.status(401).send({ error: 'Unauthorized. Please log in.' });
  }
}
