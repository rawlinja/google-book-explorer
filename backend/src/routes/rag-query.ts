import express from 'express';
import { embedQuery, searchChunks } from '../rag/query.js';
import { getContext, setContext } from '../lib/cache.js';
import { makeRagPrompt } from '../rag/prompt.js';
import pool from '../database/connection.js';
import OpenAI from 'openai';

export const ragQueryRouter = express.Router();

ragQueryRouter.post('/search', async (req, res) => {
  const { q, sessionId } = req.body;
  if (!q || !sessionId) {
    return res.status(400).json({ ok: false, error: 'q and sessionId required' });
  }

  try {
    // 1. Cache-first context check
    const cached = await getContext(sessionId);
    if (cached) {
      return res.json({
        ok: true,
        source: 'cache',
        prompt: makeRagPrompt(q, cached),
        context: cached,
      });
    }

    // 2. Embed query
    const vector = await embedQuery(q);

    // 3. Retrieve relevant chunks from Postgres
    const rows = await searchChunks(vector, 5);
    const chunks = rows.map((r) => r.content);

    // 4. Cache context under this session
    await setContext(sessionId, chunks);

    // 5. Return augmented prompt shape (ready for GPT next)
    return res.json({ ok: true, source: 'db', prompt: makeRagPrompt(q, chunks), context: chunks });
  } catch (err) {
    console.error('❌ search error:', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Helper to build grounded RAG prompt from DB context
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

// ✅ POST /api/llm/generate
ragQueryRouter.post('/generate', async (req, res) => {
  const { q } = req.body;
  if (!q?.trim()) {
    return res.status(400).json({ ok: false, error: 'Query text required' });
  }

  try {
    // 1. Embed incoming question
    const emb = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: q,
    });
    const vector = emb.data[0].embedding;
    const dim = vector.length;
    console.log(`query embedded (dim=${dim})`);

    // 2. Retrieve relevant DB chunks using cosine distance
    const rows = await pool.query(
      `SELECT content FROM book_chunks ORDER BY embedding <=> $1::vector LIMIT $2;`,
      [vector, 5]
    );

    const chunks = rows.rows;
    const groundedPrompt = buildGroundedPrompt(q, chunks);

    // 3. Ask GPT for synthesis/generation based on DB context
    const rsp = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: groundedPrompt }],
      temperature: 0,
    });

    const answer = rsp.choices[0].message.content ?? '';

    res.json({ ok: true, source: 'llm', answer });
  } catch (err) {
    // Routes moved to rag.ts and consolidated.
    console.error('❌ generate error:', err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});
