from fastapi import APIRouter
from app.schemas import BookSearchResponse
from app.services.book_search import answer_with_tools

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/search", response_model=BookSearchResponse)
async def search_books(q: str):
    books = await answer_with_tools(q)
    items = [
        {
            "id": b["id"],
            "volumeInfo": {
                "title": b["title"],
                "authors": b["authors"],
                "imageLinks": {
                    "thumbnail": b["thumbnail"],
                    "smallThumbnail": b["thumbnail"],
                },
            },
        }
        for b in books
    ]
    return BookSearchResponse(totalItems=len(items), items=items)
