"""Wikipedia scraper for American Civil War historical events.

This scraper extracts historical events from Wikipedia articles,
focusing on the 1860-1865 period for the American Civil War scenario.
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


# Key Wikipedia articles for the American Civil War scenario
WIKIPEDIA_SOURCES_CIVIL_WAR = [
    # Main conflict
    "https://en.wikipedia.org/wiki/American_Civil_War",
    # Elections
    "https://en.wikipedia.org/wiki/1860_United_States_presidential_election",
    "https://en.wikipedia.org/wiki/1864_United_States_presidential_election",
    # Key figures - Union
    "https://en.wikipedia.org/wiki/Abraham_Lincoln",
    "https://en.wikipedia.org/wiki/Ulysses_S._Grant",
    "https://en.wikipedia.org/wiki/George_B._McClellan",
    "https://en.wikipedia.org/wiki/George_Meade",
    "https://en.wikipedia.org/wiki/William_Tecumseh_Sherman",
    # Key figures - Confederate
    "https://en.wikipedia.org/wiki/Robert_E._Lee",
    "https://en.wikipedia.org/wiki/Stonewall_Jackson",
    "https://en.wikipedia.org/wiki/Confederate_States_of_America",
    # Key battles and sieges
    "https://en.wikipedia.org/wiki/Battle_of_Fort_Sumter",
    "https://en.wikipedia.org/wiki/First_Battle_of_Bull_Run",
    "https://en.wikipedia.org/wiki/Battle_of_Shiloh",
    "https://en.wikipedia.org/wiki/Battle_of_Antietam",
    "https://en.wikipedia.org/wiki/Special_Order_191",
    "https://en.wikipedia.org/wiki/Battle_of_Gettysburg",
    "https://en.wikipedia.org/wiki/Siege_of_Vicksburg",
    "https://en.wikipedia.org/wiki/Battle_of_Fredericksburg",
    "https://en.wikipedia.org/wiki/Battle_of_Chancellorsville",
    "https://en.wikipedia.org/wiki/Battle_of_Spotsylvania_Court_House",
    "https://en.wikipedia.org/wiki/Battle_of_Cold_Harbor",
    "https://en.wikipedia.org/wiki/Siege_of_Petersburg",
    "https://en.wikipedia.org/wiki/Battle_of_Atlanta",
    "https://en.wikipedia.org/wiki/Sherman%27s_March_to_the_Sea",
    "https://en.wikipedia.org/wiki/Battle_of_Appomattox_Court_House",
    # Key documents and speeches
    "https://en.wikipedia.org/wiki/Emancipation_Proclamation",
    "https://en.wikipedia.org/wiki/Cornerstone_Speech",
    # Assassination
    "https://en.wikipedia.org/wiki/Assassination_of_Abraham_Lincoln",
    "https://en.wikipedia.org/wiki/John_Wilkes_Booth",
]


@register_scraper("civil_war")
class CivilWarScraper(BaseScraper):
    """Scraper for Wikipedia American Civil War articles.

    Extracts structured historical events from Wikipedia articles,
    with proper date parsing and event classification.
    """

    # Rate limit for Wikipedia (be nice!)
    requests_per_second: float = 0.5  # 1 request every 2 seconds
    max_concurrent_requests: int = 2  # Only 2 concurrent requests

    @property
    def name(self) -> str:
        return "wikipedia_civil_war"

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
        date_range = date_range or (1860, 1865)
        count = 0

        for url in WIKIPEDIA_SOURCES_CIVIL_WAR:
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
        logger.debug("Parsing document", title=title, url=doc.url)

        # Get the main content
        content_div = soup.find("div", {"id": "mw-content-text"})
        if not content_div:
            logger.warning("No content div found", url=doc.url)
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

        logger.debug("Found lead paragraphs", count=len(lead_paragraphs), url=doc.url)

        if lead_paragraphs:
            summary = " ".join(lead_paragraphs)

            # Try to extract date from the content
            event_date = self._extract_date(summary) or datetime(1861, 4, 12)
            logger.debug("Extracted date", date=event_date, title=title)

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
            logger.debug("Created main event", title=title, date=event_date)

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
                    logger.debug("Created section event", section=section_title, date=event_date)

        logger.info("Parsed document", title=title, events_count=len(events))
        return events

    def _extract_date(self, text: str) -> datetime | None:
        """Extract a date from text content."""
        # Common date patterns
        patterns = [
            # "April 12, 1861"
            r"(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})",
            # "12 April 1861"
            r"(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})",
            # "1861"
            r"\b(186[0-5])\b",
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

                if len(groups) == 3 and not groups[0].isdigit():
                    # "April 12, 1861" format
                    month = month_map.get(groups[0].capitalize(), 1)
                    day = int(groups[1])
                    year = int(groups[2])
                    return datetime(year, month, day)

                elif len(groups) == 3 and groups[0].isdigit():
                    # "12 April 1861" format
                    day = int(groups[0])
                    month = month_map.get(groups[1].capitalize(), 1)
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

        if any(word in text for word in ["battle", "skirmish", "engagement", "attack", "raid"]):
            return EventType.BATTLE

        if any(word in text for word in ["siege", "blockade"]):
            return EventType.SIEGE

        if any(word in text for word in ["treaty", "surrender", "armistice", "capitulation"]):
            return EventType.TREATY

        if any(word in text for word in ["secession", "seceded", "annexed", "captured", "occupied"]):  # noqa: E501
            return EventType.TERRITORIAL_CHANGE

        if any(word in text for word in ["elected", "inaugurated", "appointed", "died", "assassinated", "resignation"]):  # noqa: E501
            return EventType.LEADER_CHANGE

        if any(word in text for word in ["alliance", "allied", "coalition", "joined"]):
            return EventType.ALLIANCE

        if any(word in text for word in ["proclamation", "declaration", "speech", "order", "act"]):
            return EventType.DECLARATION

        if any(word in text for word in ["march", "campaign", "expedition", "advance"]):
            return EventType.BATTLE  # Military campaigns

        return EventType.OTHER

    def _extract_participants(self, text: str) -> list[str]:
        """Extract faction/state names from text."""
        participants = []

        factions = [
            # Main factions
            "Union", "Confederate", "Confederacy", "Confederate States",
            "United States", "CSA", "USA",
            # States - Union
            "New York", "Pennsylvania", "Ohio", "Illinois", "Indiana",
            "Massachusetts", "Michigan", "Wisconsin", "Minnesota", "Iowa",
            "California", "Oregon", "Kansas", "West Virginia", "Nevada",
            "Maine", "New Hampshire", "Vermont", "Rhode Island", "Connecticut",
            "New Jersey", "Delaware", "Maryland", "Kentucky", "Missouri",
            # States - Confederate
            "Virginia", "North Carolina", "South Carolina", "Georgia",
            "Florida", "Alabama", "Mississippi", "Louisiana", "Texas",
            "Arkansas", "Tennessee",
            # Key armies
            "Army of the Potomac", "Army of Northern Virginia",
            "Army of the Tennessee", "Army of the Cumberland",
        ]

        for faction in factions:
            if faction.lower() in text.lower():
                # Normalize to main faction names
                if faction in ["Confederate", "Confederacy", "Confederate States", "CSA"]:
                    participants.append("Confederate States of America")
                elif faction in ["Union", "United States", "USA"]:
                    participants.append("United States of America")
                else:
                    participants.append(faction)

        return list(set(participants))

    def _determine_region(self, title: str, content: str) -> str:
        """Determine the geographic region of the event."""
        text = (title + " " + content).lower()

        # Eastern Theater
        if any(word in text for word in ["virginia", "richmond", "petersburg", "fredericksburg", "chancellorsville", "antietam", "gettysburg", "manassas", "bull run"]):  # noqa: E501
            return "Eastern Theater"

        # Western Theater
        if any(word in text for word in ["tennessee", "shiloh", "chattanooga", "nashville", "chickamauga", "vicksburg", "mississippi river"]):  # noqa: E501
            return "Western Theater"

        # Trans-Mississippi
        if any(word in text for word in ["texas", "arkansas", "missouri", "kansas", "indian territory", "new mexico"]):  # noqa: E501
            return "Trans-Mississippi"

        # Atlantic/Naval
        if any(word in text for word in ["blockade", "naval", "ironclad", "monitor", "merrimack", "charleston harbor", "mobile bay"]):  # noqa: E501
            return "Atlantic/Naval"

        # Georgia Campaign
        if any(word in text for word in ["atlanta", "georgia", "march to the sea", "savannah", "sherman"]):  # noqa: E501
            return "Georgia"

        # Carolinas
        if any(word in text for word in ["carolina", "fort sumter", "charleston"]):
            return "Carolinas"

        # Washington D.C.
        if any(word in text for word in ["washington", "capitol", "white house", "ford's theatre"]):
            return "Washington D.C."

        return "United States"

    def _extract_tags(self, title: str, content: str) -> list[str]:
        """Extract relevant tags for the event."""
        tags = []
        text = (title + " " + content).lower()

        tag_keywords = {
            "military": ["army", "troops", "soldiers", "warfare", "battle", "regiment", "corps", "division"],  # noqa: E501
            "naval": ["ships", "fleet", "naval", "navy", "ironclad", "blockade", "gunboat"],
            "political": ["election", "congress", "president", "governor", "legislature", "secession"],  # noqa: E501
            "slavery": ["slavery", "emancipation", "abolition", "freedmen", "contraband", "slave"],
            "cavalry": ["cavalry", "horsemen", "raiders", "mounted"],
            "artillery": ["artillery", "cannon", "batteries", "bombardment"],
            "siege": ["siege", "fortification", "entrenchment", "trenches"],
            "surrender": ["surrender", "capitulation", "armistice"],
            "assassination": ["assassination", "murder", "booth"],
            "speech": ["speech", "address", "proclamation", "declaration"],
            "leadership": ["general", "commander", "president", "secretary"],
            "logistics": ["supply", "railroad", "telegraph", "reinforcement"],
        }

        for tag, keywords in tag_keywords.items():
            if any(kw in text for kw in keywords):
                tags.append(tag)

        return tags
