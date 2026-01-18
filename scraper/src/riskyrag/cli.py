"""CLI for the RiskyRag scraper.

Provides commands for scraping, embedding, and uploading historical data.
"""

import asyncio
import os
from pathlib import Path

import click
import structlog
from dotenv import load_dotenv

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer(colors=True),
    ],
    wrapper_class=structlog.BoundLogger,
)

logger = structlog.get_logger()


@click.group()
@click.option("--env-file", default=".env", help="Path to .env file")
def main(env_file: str) -> None:
    """RiskyRag Historical Data Scraper CLI.

    Tools for scraping, processing, and uploading historical data
    for the temporal RAG system.
    """
    load_dotenv(env_file)


@main.command()
@click.option("--period", default="constantinople", help="period to scrape (constantinople, civil_war)")
@click.option("--start-year", default=1400, type=int, help="Start year for date filter")
@click.option("--end-year", default=1500, type=int, help="End year for date filter")
@click.option("--limit", default=None, type=int, help="Maximum events to scrape")
@click.option("--dry-run", is_flag=True, help="Don't upload to Convex")
@click.option("--cache-dir", default=".cache", help="Directory for caching")
@click.option("--chunk-size", default=500, type=int, help="Target chunk size in characters")
@click.option("--chunk-overlap", default=100, type=int, help="Overlap between chunks")
@click.option("--no-llm-filter", is_flag=True, help="Skip LLM temporal filtering")
def scrape(
    period: str,
    start_year: int,
    end_year: int,
    limit: int | None,
    dry_run: bool,
    cache_dir: str,
    chunk_size: int,
    chunk_overlap: int,
    no_llm_filter: bool,
) -> None:
    """Scrape historical data from a time period.

    The pipeline:
    1. Scrapes Wikipedia articles for the period
    2. Chunks content into ~500 char pieces
    3. LLM filters to remove anachronistic references (uses Haiku)
    4. Generates embeddings (Voyage or OpenAI)
    5. Uploads to Convex

    Example:
        riskyrag scrape --period constantinople --start-year 1400 --end-year 1500
        riskyrag scrape --period civil_war --start-year 1860 --end-year 1865
    """
    # Ensure .env is loaded (in case parent command didn't run)
    load_dotenv()

    # Import scrapers to trigger registration
    import riskyrag.scrapers  # noqa: F401
    from riskyrag.core.registry import get_scraper
    from riskyrag.processors.embeddings import EmbeddingProcessor
    from riskyrag.processors.pipeline import Pipeline

    scraper_class = get_scraper(period)
    if not scraper_class:
        raise click.ClickException(f"Unknown time period: {period}")

    convex_url = os.environ.get("CONVEX_URL")
    if not convex_url and not dry_run:
        raise click.ClickException("CONVEX_URL environment variable not set")

    # Determine embedding provider
    if os.environ.get("VOYAGE_API_KEY"):
        provider = "voyage"
    elif os.environ.get("OPENAI_API_KEY"):
        provider = "openai"
    else:
        raise click.ClickException("No embedding API key found (VOYAGE_API_KEY or OPENAI_API_KEY)")

    # Check for LLM filter API key
    use_llm_filter = not no_llm_filter
    if use_llm_filter and not os.environ.get("ANTHROPIC_API_KEY"):
        logger.warning("ANTHROPIC_API_KEY not set, LLM filtering will be skipped")
        use_llm_filter = False

    logger.info(
        "Starting scrape",
        period=period,
        date_range=(start_year, end_year),
        limit=limit,
        dry_run=dry_run,
        embedding_provider=provider,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        use_llm_filter=use_llm_filter,
    )

    async def run() -> dict[str, int]:
        scraper = scraper_class(cache_dir=Path(cache_dir))
        embedding_processor = EmbeddingProcessor(provider=provider)

        pipeline = Pipeline(
            scraper=scraper,
            embedding_processor=embedding_processor,
            convex_url=convex_url or "",
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            use_llm_filter=use_llm_filter,
        )

        async with embedding_processor:
            return await pipeline.run(
                date_range=(start_year, end_year),
                limit=limit,
                dry_run=dry_run,
            )

    stats = asyncio.run(run())
    click.echo("\nPipeline complete:")
    click.echo(f"  Events scraped: {stats['events_scraped']}")
    click.echo(f"  Chunks created: {stats['chunks_created']}")
    click.echo(f"  Chunks filtered (removed): {stats['chunks_filtered']}")
    click.echo(f"  Chunks retained: {stats['chunks_retained']}")
    click.echo(f"  Snippets embedded: {stats['snippets_embedded']}")
    click.echo(f"  Snippets uploaded: {stats['snippets_uploaded']}")
    click.echo(f"  Snippets skipped (duplicates): {stats.get('snippets_skipped', 0)}")
    click.echo(f"  Errors: {stats['errors']}")


@main.command()
@click.option("--provider", default="voyage", type=click.Choice(["voyage", "openai"]))
@click.argument("text")
def embed(provider: str, text: str) -> None:
    """Test embedding generation.

    Example:
        riskyrag embed "The fall of Constantinople in 1453"
    """
    from riskyrag.processors.embeddings import EmbeddingProcessor

    async def run() -> None:
        processor = EmbeddingProcessor(provider=provider)  # type: ignore
        async with processor:
            embedding = await processor.embed(text)
            click.echo(f"Generated embedding with {len(embedding)} dimensions")
            click.echo(f"First 10 values: {embedding[:10]}")

    asyncio.run(run())


@main.command()
def list_scrapers() -> None:
    """List available scrapers."""
    # Import scrapers to trigger registration
    import riskyrag.scrapers  # noqa: F401
    from riskyrag.core.registry import list_scrapers

    periods = list_scrapers()
    click.echo("Available periods:")
    for period in periods:
        click.echo(f"  - {period}")


@main.command()
@click.option("--period", default="constantinople", help="period to test")
@click.option("--limit", default=3, type=int, help="Number of events to fetch")
def test_scrape(period: str, limit: int) -> None:
    """Test scraping without embeddings or upload.

    Example:
        riskyrag test-scrape --period constantinople --limit 5
    """
    # Import scrapers to trigger registration
    import riskyrag.scrapers  # noqa: F401
    from riskyrag.core.registry import get_scraper

    scraper_class = get_scraper(period)
    if not scraper_class:
        raise click.ClickException(f"Unknown period: {period}")

    async def run() -> None:
        scraper = scraper_class()
        async with scraper:
            count = 0
            async for event in scraper.scrape(limit=limit):
                click.echo(f"\n--- Event {count + 1} ---")
                click.echo(f"Title: {event.title}")
                click.echo(f"Date: {event.event_date.isoformat()}")
                click.echo(f"Type: {event.event_type.value}")
                click.echo(f"Region: {event.region}")
                click.echo(f"Participants: {', '.join(event.participants)}")
                click.echo(f"Tags: {', '.join(event.tags)}")
                click.echo(f"Content: {event.content[:200]}...")
                count += 1

    asyncio.run(run())


if __name__ == "__main__":
    main()
