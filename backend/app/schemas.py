from pydantic import BaseModel


class BookSearchResponse(BaseModel):
    totalItems: int
    items: list[dict]
    kind: str = "books#volumes"


class IngestRequest(BaseModel):
    volumeId: str
    title: str
    description: str | None = None
    authors: list[str] = []
    categories: list[str] = []


class RagSearchRequest(BaseModel):
    q: str
    k: int = 5


class RagGenerateRequest(BaseModel):
    q: str
    sessionId: str


class RagGenerateResponse(BaseModel):
    ok: bool
    source: str
    answer: str
