"""Wikipedia scraper for historical events.

This scraper extracts historical events from Wikipedia articles,
focusing on the 1400-1500 period for the 1453 scenario.
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


# Key Wikipedia articles for the 1453 scenario
WIKIPEDIA_SOURCES_1453 = [
    # Fall of Constantinople
    "https://en.wikipedia.org/wiki/Fall_of_Constantinople",
    "https://en.wikipedia.org/wiki/Siege_of_Constantinople_(1453)",
    # Ottoman Empire
    "https://en.wikipedia.org/wiki/Ottoman_Empire",
    "https://en.wikipedia.org/wiki/Mehmed_the_Conqueror",
    "https://en.wikipedia.org/wiki/Rise_of_the_Ottoman_Empire",
    "https://en.wikipedia.org/wiki/Ottoman_wars_in_Europe",
    # Byzantine Empire
    "https://en.wikipedia.org/wiki/Byzantine_Empire",
    "https://en.wikipedia.org/wiki/Constantine_XI_Palaiologos",
    "https://en.wikipedia.org/wiki/Decline_of_the_Byzantine_Empire",
    # Italian city-states
    "https://en.wikipedia.org/wiki/Republic_of_Venice",
    "https://en.wikipedia.org/wiki/Republic_of_Genoa",
    "https://en.wikipedia.org/wiki/Giovanni_Giustiniani",
    # Balkans
    "https://en.wikipedia.org/wiki/Serbia_in_the_Middle_Ages",
    "https://en.wikipedia.org/wiki/Kingdom_of_Hungary_(1301%E2%80%931526)",
    "https://en.wikipedia.org/wiki/Battle_of_Kosovo",
    "https://en.wikipedia.org/wiki/Battle_of_Varna",
    # Earlier Ottoman expansion
    "https://en.wikipedia.org/wiki/Battle_of_Nicopolis",
    "https://en.wikipedia.org/wiki/Siege_of_Constantinople_(1422)",
    "https://en.wikipedia.org/wiki/Ottoman_Interregnum",
]


@register_scraper("constantinople")
class ConstantinopleScraper(BaseScraper):
    """Scraper for Wikipedia historical articles.

    Extracts structured historical events from Wikipedia articles,
    with proper date parsing and event classification.
    """

    # Rate limit for Wikipedia (be nice!)
    requests_per_second: float = 0.5  # 1 request every 2 seconds
    max_concurrent_requests: int = 2  # Only 2 concurrent requests

    @property
    def name(self) -> str:
        return "wikipedia"

    async def scrape(
        self,
        date_range: tuple[int, int] | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[HistoricalEvent]:
        """Scrape Wikipedia articles for historical events.

        Args:
            date_range: Optional tuple of (start_year, end_year) to filter events
            limit: Optional maximum number of events to return

        Yields:
            HistoricalEvent objects
        """
        date_range = date_range or (1400, 1500)
        count = 0

        for url in WIKIPEDIA_SOURCES_1453:
            if limit and count >= limit:
                break

            try:
                doc = await self.fetch(url)
                events = self.parse_document(doc)

                for event in events:
                    # Filter by date range
                    event_year = event.event_date.year
                    if date_range[0] <= event_year <= date_range[1]:
                        yield event
                        count += 1

                        if limit and count >= limit:
                            break

            except Exception as e:
                logger.error("Failed to scrape URL", url=url, error=str(e))
                continue

    def parse_document(self, doc: RawDocument) -> list[HistoricalEvent]:
        """Parse a Wikipedia article into historical events.

        This is a simplified parser that extracts:
        - Article title and summary
        - Key sections with dates
        - Infobox data where available
        """
        soup = BeautifulSoup(doc.html, "html.parser")
        events: list[HistoricalEvent] = []

        # Get the article title
        title_elem = soup.find("h1", {"id": "firstHeading"})
        title = title_elem.get_text() if title_elem else "Unknown"

        # Get the main content
        content_div = soup.find("div", {"id": "mw-content-text"})
        if not content_div:
            return events

        # Extract the lead paragraph (summary)
        lead_paragraphs = []
        # Find the parser output div which contains the actual content
        parser_output = content_div.find("div", {"class": "mw-parser-output"})
        search_div = parser_output if parser_output else content_div
        
        for p in search_div.find_all("p", limit=10):
            text = p.get_text().strip()
            # Skip empty paragraphs and coordinate/reference markers
            if text and len(text) > 20 and not text.startswith("["):
                lead_paragraphs.append(text)
                if len(lead_paragraphs) >= 3:
                    break
        
        if lead_paragraphs:
            summary = " ".join(lead_paragraphs)

            # Try to extract date from the content
            event_date = self._extract_date(summary) or datetime(1453, 5, 29)

            # Classify the event type based on title and content
            event_type = self._classify_event(title, summary)

            # Extract participants
            participants = self._extract_participants(summary)

            # Determine region
            region = self._determine_region(title, summary)

            events.append(
                HistoricalEvent(
                    title=title,
                    content=summary[:2000],  # Limit content length
                    event_date=event_date,
                    publication_date=event_date,  # Historical events have same pub date
                    participants=participants,
                    event_type=event_type,
                    region=region,
                    source_url=doc.url,
                    tags=self._extract_tags(title, summary),
                )
            )

        # Extract sections with specific dates
        sections = content_div.find_all(["h2", "h3"])
        for section in sections:
            section_title = section.get_text().strip()
            if any(skip in section_title.lower() for skip in ["references", "see also", "notes", "external links"]):  # noqa: E501
                continue

            # Get the content following this section
            section_content = []
            for sibling in section.find_next_siblings():
                if sibling.name in ["h2", "h3"]:
                    break
                if sibling.name == "p":
                    text = sibling.get_text().strip()
                    if text:
                        section_content.append(text)

            if section_content:
                content = " ".join(section_content)
                event_date = self._extract_date(content)

                if event_date:
                    events.append(
                        HistoricalEvent(
                            title=f"{title}: {section_title}",
                            content=content[:2000],
                            event_date=event_date,
                            publication_date=event_date,
                            participants=self._extract_participants(content),
                            event_type=self._classify_event(section_title, content),
                            region=self._determine_region(section_title, content),
                            source_url=doc.url,
                            tags=self._extract_tags(section_title, content),
                        )
                    )

        return events

    def _extract_date(self, text: str) -> datetime | None:
        """Extract a date from text content."""
        # Common date patterns
        patterns = [
            # "29 May 1453"
            r"(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})",
            # "May 29, 1453"
            r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})",
            # "1453"
            r"\b(14\d{2}|15\d{2})\b",
        ]

        month_map = {
            "January": 1, "February": 2, "March": 3, "April": 4,
            "May": 5, "June": 6, "July": 7, "August": 8,
            "September": 9, "October": 10, "November": 11, "December": 12,
        }

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                groups = match.groups()

                if len(groups) == 3 and groups[0].isdigit():
                    # "29 May 1453" format
                    day = int(groups[0])
                    month = month_map.get(groups[1].capitalize(), 1)
                    year = int(groups[2])
                    return datetime(year, month, day)

                elif len(groups) == 3 and not groups[0].isdigit():
                    # "May 29, 1453" format
                    month = month_map.get(groups[0].capitalize(), 1)
                    day = int(groups[1])
                    year = int(groups[2])
                    return datetime(year, month, day)

                elif len(groups) == 1:
                    # Just year
                    year = int(groups[0])
                    return datetime(year, 6, 15)  # Middle of the year

        return None

    def _classify_event(self, title: str, content: str) -> EventType:
        """Classify the event type based on title and content."""
        text = (title + " " + content).lower()

        if any(word in text for word in ["battle", "siege", "war", "attack", "invasion"]):
            if "siege" in text:
                return EventType.SIEGE
            return EventType.BATTLE

        if any(word in text for word in ["treaty", "peace", "agreement", "armistice"]):
            return EventType.TREATY

        if any(word in text for word in ["conquest", "captured", "fell", "annexed"]):
            return EventType.TERRITORIAL_CHANGE

        if any(word in text for word in ["crowned", "succeeded", "died", "assassinated", "reign"]):
            return EventType.LEADER_CHANGE

        if any(word in text for word in ["alliance", "allied", "coalition"]):
            return EventType.ALLIANCE

        if any(word in text for word in ["declared", "declaration"]):
            return EventType.DECLARATION

        return EventType.OTHER

    def _extract_participants(self, text: str) -> list[str]:
        """Extract nation/empire names from text."""
        participants = []

        nations = [
            "Ottoman Empire", "Byzantine Empire", "Venice", "Genoa",
            "Hungary", "Serbia", "Bulgaria", "Papal States",
            "Holy Roman Empire", "France", "England", "Poland",
            "Ottomans", "Byzantines", "Venetians", "Genoese",
        ]

        for nation in nations:
            if nation.lower() in text.lower():
                # Normalize to empire/republic names
                if nation in ["Ottomans"]:
                    participants.append("Ottoman Empire")
                elif nation in ["Byzantines"]:
                    participants.append("Byzantine Empire")
                elif nation in ["Venetians"]:
                    participants.append("Venice")
                elif nation in ["Genoese"]:
                    participants.append("Genoa")
                else:
                    participants.append(nation)

        return list(set(participants))

    def _determine_region(self, title: str, content: str) -> str:
        """Determine the geographic region of the event."""
        text = (title + " " + content).lower()

        if any(word in text for word in ["constantinople", "bosphorus", "golden horn"]):
            return "Constantinople"

        if any(word in text for word in ["anatolia", "asia minor", "bursa", "edirne"]):
            return "Anatolia"

        if any(word in text for word in ["balkans", "serbia", "bulgaria", "bosnia", "greece"]):
            return "Balkans"

        if any(word in text for word in ["thrace"]):
            return "Thrace"

        if any(word in text for word in ["mediterranean", "venice", "genoa", "italy"]):
            return "Mediterranean"

        return "Eastern Europe"

    def _extract_tags(self, title: str, content: str) -> list[str]:
        """Extract relevant tags for the event."""
        tags = []
        text = (title + " " + content).lower()

        tag_keywords = {
            "military": ["army", "troops", "soldiers", "warfare", "battle"],
            "naval": ["ships", "fleet", "naval", "navy", "sea"],
            "diplomatic": ["embassy", "ambassador", "treaty", "negotiations"],
            "religious": ["church", "pope", "crusade", "christian", "muslim", "islam"],
            "economic": ["trade", "merchant", "commerce", "gold", "tribute"],
            "siege": ["siege", "walls", "fortification", "cannon"],
            "conquest": ["conquered", "captured", "fell", "victory"],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in text for kw in keywords):
                tags.append(tag)

        return tags
