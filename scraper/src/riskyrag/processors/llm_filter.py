"""LLM-based temporal filtering for historical content.

Uses Claude Haiku to filter out anachronistic references and ensure
content only contains knowledge available at the event date.
"""

import asyncio
import os
import re
from dataclasses import dataclass
from datetime import datetime

import httpx
import structlog

from riskyrag.processors.chunking import Chunk

logger = structlog.get_logger()


# System prompt for temporal filtering
FILTER_SYSTEM_PROMPT = """You are a temporal knowledge filter for a historical RAG system.

Your job is to rewrite historical content to ONLY include information that would be known ON OR BEFORE a specific date.

REMOVE or rewrite:
- Future events: "This battle would later lead to..." → Remove entirely
- Modern analysis: "Historians now believe..." → Remove
- References to later years: "In 1920, scholars discovered..." → Remove
- Post-hoc interpretations: "This proved to be a turning point..." → Rewrite as uncertainty
- Anachronistic terms: "This was a war crime" (modern concept) → Use period-appropriate language
- Death dates if after the event: "X (1420-1480)" when event is 1450 → "X (born 1420)"

KEEP:
- Facts known at the time
- Contemporary accounts and sources
- Descriptions of events as they happened
- Names, places, numbers from the event
- Quotes from people alive at the time

Output ONLY the filtered text. No explanations. If everything must be removed, output "NO_CONTENT"."""


@dataclass
class FilterResult:
    """Result of LLM filtering."""

    original_content: str
    filtered_content: str
    was_modified: bool
    removed_entirely: bool


