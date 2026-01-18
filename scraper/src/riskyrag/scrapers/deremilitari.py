"""De Re Militari scraper for primary source siege diaries.

Scrapes Nicolo Barbaro's day-by-day diary of the 1453 Siege of Constantinople
and other primary sources from the De Re Militari website.

Sources:
- Nicolo Barbaro's diary (Venetian perspective)
- George Sphrantzes (Byzantine perspective)
- Kritovoulos (Ottoman perspective)
"""

import re
from collections.abc import AsyncIterator
from datetime import datetime

import structlog
from bs4 import BeautifulSoup

from riskyrag.core.registry import register_scraper
from riskyrag.core.types import EventType, HistoricalEvent, RawDocument
from riskyrag.scrapers.base import BaseScraper

logger = structlog.get_logger()

# De Re Militari source URLs
DEREMILITARI_SOURCES = {
    "barbaro": {
        "url": "https://deremilitari.org/2016/08/the-siege-of-constantinople-in-1453-according-to-nicolo-barbaro/",
        "author": "Nicolo Barbaro",
        "perspective": "Venetian",
        "date_pattern": r"On the (\w+) (?:of (?:the month of )?)?(\w+)",  # "On the fifth of April"
    },
    "sphrantzes": {
        "url": "https://deremilitari.org/2016/08/the-siege-of-constantinople-in-1453-according-to-george-sphrantzes/",
        "author": "George Sphrantzes",
        "perspective": "Byzantine",
        "date_pattern": r"(\w+) (\d{1,2})",  # "March 26"
    },
    "kritovoulos": {
        "url": "https://deremilitari.org/2016/08/the-siege-of-constantinople-in-1453-according-to-kritovoulos/",
        "author": "Kritovoulos",
        "perspective": "Ottoman",
        "date_pattern": None,  # Uses narrative durations, not specific dates
    },
}

# Month name mappings
MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}

# Ordinal number mappings
ORDINAL_MAP = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
    "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10,
    "eleventh": 11, "twelfth": 12, "thirteenth": 13, "fourteenth": 14,
    "fifteenth": 15, "sixteenth": 16, "seventeenth": 17, "eighteenth": 18,
    "nineteenth": 19, "twentieth": 20, "twenty-first": 21, "twenty-second": 22,
    "twenty-third": 23, "twenty-fourth": 24, "twenty-fifth": 25,
    "twenty-sixth": 26, "twenty-seventh": 27, "twenty-eighth": 28,
    "twenty-ninth": 29, "thirtieth": 30, "thirty-first": 31,
}


