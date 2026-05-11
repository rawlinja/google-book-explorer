import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch
from app.main import app


@pytest.mark.asyncio
async def test_ingest_book():
    mock_conn = AsyncMock()
    mock_conn.fetchrow = AsyncMock(return_value={"id": 1})
    mock_conn.execute = AsyncMock()
    mock_pool = MagicMock()
    mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

    with (
        patch("app.routers.rag.get_pool", new_callable=AsyncMock, return_value=mock_pool),
        patch(
            "app.routers.rag.embed_texts",
            new_callable=AsyncMock,
            return_value=[[0.1] * 1536],
        ),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            res = await client.post(
                "/rag/ingest",
                json={
                    "volumeId": "vol1",
                    "title": "Test Book",
                    "description": "A test book about testing",
                },
            )

    assert res.status_code == 200
    assert res.json()["ok"] is True


@pytest.mark.asyncio
async def test_rag_generate_returns_answer():
    mock_conn = AsyncMock()
    mock_conn.fetch = AsyncMock(
        return_value=[{"content": "Python is a programming language."}]
    )
    mock_pool = MagicMock()
    mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

    with (
        patch("app.routers.rag.get_pool", new_callable=AsyncMock, return_value=mock_pool),
        patch("app.routers.rag.get_context", new_callable=AsyncMock, return_value=None),
        patch("app.routers.rag.set_context", new_callable=AsyncMock),
        patch(
            "app.routers.rag.embed_query",
            new_callable=AsyncMock,
            return_value=[0.1] * 1536,
        ),
        patch(
            "app.routers.rag.generate_answer",
            new_callable=AsyncMock,
            return_value="Python is great for RAG.",
        ),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            res = await client.post(
                "/rag/generate",
                json={"q": "What is Python?", "sessionId": "sess-1"},
            )

    assert res.status_code == 200
    assert res.json()["answer"] == "Python is great for RAG."
