# RiskyRag Scraper

Python-based historical data scraper for the RiskyRag temporal RAG system.

## Quick Start

```bash
# Install dependencies
uv sync

# Run a test scrape (no upload)
uv run riskyrag test-scrape --source wikipedia --limit 5

# Full pipeline: scrape, embed, upload to Convex
uv run riskyrag scrape --source wikipedia --start-year 1400 --end-year 1500
```

## Project Structure

```
scraper/
├── src/riskyrag/
│   ├── core/
│   │   ├── types.py      # HistoricalEvent, ProcessedSnippet
│   │   └── registry.py   # @register_scraper decorator
│   ├── scrapers/
│   │   ├── base.py       # BaseScraper with rate limiting
│   │   └── wikipedia.py  # Wikipedia scraper
│   ├── processors/
│   │   ├── pipeline.py   # Scrape → Embed → Upload
│   │   └── embeddings.py # Voyage/OpenAI embeddings
│   └── cli.py            # Click CLI
├── pyproject.toml
└── .env                  # API keys
```

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required:
- `CONVEX_URL` - Your Convex deployment URL
- `VOYAGE_API_KEY` or `OPENAI_API_KEY` - For embeddings

## CLI Commands

### Scrape and Upload
```bash
uv run riskyrag scrape \
  --source wikipedia \
  --start-year 1400 \
  --end-year 1500 \
  --limit 100
```

Options:
- `--source`: Data source (currently: `wikipedia`)
- `--start-year`: Filter events from this year
- `--end-year`: Filter events until this year
- `--limit`: Maximum events to process
- `--dry-run`: Don't upload to Convex

### Test Scraping
```bash
uv run riskyrag test-scrape --source wikipedia --limit 5
```

Tests scraping without embeddings or upload.

### Test Embeddings
```bash
uv run riskyrag embed "The fall of Constantinople in 1453"
```

### List Sources
```bash
uv run riskyrag list-sources
```

## Adding New Scrapers

1. Create a new file in `src/riskyrag/scrapers/`
2. Extend `BaseScraper`
3. Use the `@register_scraper` decorator

```python
from riskyrag.core.registry import register_scraper
from riskyrag.scrapers.base import BaseScraper

@register_scraper("britannica")
class BritannicaScraper(BaseScraper):
    @property
    def name(self) -> str:
        return "britannica"

    async def scrape(self, date_range=None, limit=None):
        # Implement scraping logic
        ...

    def parse_document(self, doc):
        # Parse raw document into HistoricalEvent
        ...
```

## Data Types

### HistoricalEvent
Intermediate representation after parsing:

```python
@dataclass
class HistoricalEvent:
    title: str
    content: str
    event_date: datetime      # When the event happened
    publication_date: datetime # When knowledge became available
    participants: list[str]   # Nations/leaders involved
    event_type: EventType     # BATTLE, TREATY, SIEGE, etc.
    region: str               # Geographic region
    source_url: str
    tags: list[str]
```

### ProcessedSnippet
Ready for Convex upload:

```python
@dataclass
class ProcessedSnippet:
    content: str
    embedding: list[float]    # 1024 dimensions (Voyage)
    event_date: float         # Unix timestamp (milliseconds)
    publication_date: float
    source: str
    region: str
    tags: list[str]
    title: str | None
    participants: list[str] | None
```

## Development

```bash
# Install dev dependencies
uv sync --dev

# Run tests
uv run pytest

# Type checking
uv run mypy src/

# Linting
uv run ruff check src/
```
