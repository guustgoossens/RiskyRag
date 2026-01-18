"""Processing pipeline for historical events.

This module provides the main pipeline for processing scraped events:
scrape -> chunk -> LLM filter -> embed -> upload to Convex
"""

import asyncio
from dataclasses import dataclass

import structlog
from convex import ConvexClient

from riskyrag.core.types import HistoricalEvent, ProcessedSnippet
from riskyrag.processors.chunking import Chunk, TextChunker
from riskyrag.processors.embeddings import EmbeddingProcessor
from riskyrag.processors.llm_filter import LLMFilter
from riskyrag.scrapers.base import BaseScraper

logger = structlog.get_logger()


@dataclass
class PipelineStats:
    """Statistics from a pipeline run."""

    events_scraped: int = 0
    chunks_created: int = 0
    chunks_filtered: int = 0  # Removed by LLM filter
    chunks_retained: int = 0
    snippets_embedded: int = 0
    snippets_uploaded: int = 0
    snippets_skipped: int = 0  # Duplicates skipped
    errors: int = 0


class Pipeline:
    """Main processing pipeline for historical data.

    Orchestrates the full flow:
    1. Scrape events from source
    2. Chunk events into smaller pieces
    3. LLM filter to remove anachronistic content
    4. Generate embeddings
    5. Upload to Convex
    """

    def __init__(
        self,
        scraper: BaseScraper,
        embedding_processor: EmbeddingProcessor,
        convex_url: str,
        batch_size: int = 10,
        chunk_size: int = 500,
        chunk_overlap: int = 100,
        use_llm_filter: bool = True,
    ) -> None:
        """Initialize the pipeline.

        Args:
            scraper: The scraper to use for fetching data
            embedding_processor: The processor for generating embeddings
            convex_url: URL of the Convex deployment
            batch_size: Number of snippets to upload in each batch
            chunk_size: Target size for text chunks in characters
            chunk_overlap: Overlap between chunks in characters
            use_llm_filter: Whether to use LLM filtering for anachronisms
        """
        self.scraper = scraper
        self.embedding_processor = embedding_processor
        self.convex_url = convex_url
        self.batch_size = batch_size
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.use_llm_filter = use_llm_filter
        self._client: ConvexClient | None = None
        self._chunker = TextChunker(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

    @property
    def client(self) -> ConvexClient:
        """Get the Convex client, initializing if needed."""
        if self._client is None:
            self._client = ConvexClient(self.convex_url)
        return self._client

    async def run(
        self,
        date_range: tuple[int, int] | None = None,
        limit: int | None = None,
        dry_run: bool = False,
    ) -> dict[str, int]:
        """Run the full pipeline.

        Args:
            date_range: Optional (start_year, end_year) to filter events
            limit: Optional maximum number of events to process
            dry_run: If True, don't upload to Convex

        Returns:
            Statistics about the pipeline run
        """
        stats = PipelineStats()

        # Phase 1: Scrape all events
        logger.info("Phase 1: Scraping events...")
        events: list[HistoricalEvent] = []
        async with self.scraper:
            async for event in self.scraper.scrape(date_range=date_range, limit=limit):
                events.append(event)
                stats.events_scraped += 1
                logger.info(
                    "Scraped event",
                    title=event.title,
                    date=event.event_date.isoformat(),
                )

        if not events:
            logger.warning("No events scraped")
            return self._stats_to_dict(stats)

        # Phase 2: Chunk events
        logger.info("Phase 2: Chunking events...", event_count=len(events))
        all_chunks: list[Chunk] = []
        for event in events:
            chunks = self._chunker.chunk_event(event)
            all_chunks.extend(chunks)
        stats.chunks_created = len(all_chunks)
        logger.info("Chunking complete", total_chunks=stats.chunks_created)

        # Phase 3: LLM filter (optional)
        filtered_chunks: list[tuple[Chunk, str]] = []
        if self.use_llm_filter:
            logger.info("Phase 3: LLM filtering for anachronisms...")
            try:
                async with LLMFilter() as llm_filter:
                    filtered_chunks = await llm_filter.filter_chunks(all_chunks)
                stats.chunks_filtered = stats.chunks_created - len(filtered_chunks)
                stats.chunks_retained = len(filtered_chunks)
            except ValueError as e:
                # No API key - skip filtering
                logger.warning("Skipping LLM filter", reason=str(e))
                filtered_chunks = [(chunk, chunk.content) for chunk in all_chunks]
                stats.chunks_retained = len(all_chunks)
        else:
            logger.info("Phase 3: Skipping LLM filter (disabled)")
            filtered_chunks = [(chunk, chunk.content) for chunk in all_chunks]
            stats.chunks_retained = len(all_chunks)

        if not filtered_chunks:
            logger.warning("No chunks retained after filtering")
            return self._stats_to_dict(stats)

        # Phase 4: Embed and upload in batches
        logger.info(
            "Phase 4: Embedding and uploading...",
            chunks_to_process=len(filtered_chunks),
        )
        batch: list[ProcessedSnippet] = []

        for chunk, filtered_content in filtered_chunks:
            try:
                # Generate embedding
                embedding = await self.embedding_processor.embed(filtered_content)

                snippet = ProcessedSnippet(
                    content=filtered_content,
                    embedding=embedding,
                    event_date=chunk.event_date,
                    publication_date=chunk.publication_date,
                    source="wikipedia",
                    source_url=chunk.source_url,
                    region=chunk.region,
                    tags=chunk.tags,
                    title=f"{chunk.parent_title} [{chunk.chunk_index + 1}/{chunk.total_chunks}]"
                    if chunk.total_chunks > 1
                    else chunk.parent_title,
                    participants=chunk.participants,
                )
                batch.append(snippet)
                stats.snippets_embedded += 1

                # Upload batch if full
                if len(batch) >= self.batch_size:
                    if not dry_run:
                        result = await self._upload_batch(batch)
                        stats.snippets_uploaded += result.get("inserted", len(batch))
                        stats.snippets_skipped += result.get("skipped", 0)
                    else:
                        stats.snippets_uploaded += len(batch)
                    batch = []

            except Exception as e:
                logger.error(
                    "Failed to process chunk",
                    title=chunk.parent_title,
                    chunk_index=chunk.chunk_index,
                    error=str(e),
                )
                stats.errors += 1

        # Upload remaining batch
        if batch:
            if not dry_run:
                result = await self._upload_batch(batch)
                stats.snippets_uploaded += result.get("inserted", len(batch))
                stats.snippets_skipped += result.get("skipped", 0)
            else:
                stats.snippets_uploaded += len(batch)

        logger.info("Pipeline complete", **self._stats_to_dict(stats))
        return self._stats_to_dict(stats)

    async def _upload_batch(self, batch: list[ProcessedSnippet]) -> dict[str, int]:
        """Upload a batch of snippets to Convex with deduplication.

        Returns:
            Dict with 'inserted' and 'skipped' counts
        """
        logger.info("Uploading batch", count=len(batch))

        docs = [snippet.to_convex_doc() for snippet in batch]

        # Use the Convex client to call the mutation
        # Note: convex-py uses sync calls, so we run in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: self.client.mutation("rag:batchAddSnippets", {"snippets": docs}),
        )

        # Result includes {inserted: N, skipped: M, ids: [...]}
        inserted = result.get("inserted", len(batch)) if isinstance(result, dict) else len(batch)
        skipped = result.get("skipped", 0) if isinstance(result, dict) else 0

        logger.info("Batch uploaded", inserted=inserted, skipped=skipped)
        return {"inserted": inserted, "skipped": skipped}

    def _stats_to_dict(self, stats: PipelineStats) -> dict[str, int]:
        """Convert stats dataclass to dict."""
        return {
            "events_scraped": stats.events_scraped,
            "chunks_created": stats.chunks_created,
            "chunks_filtered": stats.chunks_filtered,
            "chunks_retained": stats.chunks_retained,
            "snippets_embedded": stats.snippets_embedded,
            "snippets_uploaded": stats.snippets_uploaded,
            "snippets_skipped": stats.snippets_skipped,
            "errors": stats.errors,
        }
