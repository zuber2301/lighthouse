import time
import asyncio
from typing import Optional
from app.core.config import settings

# If a Redis URL is configured we delegate to the redis client; otherwise
# fall back to a simple in-process TTL cache implemented below.
USE_REDIS = bool(settings.REDIS_URL)

if USE_REDIS:  # lazy import to avoid hard dependency when not configured
    from app.core.redis_client import (
        get_balance as _redis_get_balance,
        set_balance as _redis_set_balance,
        invalidate_balance as _redis_invalidate_balance,
    )


class SimpleTTLCache:
    """A very small process-local TTL cache for numeric balances.

    This is intentionally simple (dict + expiry) to avoid extra deps.
    Suitable for single-process dev/test use. For production use a
    distributed cache (Redis) should replace this.
    """

    def __init__(self):
        self._data: dict[str, tuple[int, float]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[int]:
        async with self._lock:
            v = self._data.get(key)
            if not v:
                return None
            value, expires_at = v
            if time.time() > expires_at:
                # expired
                del self._data[key]
                return None
            return value

    async def set(self, key: str, value: int, ttl: int = 60) -> None:
        expires_at = time.time() + ttl
        async with self._lock:
            self._data[key] = (value, expires_at)

    async def invalidate(self, key: str) -> None:
        async with self._lock:
            if key in self._data:
                del self._data[key]


# module-level cache instance for in-memory fallback
_local_cache = SimpleTTLCache()


async def get_cached_balance(user_key: str) -> Optional[int]:
    if USE_REDIS:
        # user_key format expected: balance:{tenant}:{user}
        try:
            _, tenant, user_id = user_key.split(":", 2)
        except Exception:
            return None
        return await _redis_get_balance(tenant, user_id)
    return await _local_cache.get(user_key)


async def set_cached_balance(user_key: str, value: int, ttl: int = 60) -> None:
    if USE_REDIS:
        try:
            _, tenant, user_id = user_key.split(":", 2)
        except Exception:
            return
        await _redis_set_balance(tenant, user_id, value, ttl=ttl)
        return
    await _local_cache.set(user_key, value, ttl=ttl)


async def invalidate_cached_balance(user_key: str) -> None:
    if USE_REDIS:
        try:
            _, tenant, user_id = user_key.split(":", 2)
        except Exception:
            return
        await _redis_invalidate_balance(tenant, user_id)
        return
    await _local_cache.invalidate(user_key)
