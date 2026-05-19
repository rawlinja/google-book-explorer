from fastapi import APIRouter, Query
from app.schemas import BookSearchResponse
from app.services.book_search import answer_with_tools

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/search", response_model=BookSearchResponse)
async def search_books(q: str, page: int = Query(1, ge=1)):
    start_index = (page - 1) * 10
    books, total_items = await answer_with_tools(q, start_index)
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
    return BookSearchResponse(totalItems=total_items, items=items)
