"""Wikidata SPARQL scraper for historical events.

Queries Wikidata's SPARQL endpoint for battles, sieges, and treaties
with structured date metadata. Excellent for 1453 Constantinople scenario.

Endpoint: https://query.wikidata.org/sparql
Rate limit: 5 concurrent requests, 60s query time per minute
"""

import json
from collections.abc import AsyncIterator
from datetime import datetime
from urllib.parse import quote

import structlog

from riskyrag.core.registry import register_scraper
from riskyrag.core.types import EventType, HistoricalEvent, RawDocument
from riskyrag.scrapers.base import BaseScraper

logger = structlog.get_logger()

# Wikidata SPARQL endpoint
WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"

# SPARQL query template for historical events
# This queries for battles, sieges, and wars within a date range
SPARQL_QUERY_TEMPLATE = """
SELECT DISTINCT ?event ?eventLabel ?description ?date ?startDate ?endDate
       ?location ?locationLabel ?participant ?participantLabel
WHERE {{
  # Match events that are battles, sieges, wars, or treaties
  {{
    ?event wdt:P31/wdt:P279* wd:Q178561 .  # Instance of battle (or subclass)
  }}
  UNION
  {{
    ?event wdt:P31/wdt:P279* wd:Q645503 .  # Instance of siege (or subclass)
  }}
  UNION
  {{
    ?event wdt:P31/wdt:P279* wd:Q131569 .  # Instance of war (or subclass)
  }}
  UNION
  {{
    ?event wdt:P31/wdt:P279* wd:Q131196 .  # Instance of treaty (or subclass)
  }}

  # Get dates - try multiple date properties
  OPTIONAL {{ ?event wdt:P585 ?date . }}       # Point in time
  OPTIONAL {{ ?event wdt:P580 ?startDate . }}  # Start time
  OPTIONAL {{ ?event wdt:P582 ?endDate . }}    # End time

  # Filter by date range
  FILTER(
    (BOUND(?date) && YEAR(?date) >= {start_year} && YEAR(?date) <= {end_year})
    ||
    (BOUND(?startDate) && YEAR(?startDate) >= {start_year} && YEAR(?startDate) <= {end_year})
    ||
    (BOUND(?endDate) && YEAR(?endDate) >= {start_year} && YEAR(?endDate) <= {end_year})
  )

  # Get location if available
  OPTIONAL {{ ?event wdt:P276 ?location . }}  # Location
  OPTIONAL {{ ?event wdt:P17 ?location . }}   # Country

  # Get participants
  OPTIONAL {{ ?event wdt:P710 ?participant . }}  # Participant

  # Get description
  OPTIONAL {{ ?event schema:description ?description . FILTER(LANG(?description) = "en") }}

  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
}}
ORDER BY ?date ?startDate
LIMIT {limit}
"""

# Simpler query for Ottoman/Byzantine events (faster execution)
SPARQL_OTTOMAN_QUERY = """
SELECT DISTINCT ?event ?eventLabel ?description ?date ?startDate ?endDate ?participant ?participantLabel
WHERE {{
  # Match battles and sieges directly (no subclass traversal)
  VALUES ?type {{ wd:Q178561 wd:Q645503 wd:Q188055 }}  # Battle, Siege, Naval battle
  ?event wdt:P31 ?type .

  # Get dates
  OPTIONAL {{ ?event wdt:P585 ?date . }}
  OPTIONAL {{ ?event wdt:P580 ?startDate . }}

  # Filter by date range
  FILTER(
    (BOUND(?date) && YEAR(?date) >= {start_year} && YEAR(?date) <= {end_year})
    ||
    (BOUND(?startDate) && YEAR(?startDate) >= {start_year} && YEAR(?startDate) <= {end_year})
  )

  # Get participants
  OPTIONAL {{ ?event wdt:P710 ?participant . }}
  OPTIONAL {{ ?event schema:description ?description . FILTER(LANG(?description) = "en") }}

  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
}}
ORDER BY ?date ?startDate
LIMIT {limit}
"""


