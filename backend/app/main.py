from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import close_pool, get_pool
from app.routers import books


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(title="Google Book Explorer Backend", lifespan=lifespan)

app.include_router(books.router)


@app.get("/health")
async def health():
    return {"ok": True}
