import httpx
from app.config import settings


async def google_books_search(q: str, start_index: int = 0) -> tuple[list[dict], int]:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://www.googleapis.com/books/v1/volumes",
            params={
                "q": q,
                "maxResults": "10",
                "startIndex": str(start_index),
                "key": settings.google_books_api_key,
            },
        )
        r.raise_for_status()
    data = r.json()
    items = [
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
    return items, data.get("totalItems", 0)


async def run_tool(name: str, args: dict, start_index: int = 0) -> tuple[list[dict], int]:
    match name:
        case "get_books_by_title":
            return await google_books_search(f"intitle:{args['title']}", start_index)
        case "get_books_by_author":
            return await google_books_search(f"inauthor:{args['author']}", start_index)
        case "get_books_by_isbn":
            return await google_books_search(f"isbn:{args['isbn']}", start_index)
        case _:
            raise ValueError(f"Unknown tool: {name}")