@register_scraper("wikidata")
class WikidataScraper(BaseScraper):
    """Scraper for historical events from Wikidata SPARQL endpoint.

    Queries the Wikidata knowledge graph for battles, sieges, wars,
    and treaties with structured date information.
    """

    # Wikidata rate limits: be conservative
    requests_per_second: float = 0.3  # 1 request every 3 seconds
    max_concurrent_requests: int = 1

    async def __aenter__(self) -> "WikidataScraper":
        """Enter async context with Wikidata-specific headers."""
        import httpx

        self._client = httpx.AsyncClient(
            timeout=60.0,  # Wikidata queries can be slow
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "RiskyRag Historical Scraper/1.0 "
                    "(https://github.com/riskyrag; guust@accaio.com; educational project)"
                ),
                "Accept": "application/sparql-results+json",
            },
        )
        return self

    @property
    def name(self) -> str:
        return "wikidata"

    async def scrape(
        self,
        date_range: tuple[int, int] | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[HistoricalEvent]:
        """Scrape historical events from Wikidata.

        Args:
            date_range: Optional tuple of (start_year, end_year) to filter events
            limit: Optional maximum number of events to return

        Yields:
            HistoricalEvent objects
        """
        date_range = date_range or (1400, 1500)
        query_limit = min(limit or 500, 500)  # Wikidata works better with smaller queries
        count = 0

        # Use Ottoman-specific query for 1400-1500 range
        if date_range[0] >= 1300 and date_range[1] <= 1600:
            query = SPARQL_OTTOMAN_QUERY.format(
                start_year=date_range[0],
                end_year=date_range[1],
                limit=query_limit,
            )
        else:
            query = SPARQL_QUERY_TEMPLATE.format(
                start_year=date_range[0],
                end_year=date_range[1],
                limit=query_limit,
            )

        # Build the URL with encoded query
        url = f"{WIKIDATA_ENDPOINT}?query={quote(query)}&format=json"

        try:
            doc = await self.fetch(url)
            events = self.parse_document(doc)

            # Deduplicate by title (Wikidata can return duplicates due to multiple participants)
            seen_titles: set[str] = set()
            for event in events:
                if event.title in seen_titles:
                    continue
                seen_titles.add(event.title)

                yield event
                count += 1

                if limit and count >= limit:
                    return

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "Too Many Requests" in error_msg:
                logger.warning(
                    "Wikidata rate limited - try again later or use smaller queries",
                    error=error_msg,
                )
            elif "503" in error_msg or "502" in error_msg:
                logger.warning(
                    "Wikidata service temporarily unavailable",
                    error=error_msg,
                )
            else:
                logger.error(
                    "Failed to query Wikidata - endpoint may be blocking automated requests",
                    error=error_msg,
                    hint="Try using a VPN or waiting a few minutes",
                )

    def parse_document(self, doc: RawDocument) -> list[HistoricalEvent]:
        """Parse Wikidata SPARQL JSON response into historical events."""
        events: list[HistoricalEvent] = []

        try:
            data = json.loads(doc.html)
        except json.JSONDecodeError as e:
            logger.error("Failed to parse Wikidata JSON", error=str(e))
            return events

        bindings = data.get("results", {}).get("bindings", [])

        # Group by event URI to collect all participants
        event_map: dict[str, dict] = {}

        for binding in bindings:
            event_uri = binding.get("event", {}).get("value", "")
            if not event_uri:
                continue

            if event_uri not in event_map:
                event_map[event_uri] = {
                    "uri": event_uri,
                    "label": binding.get("eventLabel", {}).get("value", "Unknown Event"),
                    "description": binding.get("description", {}).get("value", ""),
                    "date": binding.get("date", {}).get("value"),
                    "startDate": binding.get("startDate", {}).get("value"),
                    "endDate": binding.get("endDate", {}).get("value"),
                    "location": binding.get("locationLabel", {}).get("value", ""),
                    "participants": [],
                }

            # Add participant if present
            participant = binding.get("participantLabel", {}).get("value")
            if participant and participant not in event_map[event_uri]["participants"]:
                event_map[event_uri]["participants"].append(participant)

        # Convert to HistoricalEvent objects
        for event_data in event_map.values():
            event_date = self._parse_wikidata_date(
                event_data.get("date")
                or event_data.get("startDate")
                or event_data.get("endDate")
            )

            if not event_date:
                continue

            title = event_data["label"]
            description = event_data.get("description", "")
            location = event_data.get("location", "")
            participants = event_data.get("participants", [])

            # Build content
            content_parts = [title]
            if description:
                content_parts.append(description)
            content_parts.append(f"Date: {event_date.strftime('%B %d, %Y')}.")
            if location:
                content_parts.append(f"Location: {location}.")
            if participants:
                content_parts.append(f"Participants: {', '.join(participants[:5])}.")

            content = " ".join(content_parts)

            # Classify event type
            event_type = self._classify_event(title, description)

            # Determine region
            region = self._determine_region(location, participants)

            events.append(
                HistoricalEvent(
                    title=title,
                    content=content,
                    event_date=event_date,
                    publication_date=event_date,
                    participants=participants[:10],  # Limit participants
                    event_type=event_type,
                    region=region,
                    source_url=event_data["uri"],
                    tags=self._extract_tags(title, description, event_type),
                )
            )

        return events

    def _parse_wikidata_date(self, date_str: str | None) -> datetime | None:
        """Parse a Wikidata date string (ISO 8601 format)."""
        if not date_str:
            return None

        try:
            # Wikidata dates are like "1453-05-29T00:00:00Z"
            # or "-0500-01-01T00:00:00Z" for BCE dates
            if date_str.startswith("-"):
                # BCE date - skip for now
                return None

            # Parse ISO format
            date_part = date_str.split("T")[0]
            parts = date_part.split("-")

            if len(parts) >= 3:
                year = int(parts[0])
                month = int(parts[1]) or 6
                day = int(parts[2]) or 15
                return datetime(year, month, day)
            elif len(parts) == 1:
                year = int(parts[0])
                return datetime(year, 6, 15)

        except (ValueError, IndexError) as e:
            logger.debug("Failed to parse date", date_str=date_str, error=str(e))

        return None

    def _classify_event(self, title: str, description: str) -> EventType:
        """Classify the event type based on title and description."""
        text = (title + " " + description).lower()

        if "siege" in text:
            return EventType.SIEGE
        if "battle" in text or "war" in text:
            return EventType.BATTLE
        if "treaty" in text or "peace" in text:
            return EventType.TREATY
        if "conquest" in text or "fall of" in text:
            return EventType.TERRITORIAL_CHANGE

        return EventType.BATTLE  # Default for military events

    def _determine_region(self, location: str, participants: list[str]) -> str:
        """Determine region based on location and participants."""
        text = (location + " " + " ".join(participants)).lower()

        if any(term in text for term in ["constantinople", "byzantine", "istanbul"]):
            return "Constantinople"
        if any(term in text for term in ["ottoman", "turkey", "anatolia"]):
            return "Anatolia"
        if any(term in text for term in ["balkans", "serbia", "bulgaria", "greece"]):
            return "Balkans"
        if any(term in text for term in ["hungary", "poland", "eastern europe"]):
            return "Eastern Europe"
        if any(term in text for term in ["venice", "genoa", "italy", "mediterranean"]):
            return "Mediterranean"

        return "Europe"

    def _extract_tags(
        self, title: str, description: str, event_type: EventType
    ) -> list[str]:
        """Extract relevant tags for the event."""
        tags = [event_type.value]
        text = (title + " " + description).lower()

        if "ottoman" in text:
            tags.append("ottoman")
        if "byzantine" in text:
            tags.append("byzantine")
        if "crusade" in text:
            tags.append("crusade")
        if "naval" in text:
            tags.append("naval")
        if "siege" in text:
            tags.append("siege")

        return tags
