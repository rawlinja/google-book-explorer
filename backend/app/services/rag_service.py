import tiktoken
from openai import AsyncOpenAI

_encoder = tiktoken.encoding_for_model("text-embedding-3-small")


def chunk_text(text: str, max_tokens: int = 300, overlap: int = 40) -> list[str]:
    tokens = _encoder.encode(text)
    chunks: list[str] = []
    start = 0
    while start < len(tokens):
        end = start + max_tokens
        slice_ = tokens[start:end]
        decoded = _encoder.decode(slice_)
        if decoded:
            chunks.append(decoded)
        if len(slice_) < max_tokens:
            break
        start += max_tokens - overlap
    return chunks


async def embed_texts(texts: list[str], batch_size: int = 25) -> list[list[float]]:
    client = AsyncOpenAI()
    results: list[list[float]] = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = await client.embeddings.create(
            model="text-embedding-3-small", input=batch
        )
        results.extend([d.embedding for d in response.data])
    return results


async def embed_query(q: str) -> list[float]:
    client = AsyncOpenAI()
    response = await client.embeddings.create(model="text-embedding-3-small", input=q)
    return response.data[0].embedding


async def generate_answer(question: str, chunks: list[str]) -> str:
    client = AsyncOpenAI()
    context = "\n\n".join(f"# Chunk {i + 1}\n{c}" for i, c in enumerate(chunks))
    prompt = "\n".join([
        "You are a knowledgeable assistant. Answer using only the context below.",
        "",
        "QUESTION:",
        question,
        "",
        "CONTEXT:",
        context,
        "",
        "Answer concisely.",
    ])
    response = await client.chat.completions.create(
        model="gpt-4.1",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    return response.choices[0].message.content or ""
