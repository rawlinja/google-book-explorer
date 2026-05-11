import json
import redis.asyncio as aioredis
from app.config import settings

_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def get_context(session_id: str) -> list[str] | None:
    raw = await get_redis().get(f"rag:ctx:{session_id}")
    if raw is None:
        return None
    return json.loads(raw)


async def set_context(session_id: str, chunks: list[str], ttl: int = 3600) -> None:
    await get_redis().setex(f"rag:ctx:{session_id}", ttl, json.dumps(chunks))
