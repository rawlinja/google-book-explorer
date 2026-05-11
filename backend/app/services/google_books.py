import httpx
from app.config import settings


async def google_books_search(q: str) -> list[dict]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://www.googleapis.com/books/v1/volumes",
            params={"q": q, "maxResults": "10", "key": settings.google_books_api_key},
        )
        r.raise_for_status()
    data = r.json()
    return [
        {
            "id": item.get("id"),
            "title": item.get("volumeInfo", {}).get("title"),
            "authors": item.get("volumeInfo", {}).get("authors", []),
            "thumbnail": item.get("volumeInfo", {}).get("imageLinks", {}).get("thumbnail"),
            "publishedDate": item.get("volumeInfo", {}).get("publishedDate"),
            "description": item.get("volumeInfo", {}).get("description"),
            "pageCount": item.get("volumeInfo", {}).get("pageCount"),
            "categories": item.get("volumeInfo", {}).get("categories", []),
            "infoLink": item.get("volumeInfo", {}).get("infoLink"),
        }
        for item in data.get("items", [])
    ]


async def run_tool(name: str, args: dict) -> list[dict]:
    match name:
        case "get_books_by_title":
            return await google_books_search(f"intitle:{args['title']}")
        case "get_books_by_author":
            return await google_books_search(f"inauthor:{args['author']}")
        case "get_books_by_isbn":
            return await google_books_search(f"isbn:{args['isbn']}")
        case _:
            raise ValueError(f"Unknown tool: {name}")
