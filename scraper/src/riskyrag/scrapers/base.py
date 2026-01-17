"""Base scraper class for RiskyRag historical data scrapers.

This module provides the abstract base class that all scrapers must implement,
along with common utilities for rate limiting, caching, and retry logic.
"""

import asyncio
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path

import httpx
import structlog
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from riskyrag.core.types import HistoricalEvent, RawDocument

logger = structlog.get_logger()


class BaseScraper(ABC):
    """Abstract base class for historical data scrapers.

    Provides common functionality for:
    - HTTP client management with rate limiting
    - Retry logic for transient failures
    - Caching of raw documents
    - Logging and error handling
    """

    # Default rate limiting settings
    requests_per_second: float = 2.0
    max_concurrent_requests: int = 5

    # Retry settings
    max_retries: int = 3
    retry_wait_min: float = 1.0
    retry_wait_max: float = 30.0

    def __init__(
        self,
        cache_dir: Path | None = None,
        use_cache: bool = True,
    ) -> None:
        """Initialize the scraper.

        Args:
            cache_dir: Directory to store cached documents
            use_cache: Whether to use caching
        """
        self.cache_dir = cache_dir or Path(".cache")
        self.use_cache = use_cache
        self._semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        self._last_request_time = 0.0
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "BaseScraper":
        """Enter async context."""
        self._client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "RiskyRag Historical Scraper/1.0 "
                    "(https://github.com/riskyrag; educational project)"
                )
            },
        )
        return self

    async def __aexit__(self, *args: object) -> None:
        """Exit async context."""
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get the HTTP client, ensuring it's initialized."""
        if self._client is None:
            raise RuntimeError("Scraper must be used as async context manager")
        return self._client

    async def _rate_limit(self) -> None:
        """Enforce rate limiting between requests."""
        now = asyncio.get_event_loop().time()
        min_interval = 1.0 / self.requests_per_second
        elapsed = now - self._last_request_time

        if elapsed < min_interval:
            await asyncio.sleep(min_interval - elapsed)

        self._last_request_time = asyncio.get_event_loop().time()

    @retry(
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TimeoutException)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=30),
    )
    async def fetch(self, url: str) -> RawDocument:
        """Fetch a URL with rate limiting, retries, and caching.

        Args:
            url: The URL to fetch

        Returns:
            RawDocument containing the fetched content
        """
        # Check cache first
        if self.use_cache:
            cached = self._get_cached(url)
            if cached:
                logger.debug("Cache hit", url=url)
                return cached

        # Rate limit and fetch
        async with self._semaphore:
            await self._rate_limit()

            logger.debug("Fetching URL", url=url)
            response = await self.client.get(url)
            response.raise_for_status()

            doc = RawDocument(
                url=url,
                html=response.text,
                fetched_at=datetime.now(),
                source=self.name,
            )

            # Cache the result
            if self.use_cache:
                self._cache_document(doc)

            return doc

    def _get_cache_path(self, url: str) -> Path:
        """Get the cache file path for a URL."""
        # Simple hash-based filename
        import hashlib

        url_hash = hashlib.md5(url.encode()).hexdigest()
        return self.cache_dir / f"{url_hash}.html"

    def _get_cached(self, url: str) -> RawDocument | None:
        """Get a cached document if it exists."""
        cache_path = self._get_cache_path(url)
        if cache_path.exists():
            try:
                html = cache_path.read_text(encoding="utf-8")
                return RawDocument(
                    url=url,
                    html=html,
                    fetched_at=datetime.fromtimestamp(cache_path.stat().st_mtime),
                    source=self.name,
                )
            except Exception as e:
                logger.warning("Failed to read cache", url=url, error=str(e))
        return None

    def _cache_document(self, doc: RawDocument) -> None:
        """Cache a document to disk."""
        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            cache_path = self._get_cache_path(doc.url)
            cache_path.write_text(doc.html, encoding="utf-8")
        except Exception as e:
            logger.warning("Failed to cache document", url=doc.url, error=str(e))

    @property
    @abstractmethod
    def name(self) -> str:
        """The scraper's unique name (used for registration)."""
        ...

    @abstractmethod
    async def scrape(
        self,
        date_range: tuple[int, int] | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[HistoricalEvent]:
        """Scrape historical events from this source.

        Args:
            date_range: Optional tuple of (start_year, end_year) to filter events
            limit: Optional maximum number of events to return

        Yields:
            HistoricalEvent objects
        """
        ...

    @abstractmethod
    def parse_document(self, doc: RawDocument) -> list[HistoricalEvent]:
        """Parse a raw document into historical events.

        Args:
            doc: The raw document to parse

        Returns:
            List of extracted historical events
        """
        ...
