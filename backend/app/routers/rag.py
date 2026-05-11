from fastapi import APIRouter, HTTPException
from app.database import get_pool
from app.redis_client import get_context, set_context
from app.schemas import IngestRequest, RagGenerateRequest, RagGenerateResponse, RagSearchRequest
from app.services.rag_service import chunk_text, embed_query, embed_texts, generate_answer

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/ingest")
async def ingest_book(body: IngestRequest):
    doc = "\n".join(filter(None, [
        f"Title: {body.title}",
        f"Description: {body.description}" if body.description else None,
    ])).strip()
    chunks = chunk_text(doc)
    if not chunks:
        raise HTTPException(status_code=400, detail="No content to embed")
    vectors = await embed_texts(chunks)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO books (volume_id, title, description, authors, categories)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (volume_id) DO UPDATE
               SET title = EXCLUDED.title,
                   description = EXCLUDED.description,
                   updated_at = now()
               RETURNING id""",
            body.volumeId,
            body.title,
            body.description,
            body.authors,
            body.categories,
        )
        book_id = row["id"]
        for i, (chunk, vector) in enumerate(zip(chunks, vectors)):
            await conn.execute(
                """INSERT INTO book_chunks (book_id, chunk_index, content, embedding)
                   VALUES ($1, $2, $3, $4)""",
                book_id,
                i,
                chunk,
                vector,
            )
    return {"ok": True, "bookId": book_id, "chunksInserted": len(chunks)}


@router.post("/search")
async def rag_search(body: RagSearchRequest):
    vector = await embed_query(body.q)
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT book_id, chunk_index, content FROM book_chunks ORDER BY embedding <=> $1 LIMIT $2",
            vector,
            body.k,
        )
    return {"ok": True, "chunks": [dict(r) for r in rows]}


@router.post("/generate", response_model=RagGenerateResponse)
async def rag_generate(body: RagGenerateRequest):
    cached = await get_context(body.sessionId)
    if cached:
        answer = await generate_answer(body.q, cached)
        return RagGenerateResponse(ok=True, source="cache", answer=answer)
    vector = await embed_query(body.q)
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT content FROM book_chunks ORDER BY embedding <=> $1 LIMIT 5",
            vector,
        )
    chunks = [r["content"] for r in rows]
    await set_context(body.sessionId, chunks)
    answer = await generate_answer(body.q, chunks)
    return RagGenerateResponse(ok=True, source="db", answer=answer)
