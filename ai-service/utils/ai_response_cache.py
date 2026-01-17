"""
Persistent disk-based TTL cache for AI responses.
Caches final JSON responses to reduce AI generation costs.
Cache survives service restarts.
"""

import logging
from diskcache import Cache
from pathlib import Path

logger = logging.getLogger(__name__)

# Get project root directory
project_root = Path(__file__).parent.parent
cache_dir = project_root / ".ai_cache"

# Global persistent cache: ~500MB size limit, TTL enforced per item
ai_response_cache = Cache(
    directory=str(cache_dir),
    size_limit=1024 * 1024 * 500  # 500MB
)

logger.info(f"📦 Persistent cache initialized at: {cache_dir}")


def build_cache_key(
    endpoint: str,
    grade: int | None = None,
    subject: str | None = None,
    topic: str | None = None,
    extra: str | None = None
) -> str:
    """
    Build a cache key from endpoint and parameters.
    
    Args:
        endpoint: Name of the endpoint (e.g., "scenario", "pyq", "flashcards")
        grade: Grade level
        subject: Subject name
        topic: Topic name
        extra: Any extra identifier
    
    Returns:
        Cache key string like "scenario:10:physics:reflection of light"
    """
    parts = [endpoint]
    
    if grade is not None:
        parts.append(str(grade))
    
    if subject:
        parts.append(subject.lower().strip())
    
    if topic:
        parts.append(topic.lower().strip())
    
    if extra:
        parts.append(extra.lower().strip())
    
    return ":".join(parts)


def get_from_cache(cache_key: str):
    """
    Get value from persistent cache.
    
    Args:
        cache_key: The cache key to look up
    
    Returns:
        Cached value if exists and not expired, None otherwise
    """
    value = ai_response_cache.get(cache_key)
    
    if value is not None:
        logger.info(f"⚡ CACHE HIT (persistent): {cache_key}")
        return value
    
    logger.info(f"🐢 CACHE MISS: {cache_key}")
    return None


def set_cache(cache_key: str, value: dict):
    """
    Store value in persistent cache with TTL.
    
    Args:
        cache_key: The cache key
        value: The value to cache (must be dict or list)
    """
    # Set with 1 hour expiration
    ai_response_cache.set(cache_key, value, expire=3600)
    logger.info(f"💾 Cached response (persistent, TTL=1h): {cache_key}")


def clear_cache():
    """
    Clear all cached data.
    Useful for testing or maintenance.
    """
    ai_response_cache.clear()
    logger.info("🧹 Cache cleared")