class LLMFilter:
    """Filters historical content to remove anachronistic references.

    Uses Claude Haiku for fast, cheap filtering of each chunk.
    """

    # Rate limiting for Anthropic API
    requests_per_second: float = 5.0
    max_concurrent_requests: int = 5

    def __init__(
        self,
        model: str = "claude-3-haiku-20240307",
        api_key: str | None = None,
    ) -> None:
        """Initialize the LLM filter.

        Args:
            model: Anthropic model to use (default: Haiku)
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
        """
        self.model = model
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")

        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY not found")

        self.api_url = "https://api.anthropic.com/v1/messages"
        self._client: httpx.AsyncClient | None = None
        self._semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        self._last_request_time = 0.0

    async def __aenter__(self) -> "LLMFilter":
        """Enter async context."""
        self._client = httpx.AsyncClient(timeout=60.0)
        return self

    async def __aexit__(self, *args: object) -> None:
        """Exit async context."""
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get the HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=60.0)
        return self._client

    async def _rate_limit(self) -> None:
        """Enforce rate limiting between requests."""
        now = asyncio.get_event_loop().time()
        min_interval = 1.0 / self.requests_per_second
        elapsed = now - self._last_request_time

        if elapsed < min_interval:
            await asyncio.sleep(min_interval - elapsed)

        self._last_request_time = asyncio.get_event_loop().time()

    def _format_date(self, timestamp_ms: float) -> str:
        """Format a timestamp as a human-readable date."""
        try:
            dt = datetime.fromtimestamp(timestamp_ms / 1000)
            return dt.strftime("%B %d, %Y")
        except (ValueError, OSError):
            # Handle pre-1970 dates
            # Convert milliseconds to approximate year
            # Unix epoch is 1970, so negative timestamps are before 1970
            seconds = timestamp_ms / 1000
            years_from_1970 = seconds / (365.25 * 24 * 3600)
            year = int(1970 + years_from_1970)
            return f"approximately {year}"

    async def filter_chunk(self, chunk: Chunk) -> FilterResult:
        """Filter a single chunk to remove anachronistic content.

        Args:
            chunk: The chunk to filter

        Returns:
            FilterResult with original and filtered content
        """
        async with self._semaphore:
            await self._rate_limit()

            event_date_str = self._format_date(chunk.event_date)

            user_prompt = f"""Event date: {event_date_str}
Event title: {chunk.parent_title}

Content to filter:
{chunk.content}

Rewrite to only include information known on or before {event_date_str}:"""

            try:
                response = await self.client.post(
                    self.api_url,
                    headers={
                        "Content-Type": "application/json",
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 2000,
                        "system": FILTER_SYSTEM_PROMPT,
                        "messages": [{"role": "user", "content": user_prompt}],
                    },
                )
                response.raise_for_status()
                data = response.json()

                filtered_content = data["content"][0]["text"].strip()

                # Check if content was removed entirely
                removed_entirely = filtered_content == "NO_CONTENT" or not filtered_content

                # Check if content was modified
                was_modified = (
                    removed_entirely
                    or self._normalize_text(filtered_content)
                    != self._normalize_text(chunk.content)
                )

                if removed_entirely:
                    logger.warning(
                        "Chunk removed entirely by filter",
                        title=chunk.parent_title,
                        chunk_index=chunk.chunk_index,
                    )
                elif was_modified:
                    logger.debug(
                        "Chunk was filtered",
                        title=chunk.parent_title,
                        chunk_index=chunk.chunk_index,
                        original_len=len(chunk.content),
                        filtered_len=len(filtered_content),
                    )

                return FilterResult(
                    original_content=chunk.content,
                    filtered_content="" if removed_entirely else filtered_content,
                    was_modified=was_modified,
                    removed_entirely=removed_entirely,
                )

            except httpx.HTTPStatusError as e:
                logger.error(
                    "LLM filter API error",
                    status_code=e.response.status_code,
                    error=str(e),
                )
                # On error, return original content (fail open)
                return FilterResult(
                    original_content=chunk.content,
                    filtered_content=chunk.content,
                    was_modified=False,
                    removed_entirely=False,
                )

            except Exception as e:
                logger.error("LLM filter error", error=str(e))
                # On error, return original content (fail open)
                return FilterResult(
                    original_content=chunk.content,
                    filtered_content=chunk.content,
                    was_modified=False,
                    removed_entirely=False,
                )

    def _normalize_text(self, text: str) -> str:
        """Normalize text for comparison (remove extra whitespace)."""
        return re.sub(r"\s+", " ", text.strip().lower())

    async def filter_chunks(
        self,
        chunks: list[Chunk],
        skip_filter: bool = False,
    ) -> list[tuple[Chunk, str]]:
        """Filter multiple chunks in parallel.

        Args:
            chunks: List of chunks to filter
            skip_filter: If True, skip LLM filtering (for testing)

        Returns:
            List of (chunk, filtered_content) tuples.
            Chunks that were removed entirely are excluded.
        """
        if skip_filter:
            logger.info("Skipping LLM filter (skip_filter=True)")
            return [(chunk, chunk.content) for chunk in chunks]

        results: list[tuple[Chunk, str]] = []
        stats = {"total": 0, "modified": 0, "removed": 0}

        # Process in batches to avoid overwhelming the API
        batch_size = 10
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]

            # Process batch concurrently
            tasks = [self.filter_chunk(chunk) for chunk in batch]
            filter_results = await asyncio.gather(*tasks)

            for chunk, result in zip(batch, filter_results):
                stats["total"] += 1
                if result.removed_entirely:
                    stats["removed"] += 1
                    continue  # Skip this chunk

                if result.was_modified:
                    stats["modified"] += 1

                results.append((chunk, result.filtered_content))

        logger.info(
            "LLM filtering complete",
            total_chunks=stats["total"],
            modified=stats["modified"],
            removed=stats["removed"],
            retained=len(results),
        )

        return results


async def filter_chunks_with_llm(
    chunks: list[Chunk],
    skip_filter: bool = False,
) -> list[tuple[Chunk, str]]:
    """Convenience function to filter chunks.

    Args:
        chunks: Chunks to filter
        skip_filter: Skip LLM filtering if True

    Returns:
        List of (chunk, filtered_content) tuples
    """
    if skip_filter:
        return [(chunk, chunk.content) for chunk in chunks]

    async with LLMFilter() as llm_filter:
        return await llm_filter.filter_chunks(chunks)
