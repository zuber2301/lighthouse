from typing import Optional, List
from app.core.config import settings

_redis = None


def _ensure_redis_import():
    try:
        import redis.asyncio as redis  # type: ignore
    except Exception as e:  # pragma: no cover - import guard
        raise RuntimeError("redis.asyncio library is required when REDIS_URL is set") from e
    return redis


async def get_redis():
    global _redis
    if _redis is not None:
        return _redis
    redis = _ensure_redis_import()
    _redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def get_balance(tenant: str, user_id: str) -> Optional[int]:
    r = await get_redis()
    key = f"balance:{tenant}:{user_id}"
    v = await r.get(key)
    if v is None:
        return None
    try:
        return int(v)
    except Exception:
        return None


async def set_balance(tenant: str, user_id: str, value: int, ttl: int = 60) -> None:
    r = await get_redis()
    key = f"balance:{tenant}:{user_id}"
    await r.set(key, int(value), ex=ttl)


async def invalidate_balance(tenant: str, user_id: str) -> None:
    r = await get_redis()
    key = f"balance:{tenant}:{user_id}"
    await r.delete(key)


async def push_social_feed(tenant: str, item: str, cap: Optional[int] = None) -> None:
    r = await get_redis()
    key = f"feed:{tenant}"
    await r.lpush(key, item)
    cap = cap or settings.SOCIAL_FEED_LENGTH
    await r.ltrim(key, 0, cap - 1)


async def get_social_feed(tenant: str, limit: int = 50) -> List[str]:
    r = await get_redis()
    key = f"feed:{tenant}"
    end = limit - 1
    return await r.lrange(key, 0, end)


async def rate_limit_increment(key: str, window_seconds: int = 60) -> int:
    """Increment a counter for `key` and set expiry to window_seconds when creating.

    Returns the new count.
    """
    r = await get_redis()
    # Use INCR and set expiry if newly created
    cnt = await r.incr(key)
    if cnt == 1:
        await r.expire(key, window_seconds)
    return int(cnt)
