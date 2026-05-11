from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import close_pool, get_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(title="Google Book Explorer Backend", lifespan=lifespan)


@app.get("/health")
async def health():
    return {"ok": True}
