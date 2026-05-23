import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from '../../hooks/requireAuth.js';
import type { FastifyRequest, FastifyReply } from 'fastify';

function makeReply() {
  const reply = { status: vi.fn(), send: vi.fn() };
  reply.status.mockReturnValue(reply);
  return reply as unknown as FastifyReply;
}

function makeRequest(authenticated: boolean | undefined) {
  return { session: { authenticated } } as unknown as FastifyRequest;
}

describe('requireAuth', () => {
  it('does nothing when session is authenticated', async () => {
    const req = makeRequest(true);
    const reply = makeReply();
    await requireAuth(req, reply);
    expect(reply.status).not.toHaveBeenCalled();
  });

  it('returns 401 when session is not authenticated', async () => {
    const req = makeRequest(false);
    const reply = makeReply();
    await requireAuth(req, reply);
    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized. Please log in.' });
  });

  it('returns 401 when session.authenticated is undefined', async () => {
    const req = makeRequest(undefined);
    const reply = makeReply();
    await requireAuth(req, reply);
    expect(reply.status).toHaveBeenCalledWith(401);
  });
});
