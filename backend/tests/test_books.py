import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch
from app.main import app

MOCK_BOOKS = [
    {
        "id": "abc123",
        "title": "Clean Code",
        "authors": ["Robert C. Martin"],
        "thumbnail": None,
        "publishedDate": "2008",
        "description": "A handbook of agile software craftsmanship",
        "pageCount": 431,
        "categories": ["Computers"],
        "infoLink": "https://books.google.com/books?id=abc123",
    }
]


@pytest.mark.asyncio
async def test_book_search_returns_results():
    with patch(
        "app.routers.books.answer_with_tools",
        new_callable=AsyncMock,
        return_value=(MOCK_BOOKS, 1),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            res = await client.get("/books/search?q=clean+code")

    assert res.status_code == 200
    body = res.json()
    assert body["totalItems"] == 1
    assert body["items"][0]["volumeInfo"]["title"] == "Clean Code"


@pytest.mark.asyncio
async def test_book_search_passes_start_index_for_page_2():
    with patch(
        "app.routers.books.answer_with_tools",
        new_callable=AsyncMock,
        return_value=(MOCK_BOOKS, 50),
    ) as mock_fn:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            await client.get("/books/search?q=clean+code&page=2")

    mock_fn.assert_called_once_with("clean code", 10)


@pytest.mark.asyncio
async def test_book_search_returns_total_from_api():
    with patch(
        "app.routers.books.answer_with_tools",
        new_callable=AsyncMock,
        return_value=(MOCK_BOOKS, 87),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            res = await client.get("/books/search?q=python")

    assert res.json()["totalItems"] == 87


@pytest.mark.asyncio
async def test_book_search_missing_query():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/books/search")

    assert res.status_code == 422
