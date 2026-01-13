import express from 'express';
import { embedQuery, searchChunks } from '../rag/query.js';
import { getContext, setContext } from '../lib/cache.js';
import { makeRagPrompt } from '../rag/prompt.js';
import pool from '../database/connection.js';
import OpenAI from 'openai';
import { BookSchema } from '../validation/bookSchema.js';
import { ingestBook } from '../rag/ingest.js';
import { success, error } from '../lib/response.js';

const router = express.Router();

// TODO: Consider batching ingestion and adding transaction boundaries for bulk inserts.
// TODO: Improve error observability and validation feedback for ingestion failures.
router.post('/ingest/book', async (req, res) => {
  try {
    console.log('[POST /ingest/book] Request body:', req.body);
    const parseResult = BookSchema.safeParse(req.body);
    console.log('[POST /ingest/book] Validation result:', parseResult);
    if (!parseResult.success) {
      // ZodError has .issues, not .errors
      console.error('[POST /ingest/book] Validation failed:', parseResult.error.issues);
      return error(res, 'Invalid book payload', parseResult.error.issues, 400);
    }
    const { volumeId, title, authors, categories, description, metadata } = parseResult.data;
    console.log('[POST /ingest/book] Parsed data:', parseResult.data);
    const result = await ingestBook({
      volumeId,
      title,
      authors,
      categories,
      description,
      metadata,
    });
    console.log('[POST /ingest/book] Ingest result:', result);
    return success(
      res,
      {
        bookId: result.bookId,
        chunksInserted: result.chunksInserted,
      },
      201
    );
  } catch (err) {
    console.error('[POST /ingest/book] Ingest failed:', err);
    return error(res, 'Internal server error', err, 500);
  }
});

// /search route from rag-query
// TODO: Add rate limiting and input validation for search queries.
// TODO: Surface cache hit/miss metrics for observability.
router.post('/search', async (req, res) => {
  const { q, sessionId } = req.body;
  if (!q || !sessionId) {
    return res.status(400).json({ ok: false, error: 'q and sessionId required' });
  }
  try {
    const cached = await getContext(sessionId);
    if (cached) {
      return res.json({
        ok: true,
        source: 'cache',
        prompt: makeRagPrompt(q, cached),
        context: cached,
      });
    }
    const vector = await embedQuery(q);
    const vectorStr = JSON.stringify(vector);
    // If searchChunks expects a JS array, update its implementation to use vectorStr
    const rows = await searchChunks(vectorStr, 5);
    const chunks = rows.map((r) => r.content);
    await setContext(sessionId, chunks);
    return res.json({ ok: true, source: 'db', prompt: makeRagPrompt(q, chunks), context: chunks });
  } catch (err) {
    console.error('❌ search error:', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

// TODO: Move OpenAI client instantiation to a shared service for reuse and testability.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
// TODO: Parameterize prompt construction for different LLMs or use-cases.
function buildGroundedPrompt(question: string, rows: { content: string }[]): string {
  const context = rows.map((r, i) => `# Chunk ${i + 1}\n${r.content}`).join('\n\n');
  return [
    'You are a senior engineer providing grounded answers from database context.',
    '',
    'QUESTION:',
    question,
    '',
    'CONTEXT:',
    context,
    '',
    'Answer only using the context above. Return in JSON if possible.',
  ]
    .join('\n')
    .trim();
}

// /generate route from rag-query
// TODO: Validate embedding dimensions before querying Postgres.
// TODO: Add error handling for upstream OpenAI failures and DB errors.
router.post('/generate', async (req, res) => {
  const { q } = req.body;
  if (!q?.trim()) {
    return res.status(400).json({ ok: false, error: 'Query text required' });
  }
  try {
    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: q,
    });
    const vector = emb.data[0].embedding;
    const dim = vector.length;
    console.log(`query embedded (dim=${dim})`);
    const vectorStr = JSON.stringify(vector);
    const rows = await pool.query(
      `SELECT content FROM book_chunks ORDER BY embedding <=> $1::vector LIMIT $2;`,
      [vectorStr, 5]
    );
    const chunks = rows.rows;
    const groundedPrompt = buildGroundedPrompt(q, chunks);
    const rsp = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: groundedPrompt }],
      temperature: 0,
    });
    const answer = rsp.choices[0].message.content ?? '';
    res.json({ ok: true, source: 'llm', answer });
  } catch (err) {
    console.error('❌ LLM generation failed:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

export default router;
