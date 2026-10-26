import { describe, it, expect } from 'vitest';
import { Writable } from 'node:stream';
import Fastify from 'fastify';
import { loggerOptions } from '../../lib/logger.js';

const FAKE_KEY = 'AIzaFAKE-test-key-0000000000000000000';

function sdkError() {
  const config = {
    url: `https://books.googleapis.com/books/v1/volumes?q=x&key=${FAKE_KEY}`,
    params: { q: 'x', key: FAKE_KEY },
    headers: { Authorization: 'Bearer fake-user-token' },
  };
  return Object.assign(new Error('Service temporarily unavailable.'), {
    status: 503,
    config,
    response: {
      status: 503,
      config,
      data: { error: { code: 503, errors: [{ reason: 'backendFailed' }] } },
    },
  });
}

function captureLogs() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, done) {
      lines.push(chunk.toString());
      done();
    },
  });
  const app = Fastify({ logger: { ...loggerOptions('production'), stream } });
  return { log: app.log, output: () => lines.join('') };
}

describe('loggerOptions', () => {
  it('keeps API keys and auth headers from SDK errors out of the logs', () => {
    const { log, output } = captureLogs();

    log.error({ err: sdkError() }, 'books.search.failed');

    expect(output()).not.toContain(FAKE_KEY);
    expect(output()).not.toContain('fake-user-token');
  });

  it('still logs the status and Google error body', () => {
    const { log, output } = captureLogs();

    log.error({ err: sdkError() }, 'books.search.failed');

    const entry = JSON.parse(output());
    expect(entry.err.status).toBe(503);
    expect(entry.err.response.data.error.errors[0].reason).toBe('backendFailed');
  });

  it('logs at info level outside tests and silences test runs', () => {
    expect(loggerOptions('production').level).toBe('info');
    expect(loggerOptions('test').level).toBe('silent');
  });
});
