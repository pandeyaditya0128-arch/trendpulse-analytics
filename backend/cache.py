import time
import os

class MemoryCache:
    def __init__(self):
        self._store = {}
        print("Using In-Memory Cache Fallback.")

    def get(self, key: str):
        if key not in self._store:
            return None
        val, expiry = self._store[key]
        if expiry is not None and time.time() > expiry:
            del self._store[key]
            return None
        return val

    def set(self, key: str, value: str, expire: int = 3600):
        expiry = time.time() + expire if expire else None
        self._store[key] = (value, expiry)
        return True

    def delete(self, key: str):
        if key in self._store:
            del self._store[key]
            return True
        return False

# Setup cache
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

try:
    import redis
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True, socket_connect_timeout=2)
    # Test connection
    redis_client.ping()
    print("Redis connected successfully.")
    cache = redis_client
except Exception as e:
    print(f"Redis connection failed: {e}. Falling back to MemoryCache.")
    cache = MemoryCache()
