"""Core types for the RiskyRag historical data scraper.

These types define the data structures used throughout the scraping,
processing, and embedding pipeline.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class EventType(Enum):
    """Types of historical events we track."""

    BATTLE = "battle"
    TREATY = "treaty"
    TERRITORIAL_CHANGE = "territorial_change"
    LEADER_CHANGE = "leader_change"
    ALLIANCE = "alliance"
    DECLARATION = "declaration"
    SIEGE = "siege"
    DIPLOMATIC = "diplomatic"
    ECONOMIC = "economic"
    RELIGIOUS = "religious"
    OTHER = "other"


@dataclass
class RawDocument:
    """A raw document fetched from a source.

    This represents the raw HTML/text content before any processing.
    """

    url: str
    html: str
    fetched_at: datetime
    source: str = "unknown"
    title: Optional[str] = None

    def __post_init__(self) -> None:
        if not self.url:
            raise ValueError("URL cannot be empty")


@dataclass
class HistoricalEvent:
    """A structured historical event extracted from source documents.

    This is the intermediate representation after parsing but before
    chunking and embedding.
    """

    title: str
    content: str
    event_date: datetime
    publication_date: datetime  # When knowledge became available (usually same as event_date)
    participants: list[str]  # Nations/leaders involved
    event_type: EventType
    region: str
    source_url: str
    tags: list[str] = field(default_factory=list)

    @property
    def event_timestamp(self) -> float:
        """Unix timestamp of the event date in milliseconds.
        
        Uses calendar.timegm for cross-platform support with pre-1970 dates.
        """
        import calendar
        return calendar.timegm(self.event_date.timetuple()) * 1000

    @property
    def publication_timestamp(self) -> float:
        """Unix timestamp of the publication date in milliseconds.
        
        Uses calendar.timegm for cross-platform support with pre-1970 dates.
        """
        import calendar
        return calendar.timegm(self.publication_date.timetuple()) * 1000


@dataclass
class ProcessedSnippet:
    """A processed snippet ready for upload to Convex.

    This includes the embedding and all metadata needed for temporal RAG.
    """

    content: str
    embedding: list[float]
    event_date: float  # Unix timestamp in milliseconds
    publication_date: float
    source: str
    source_url: Optional[str]
    region: str
    tags: list[str]
    title: Optional[str]
    participants: Optional[list[str]]
    content_hash: Optional[str] = None  # MD5 hash for deduplication

    def __post_init__(self) -> None:
        """Generate content hash if not provided."""
        if self.content_hash is None:
            import hashlib
            # Hash content + event_date for uniqueness
            hash_input = f"{self.content}:{self.event_date}".encode("utf-8")
            self.content_hash = hashlib.md5(hash_input).hexdigest()

    def to_convex_doc(self) -> dict:
        """Convert to a Convex document for insertion."""
        return {
            "content": self.content,
            "embedding": self.embedding,
            "eventDate": self.event_date,
            "publicationDate": self.publication_date,
            "source": self.source,
            "sourceUrl": self.source_url,
            "region": self.region,
            "tags": self.tags,
            "title": self.title,
            "participants": self.participants,
            "contentHash": self.content_hash,
        }


# Region constants for the 1453 scenario
REGIONS_1453 = [
    "Balkans",
    "Anatolia",
    "Thrace",
    "Mediterranean",
    "Constantinople",
    "Eastern Europe",
    "Western Europe",
    "Middle East",
]

# Nations for the 1453 scenario
NATIONS_1453 = [
    "Ottoman Empire",
    "Byzantine Empire",
    "Venice",
    "Genoa",
    "Hungary",
    "Serbia",
    "Papal States",
    "Mamluk Sultanate",
]

# Region constants for the Civil War scenario
REGIONS_CIVIL_WAR = [
    "Eastern Theater",
    "Western Theater",
    "Trans-Mississippi",
    "Atlantic/Naval",
    "Georgia",
    "Carolinas",
    "Washington D.C.",
    "Border States",
    "United States",
]

# Nations/factions for the Civil War scenario
NATIONS_CIVIL_WAR = [
    "United States",
    "Confederate States",
]
