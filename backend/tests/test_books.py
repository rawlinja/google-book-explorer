import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch
from app.main import app


@pytest.mark.asyncio
async def test_book_search_returns_results():
    mock_books = [
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
    with patch(
        "app.routers.books.answer_with_tools",
        new_callable=AsyncMock,
        return_value=mock_books,
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
async def test_book_search_missing_query():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        res = await client.get("/books/search")

    assert res.status_code == 422
