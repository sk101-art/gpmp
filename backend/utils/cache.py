"""
Redis Caching Layer

Provides caching for:
- Match scores (keyed on job_id:resume_id)
- Gap analysis (keyed on resume_id:job_id hash)
- LLM responses (keyed on content hash)
- Embeddings (keyed on text hash)
"""

import redis
import json
import hashlib
import logging
from typing import Any, Optional
import os

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Cache TTL values (in seconds)
CACHE_TTL_SCORES = 86400  # 24 hours for match scores
CACHE_TTL_GAPS = 21600    # 6 hours for gap analysis
CACHE_TTL_EMBEDDINGS = 2592000  # 30 days for embeddings
CACHE_TTL_LLM = 86400  # 24 hours for LLM responses


def get_redis_client():
    """Get Redis client instance."""
    try:
        return redis.from_url(REDIS_URL, decode_responses=True)
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {str(e)}")
        return None


def _make_key(prefix: str, *args) -> str:
    """Create cache key from prefix and arguments."""
    key_parts = [prefix] + [str(arg) for arg in args]
    return ":".join(key_parts)


def _hash_content(content: str) -> str:
    """Create hash of content for cache key."""
    return hashlib.md5(content.encode()).hexdigest()


async def get_match_score(job_id: int, resume_id: int) -> Optional[dict]:
    """Get cached match score."""
    try:
        client = get_redis_client()
        if not client:
            return None

        key = _make_key("match", job_id, resume_id)
        cached = client.get(key)

        if cached:
            logger.info(f"Cache hit: match score {key}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"Cache get error: {str(e)}")

    return None


async def set_match_score(job_id: int, resume_id: int, score_data: dict, ttl: int = CACHE_TTL_SCORES):
    """Cache match score."""
    try:
        client = get_redis_client()
        if not client:
            return

        key = _make_key("match", job_id, resume_id)
        client.setex(key, ttl, json.dumps(score_data))
        logger.info(f"Cached match score: {key}")
    except Exception as e:
        logger.warning(f"Cache set error: {str(e)}")


async def get_gap_analysis(resume_id: int, job_id: int) -> Optional[dict]:
    """Get cached gap analysis."""
    try:
        client = get_redis_client()
        if not client:
            return None

        key = _make_key("gap", resume_id, job_id)
        cached = client.get(key)

        if cached:
            logger.info(f"Cache hit: gap analysis {key}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"Cache get error: {str(e)}")

    return None


async def set_gap_analysis(resume_id: int, job_id: int, gap_data: dict, ttl: int = CACHE_TTL_GAPS):
    """Cache gap analysis."""
    try:
        client = get_redis_client()
        if not client:
            return

        key = _make_key("gap", resume_id, job_id)
        client.setex(key, ttl, json.dumps(gap_data))
        logger.info(f"Cached gap analysis: {key}")
    except Exception as e:
        logger.warning(f"Cache set error: {str(e)}")


async def get_embedding(text: str) -> Optional[list]:
    """Get cached embedding."""
    try:
        client = get_redis_client()
        if not client:
            return None

        content_hash = _hash_content(text)
        key = _make_key("embed", content_hash)
        cached = client.get(key)

        if cached:
            logger.info(f"Cache hit: embedding {key}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"Cache get error: {str(e)}")

    return None


async def set_embedding(text: str, embedding: list, ttl: int = CACHE_TTL_EMBEDDINGS):
    """Cache embedding."""
    try:
        client = get_redis_client()
        if not client:
            return

        content_hash = _hash_content(text)
        key = _make_key("embed", content_hash)
        client.setex(key, ttl, json.dumps(embedding))
        logger.info(f"Cached embedding: {key}")
    except Exception as e:
        logger.warning(f"Cache set error: {str(e)}")


async def invalidate_cache(prefix: str, *args):
    """Invalidate cache entries matching pattern."""
    try:
        client = get_redis_client()
        if not client:
            return

        key_pattern = _make_key(prefix, *args) + "*"
        cursor = 0
        deleted = 0

        while True:
            cursor, keys = client.scan(cursor, match=key_pattern)
            if keys:
                deleted += client.delete(*keys)
            if cursor == 0:
                break

        logger.info(f"Invalidated {deleted} cache entries for pattern: {key_pattern}")
    except Exception as e:
        logger.warning(f"Cache invalidation error: {str(e)}")


async def flush_all():
    """Flush all cache (use with caution!)."""
    try:
        client = get_redis_client()
        if not client:
            return

        client.flushdb()
        logger.warning("All cache flushed!")
    except Exception as e:
        logger.warning(f"Cache flush error: {str(e)}")