@register_scraper("deremilitari")
class DeReMilitariScraper(BaseScraper):
    """Scraper for primary source siege diaries from De Re Militari.

    Extracts day-by-day entries from Nicolo Barbaro's diary of the
    1453 Siege of Constantinople, with precise date attribution.
    """

    # Be nice to the site
    requests_per_second: float = 0.5
    max_concurrent_requests: int = 2

    @property
    def name(self) -> str:
        return "deremilitari"

    async def scrape(
        self,
        date_range: tuple[int, int] | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[HistoricalEvent]:
        """Scrape siege diaries from De Re Militari.

        Args:
            date_range: Optional tuple of (start_year, end_year) to filter events
            limit: Optional maximum number of events to return

        Yields:
            HistoricalEvent objects
        """
        date_range = date_range or (1400, 1500)
        count = 0

        # If not in 1453 range, skip this scraper
        if not (date_range[0] <= 1453 <= date_range[1]):
            logger.info("Date range does not include 1453, skipping De Re Militari")
            return

        for source_key, source_info in DEREMILITARI_SOURCES.items():
            if limit and count >= limit:
                break

            try:
                doc = await self.fetch(source_info["url"])
                events = self._parse_source(doc, source_info)

                for event in events:
                    yield event
                    count += 1

                    if limit and count >= limit:
                        return

            except Exception as e:
                logger.error(
                    "Failed to scrape De Re Militari source",
                    source=source_key,
                    error=str(e),
                )
                continue

    def parse_document(self, doc: RawDocument) -> list[HistoricalEvent]:
        """Parse a De Re Militari page into historical events."""
        # This is called by the base class, but we use _parse_source instead
        return self._parse_source(doc, DEREMILITARI_SOURCES.get("barbaro", {}))

    def _parse_source(
        self, doc: RawDocument, source_info: dict
    ) -> list[HistoricalEvent]:
        """Parse a specific source document."""
        events: list[HistoricalEvent] = []
        soup = BeautifulSoup(doc.html, "html.parser")

        # Get the main content area
        content = soup.find("div", {"class": "entry-content"})
        if not content:
            content = soup.find("article")
        if not content:
            logger.warning("Could not find content div", url=doc.url)
            return events

        author = source_info.get("author", "Unknown")
        perspective = source_info.get("perspective", "Unknown")

        # Extract text and split into paragraphs
        paragraphs = content.find_all("p")

        current_date: datetime | None = None
        current_entry: list[str] = []

        for para in paragraphs:
            text = para.get_text().strip()
            if not text or len(text) < 20:
                continue

            # Try to extract date from this paragraph
            extracted_date = self._extract_date_from_text(text, source_info)

            if extracted_date:
                # Save previous entry if we have one
                if current_date and current_entry:
                    events.append(
                        self._create_event(
                            current_date,
                            current_entry,
                            author,
                            perspective,
                            doc.url,
                        )
                    )

                current_date = extracted_date
                current_entry = [text]
            elif current_date:
                # Continue building current entry
                current_entry.append(text)

        # Don't forget the last entry
        if current_date and current_entry:
            events.append(
                self._create_event(
                    current_date,
                    current_entry,
                    author,
                    perspective,
                    doc.url,
                )
            )

        # If no dated entries found, create one entry for the whole document
        if not events:
            all_text = " ".join(p.get_text().strip() for p in paragraphs[:10])
            if all_text:
                events.append(
                    HistoricalEvent(
                        title=f"Siege of Constantinople - {author}",
                        content=all_text[:2000],
                        event_date=datetime(1453, 5, 29),  # Fall of Constantinople
                        publication_date=datetime(1453, 5, 29),
                        participants=["Ottoman Empire", "Byzantine Empire", "Venice", "Genoa"],
                        event_type=EventType.SIEGE,
                        region="Constantinople",
                        source_url=doc.url,
                        tags=["siege", "primary_source", perspective.lower(), "1453"],
                    )
                )

        return events

    def _extract_date_from_text(
        self, text: str, source_info: dict
    ) -> datetime | None:
        """Extract a date from text using source-specific patterns."""
        text_lower = text.lower()

        # Pattern 1: "On the [ordinal] of [month]" (Barbaro style)
        match = re.search(
            r"on the (\w+(?:-\w+)?)\s+(?:of\s+)?(?:the\s+)?(?:month\s+of\s+)?(\w+)",
            text_lower,
        )
        if match:
            day_word = match.group(1)
            month_word = match.group(2)

            day = ORDINAL_MAP.get(day_word)
            month = MONTH_MAP.get(month_word)

            if day and month:
                try:
                    return datetime(1453, month, day)
                except ValueError:
                    pass

        # Pattern 2: "On [month] [day]" or "[month] [day]"
        match = re.search(
            r"(?:on\s+)?(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*1453)?",
            text_lower,
        )
        if match:
            month_word = match.group(1)
            day = int(match.group(2))
            month = MONTH_MAP.get(month_word)

            if month and 1 <= day <= 31:
                try:
                    return datetime(1453, month, day)
                except ValueError:
                    pass

        # Pattern 3: "twenty-ninth of May, 1453" (explicit)
        match = re.search(
            r"(\w+(?:-\w+)?)\s+(?:of\s+)?(\w+)[,\s]+1453",
            text_lower,
        )
        if match:
            day_word = match.group(1)
            month_word = match.group(2)

            day = ORDINAL_MAP.get(day_word)
            month = MONTH_MAP.get(month_word)

            if day and month:
                try:
                    return datetime(1453, month, day)
                except ValueError:
                    pass

        return None

    def _create_event(
        self,
        date: datetime,
        paragraphs: list[str],
        author: str,
        perspective: str,
        source_url: str,
    ) -> HistoricalEvent:
        """Create a HistoricalEvent from parsed diary entry."""
        content = " ".join(paragraphs)

        # Create title based on date and content
        date_str = date.strftime("%B %d, 1453")

        # Try to extract key action from first paragraph
        first_para = paragraphs[0] if paragraphs else ""
        title = f"Siege of Constantinople - {date_str}"

        # Add brief description if we can extract it
        if "turk" in first_para.lower() or "mahomet" in first_para.lower():
            if "attack" in first_para.lower():
                title = f"Turkish Attack - {date_str}"
            elif "fleet" in first_para.lower() or "ship" in first_para.lower():
                title = f"Naval Action - {date_str}"
            elif "cannon" in first_para.lower() or "bombard" in first_para.lower():
                title = f"Bombardment - {date_str}"

        # Classify event type
        event_type = self._classify_entry(content)

        # Extract participants
        participants = self._extract_participants(content)

        # Extract tags
        tags = self._extract_tags(content, perspective)

        return HistoricalEvent(
            title=title,
            content=content[:2000],
            event_date=date,
            publication_date=date,  # Contemporary diary
            participants=participants,
            event_type=event_type,
            region="Constantinople",
            source_url=source_url,
            tags=tags,
        )

    def _classify_entry(self, text: str) -> EventType:
        """Classify the event type based on diary entry content."""
        text_lower = text.lower()

        if any(word in text_lower for word in ["assault", "attack", "storm"]):
            return EventType.BATTLE
        if any(word in text_lower for word in ["bombard", "cannon", "wall"]):
            return EventType.SIEGE
        if any(word in text_lower for word in ["ship", "fleet", "galley", "naval"]):
            return EventType.BATTLE  # Naval engagement
        if any(word in text_lower for word in ["surrender", "fell", "capture"]):
            return EventType.TERRITORIAL_CHANGE
        if any(word in text_lower for word in ["embassy", "negotiate", "messenger"]):
            return EventType.DIPLOMATIC

        return EventType.SIEGE  # Default for siege diary

    def _extract_participants(self, text: str) -> list[str]:
        """Extract participants from diary text."""
        participants = []
        text_lower = text.lower()

        participant_keywords = {
            "Ottoman Empire": ["turk", "turkish", "ottoman", "mahomet", "sultan"],
            "Byzantine Empire": ["greek", "byzantine", "emperor", "constantine"],
            "Venice": ["venetian", "venice", "galley"],
            "Genoa": ["genoese", "genoa"],
            "Hungary": ["hungarian", "hungary"],
        }

        for nation, keywords in participant_keywords.items():
            if any(kw in text_lower for kw in keywords):
                participants.append(nation)

        return participants or ["Ottoman Empire", "Byzantine Empire"]

    def _extract_tags(self, text: str, perspective: str) -> list[str]:
        """Extract tags from diary entry."""
        tags = ["siege", "1453", "primary_source", perspective.lower()]
        text_lower = text.lower()

        tag_keywords = {
            "naval": ["ship", "fleet", "galley", "sea"],
            "artillery": ["cannon", "bombard", "gun"],
            "assault": ["attack", "assault", "storm"],
            "fortification": ["wall", "tower", "gate", "defense"],
            "military": ["soldier", "troop", "army"],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in text_lower for kw in keywords):
                tags.append(tag)

        return list(set(tags))  # Remove duplicates
