"""Processing pipeline for historical events.

This module provides the main pipeline for processing scraped events:
scrape -> chunk -> embed -> upload to Convex
"""

import asyncio

import structlog
from convex import ConvexClient

from riskyrag.core.types import HistoricalEvent, ProcessedSnippet
from riskyrag.processors.embeddings import EmbeddingProcessor
from riskyrag.scrapers.base import BaseScraper

logger = structlog.get_logger()


class Pipeline:
    """Main processing pipeline for historical data.

    Orchestrates the scraping, embedding, and upload process.
    """

    def __init__(
        self,
        scraper: BaseScraper,
        embedding_processor: EmbeddingProcessor,
        convex_url: str,
        batch_size: int = 10,
    ) -> None:
        """Initialize the pipeline.

        Args:
            scraper: The scraper to use for fetching data
            embedding_processor: The processor for generating embeddings
            convex_url: URL of the Convex deployment
            batch_size: Number of snippets to upload in each batch
        """
        self.scraper = scraper
        self.embedding_processor = embedding_processor
        self.convex_url = convex_url
        self.batch_size = batch_size
        self._client: ConvexClient | None = None

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
        stats = {
            "events_scraped": 0,
            "snippets_processed": 0,
            "snippets_uploaded": 0,
            "errors": 0,
        }

        batch: list[ProcessedSnippet] = []

        async with self.scraper:
            async for event in self.scraper.scrape(date_range=date_range, limit=limit):
                stats["events_scraped"] += 1
                logger.info(
                    "Processing event",
                    title=event.title,
                    date=event.event_date.isoformat(),
                )

                try:
                    # Generate embedding
                    snippet = await self._process_event(event)
                    batch.append(snippet)
                    stats["snippets_processed"] += 1

                    # Upload batch if full
                    if len(batch) >= self.batch_size:
                        if not dry_run:
                            await self._upload_batch(batch)
                        stats["snippets_uploaded"] += len(batch)
                        batch = []

                except Exception as e:
                    logger.error("Failed to process event", title=event.title, error=str(e))
                    stats["errors"] += 1

        # Upload remaining batch
        if batch and not dry_run:
            await self._upload_batch(batch)
            stats["snippets_uploaded"] += len(batch)

        logger.info("Pipeline complete", **stats)
        return stats

    async def _process_event(self, event: HistoricalEvent) -> ProcessedSnippet:
        """Process a single event into a snippet with embedding."""
        # Generate embedding for the content
        embedding = await self.embedding_processor.embed(event.content)

        return ProcessedSnippet(
            content=event.content,
            embedding=embedding,
            event_date=event.event_timestamp,
            publication_date=event.publication_timestamp,
            source="wikipedia",
            source_url=event.source_url,
            region=event.region,
            tags=event.tags,
            title=event.title,
            participants=event.participants,
        )

    async def _upload_batch(self, batch: list[ProcessedSnippet]) -> None:
        """Upload a batch of snippets to Convex."""
        logger.info("Uploading batch", count=len(batch))

        docs = [snippet.to_convex_doc() for snippet in batch]

        # Use the Convex client to call the mutation
        # Note: convex-py uses sync calls, so we run in executor
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.client.mutation("rag:batchAddSnippets", {"snippets": docs}),
        )

        logger.info("Batch uploaded successfully")
