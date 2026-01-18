"""Library of Congress API scraper for historical content.

Scrapes newspapers, manuscripts, and photographs from the LOC JSON API.
Excellent for Civil War era content with precise publication dates.

API Documentation: https://www.loc.gov/apis/json-and-yaml/
Rate limit: 20 requests/minute
"""

import json
from collections.abc import AsyncIterator
from datetime import datetime
from urllib.parse import quote_plus

import structlog

from riskyrag.core.registry import register_scraper
from riskyrag.core.types import EventType, HistoricalEvent, RawDocument
from riskyrag.scrapers.base import BaseScraper

logger = structlog.get_logger()

# LOC API base URL
LOC_API_BASE = "https://www.loc.gov"

# Collections relevant for Civil War
LOC_COLLECTIONS = [
    "chronicling-america",  # Newspapers
    "abraham-lincoln-papers",  # Lincoln papers
    "civil-war-maps",  # Maps
]


@register_scraper("loc")
class LibraryOfCongressScraper(BaseScraper):
    """Scraper for Library of Congress historical collections.

    Fetches newspapers, manuscripts, and other primary sources
    with precise publication dates for temporal RAG filtering.
    """

    # LOC rate limit: 20 requests/minute
    requests_per_second: float = 0.3  # ~18 requests/minute to be safe
    max_concurrent_requests: int = 2

    @property
    def name(self) -> str:
        return "loc"

    async def scrape(
        self,
        date_range: tuple[int, int] | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[HistoricalEvent]:
        """Scrape historical content from Library of Congress.

        Args:
            date_range: Optional tuple of (start_year, end_year) to filter events
            limit: Optional maximum number of events to return

        Yields:
            HistoricalEvent objects
        """
        date_range = date_range or (1861, 1865)
        count = 0
        per_page = 25  # LOC default

        # Search across Civil War related content
        search_terms = [
            "civil war battle",
            "confederate army",
            "union army",
            "Abraham Lincoln",
            "General Grant",
            "General Lee",
        ]

        for search_term in search_terms:
            if limit and count >= limit:
                break

            # Build search URL with date filtering
            start_date = f"{date_range[0]}-01-01"
            end_date = f"{date_range[1]}-12-31"
            encoded_term = quote_plus(search_term)

            url = (
                f"{LOC_API_BASE}/search/"
                f"?q={encoded_term}"
                f"&start_date={start_date}"
                f"&end_date={end_date}"
                f"&fo=json"
                f"&c={per_page}"
                f"&sp=1"
            )

            try:
                doc = await self.fetch(url)
                events = self.parse_document(doc)

                for event in events:
                    yield event
                    count += 1

                    if limit and count >= limit:
                        return

            except Exception as e:
                logger.error("Failed to search LOC", term=search_term, error=str(e))
                continue

        # Also fetch from specific collections
        for collection in LOC_COLLECTIONS:
            if limit and count >= limit:
                break

            start_date = f"{date_range[0]}-01-01"
            end_date = f"{date_range[1]}-12-31"

            url = (
                f"{LOC_API_BASE}/collections/{collection}/"
                f"?start_date={start_date}"
                f"&end_date={end_date}"
                f"&fo=json"
                f"&c={per_page}"
            )

            try:
                doc = await self.fetch(url)
                events = self.parse_document(doc)

                for event in events:
                    yield event
                    count += 1

                    if limit and count >= limit:
                        return

            except Exception as e:
                logger.error("Failed to fetch collection", collection=collection, error=str(e))
                continue

    def parse_document(self, doc: RawDocument) -> list[HistoricalEvent]:
        """Parse LOC JSON API response into historical events."""
        events: list[HistoricalEvent] = []

        try:
            data = json.loads(doc.html)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse LOC JSON", error=str(e))
            return events

        results = data.get("results", [])

        for item in results:
            try:
                title = item.get("title", "")
                if not title:
                    continue

                # Extract date
                event_date = self._extract_date(item)
                if not event_date:
                    continue

                # Build content from available fields
                content_parts = [title]

                description = item.get("description", "")
                if isinstance(description, list):
                    description = " ".join(description[:3])
                if description:
                    content_parts.append(description[:500])

                # Add subject information
                subjects = item.get("subject", [])
                if subjects:
                    content_parts.append(f"Subjects: {', '.join(subjects[:5])}.")

                # Add location
                locations = item.get("location", [])
                if locations:
                    content_parts.append(f"Location: {', '.join(locations[:3])}.")

                content = " ".join(content_parts)

                # Determine event type
                event_type = self._classify_event(title, content, item)

                # Get source URL
                source_url = item.get("id", "") or item.get("url", "") or doc.url

                # Extract participants/contributors
                contributors = item.get("contributor", [])
                participants = self._extract_participants(title + " " + content)

                events.append(
                    HistoricalEvent(
                        title=title[:200],  # Limit title length
                        content=content[:2000],
                        event_date=event_date,
                        publication_date=event_date,
                        participants=participants,
                        event_type=event_type,
                        region="United States",
                        source_url=source_url,
                        tags=self._extract_tags(item, title, content),
                    )
                )

            except Exception as e:
                logger.warning("Failed to parse LOC item", error=str(e))
                continue

        return events

    def _extract_date(self, item: dict) -> datetime | None:
        """Extract date from LOC item."""
        # Try the 'date' field first (YYYY-MM-DD)
        date_str = item.get("date", "")
        if date_str:
            parsed = self._parse_date_string(date_str)
            if parsed:
                return parsed

        # Try 'dates' array
        dates = item.get("dates", [])
        if dates:
            for date in dates:
                parsed = self._parse_date_string(str(date))
                if parsed:
                    return parsed

        # Try 'created_published'
        created = item.get("created_published", [])
        if created:
            for cp in created:
                parsed = self._parse_date_string(str(cp))
                if parsed:
                    return parsed

        return None

    def _parse_date_string(self, date_str: str) -> datetime | None:
        """Parse various date formats from LOC."""
        if not date_str:
            return None

        import re

        # Try YYYY-MM-DD
        match = re.search(r"(\d{4})-(\d{2})-(\d{2})", date_str)
        if match:
            try:
                return datetime(int(match.group(1)), int(match.group(2)), int(match.group(3)))
            except ValueError:
                pass

        # Try "Month DD, YYYY" or "DD Month YYYY"
        month_map = {
            "january": 1, "february": 2, "march": 3, "april": 4,
            "may": 5, "june": 6, "july": 7, "august": 8,
            "september": 9, "october": 10, "november": 11, "december": 12,
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7,
            "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
        }

        # "April 15, 1865"
        match = re.search(
            r"(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s]+(\d{1,2})[,\s]+(\d{4})",
            date_str,
            re.IGNORECASE,
        )
        if match:
            try:
                month = month_map[match.group(1).lower()]
                return datetime(int(match.group(3)), month, int(match.group(2)))
            except (KeyError, ValueError):
                pass

        # Just year (YYYY)
        match = re.search(r"\b(18\d{2}|19\d{2})\b", date_str)
        if match:
            return datetime(int(match.group(1)), 6, 15)

        return None

    def _classify_event(self, title: str, content: str, item: dict) -> EventType:
        """Classify the event type."""
        text = (title + " " + content).lower()

        # Check original_format for hints
        formats = item.get("original_format", [])
        if isinstance(formats, list):
            formats = " ".join(formats).lower()
        else:
            formats = str(formats).lower()

        if "battle" in text or "engagement" in text:
            return EventType.BATTLE
        if "treaty" in text or "surrender" in text:
            return EventType.TREATY
        if "map" in formats:
            return EventType.TERRITORIAL_CHANGE
        if "letter" in formats or "correspondence" in formats:
            return EventType.DIPLOMATIC
        if "newspaper" in formats:
            return EventType.OTHER

        return EventType.OTHER

    def _extract_participants(self, text: str) -> list[str]:
        """Extract participants/nations from text."""
        participants = []

        keywords = {
            "Union": "United States",
            "Confederate": "Confederate States",
            "United States": "United States",
            "Lincoln": "United States",
            "Grant": "United States",
            "Sherman": "United States",
            "Lee": "Confederate States",
            "Davis": "Confederate States",
            "Jackson": "Confederate States",
        }

        for keyword, nation in keywords.items():
            if keyword.lower() in text.lower() and nation not in participants:
                participants.append(nation)

        return participants or ["United States"]

    def _extract_tags(self, item: dict, title: str, content: str) -> list[str]:
        """Extract tags from LOC item."""
        tags = ["loc", "civil_war"]

        # Add subjects as tags
        subjects = item.get("subject", [])
        for subject in subjects[:5]:
            tag = str(subject).lower().replace(" ", "_")[:30]
            if tag and tag not in tags:
                tags.append(tag)

        # Add format-based tags
        formats = item.get("original_format", [])
        if isinstance(formats, list):
            for fmt in formats[:3]:
                tag = str(fmt).lower().replace(" ", "_")[:20]
                if tag:
                    tags.append(tag)

        return tags[:10]  # Limit to 10 tags
