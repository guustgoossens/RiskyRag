"""ACW Battle Data scraper for Civil War battles.

Scrapes structured battle data from the acw_battle_data GitHub repository.
Data includes 382+ battles with precise dates, locations, and outcomes.

Source: https://github.com/jrnold/acw_battle_data
License: ODC-BY (Open Data Commons Attribution)
"""

import csv
import io
from collections.abc import AsyncIterator
from datetime import datetime

import structlog

from riskyrag.core.registry import register_scraper
from riskyrag.core.types import EventType, HistoricalEvent, RawDocument
from riskyrag.scrapers.base import BaseScraper

logger = structlog.get_logger()

# Raw CSV URLs from the acw_battle_data GitHub repo
ACW_DATA_URLS = {
    "cwsac_battles": "https://raw.githubusercontent.com/jrnold/acw_battle_data/master/build/acw_battle_data/cwsac_battles.csv",
    "nps_battles": "https://raw.githubusercontent.com/jrnold/acw_battle_data/master/build/acw_battle_data/nps_battles.csv",
    "thorpe_engagements": "https://raw.githubusercontent.com/jrnold/acw_battle_data/master/build/acw_battle_data/thorpe_engagements.csv",
}

# US states during Civil War era
CONFEDERATE_STATES = ["VA", "NC", "SC", "GA", "FL", "AL", "MS", "LA", "TX", "AR", "TN"]
BORDER_STATES = ["MD", "DE", "KY", "MO", "WV"]
UNION_STATES = ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA", "OH", "IN", "IL", "MI", "WI", "MN", "IA", "KS", "CA", "OR", "NV"]


@register_scraper("acw_battles")
class ACWBattleScraper(BaseScraper):
    """Scraper for American Civil War battle data from GitHub.

    Fetches structured CSV data with precise dates (YYYY-MM-DD format),
    locations, outcomes, casualties, and battle significance.
    """

    requests_per_second: float = 5.0  # GitHub is more permissive
    max_concurrent_requests: int = 3

    @property
    def name(self) -> str:
        return "acw_battles"

    async def scrape(
        self,
        date_range: tuple[int, int] | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[HistoricalEvent]:
        """Scrape Civil War battles from the acw_battle_data repository.

        Args:
            date_range: Optional tuple of (start_year, end_year) to filter events
            limit: Optional maximum number of events to return

        Yields:
            HistoricalEvent objects
        """
        date_range = date_range or (1861, 1865)
        count = 0

        # Primary source: CWSAC battles (most authoritative)
        url = ACW_DATA_URLS["cwsac_battles"]
        try:
            doc = await self.fetch(url)
            events = self.parse_document(doc)

            for event in events:
                event_year = event.event_date.year
                if date_range[0] <= event_year <= date_range[1]:
                    yield event
                    count += 1

                    if limit and count >= limit:
                        return

        except Exception as e:
            logger.error("Failed to scrape CWSAC battles", error=str(e))

        # Secondary source: Thorpe engagements (more events, less detail)
        if not limit or count < limit:
            url = ACW_DATA_URLS["thorpe_engagements"]
            try:
                doc = await self.fetch(url)
                events = self._parse_thorpe(doc)

                for event in events:
                    event_year = event.event_date.year
                    if date_range[0] <= event_year <= date_range[1]:
                        yield event
                        count += 1

                        if limit and count >= limit:
                            return

            except Exception as e:
                logger.error("Failed to scrape Thorpe engagements", error=str(e))

    def parse_document(self, doc: RawDocument) -> list[HistoricalEvent]:
        """Parse CWSAC battles CSV into historical events."""
        events: list[HistoricalEvent] = []

        reader = csv.DictReader(io.StringIO(doc.html))

        for row in reader:
            try:
                # Parse dates (YYYY-MM-DD format)
                start_date = self._parse_date(row.get("start_date", ""))
                if not start_date:
                    continue

                battle_name = row.get("battle_name", "Unknown Battle")
                other_names = row.get("other_names", "")
                state = row.get("state", "")
                campaign = row.get("campaign", "")
                result = row.get("result", "")
                forces_text = row.get("forces_text", "")
                casualties_text = row.get("casualties_text", "")
                significance = row.get("significance", "")

                # Build content
                content_parts = [f"The Battle of {battle_name}"]
                if other_names:
                    content_parts.append(f"(also known as {other_names})")
                content_parts.append(f"was fought on {start_date.strftime('%B %d, %Y')} in {state}.")

                if campaign:
                    content_parts.append(f"Part of the {campaign}.")

                if forces_text:
                    content_parts.append(forces_text)

                if result:
                    content_parts.append(f"Result: {result} victory.")

                if casualties_text:
                    content_parts.append(casualties_text)

                content = " ".join(content_parts)

                # Determine participants based on result
                participants = ["United States", "Confederate States"]

                # Determine region based on state
                region = self._determine_region(state)

                # Build tags
                tags = ["civil_war", "battle"]
                if significance:
                    tags.append(f"significance_{significance.lower()}")
                if "siege" in battle_name.lower():
                    tags.append("siege")
                if "naval" in forces_text.lower():
                    tags.append("naval")

                events.append(
                    HistoricalEvent(
                        title=f"Battle of {battle_name}",
                        content=content,
                        event_date=start_date,
                        publication_date=start_date,
                        participants=participants,
                        event_type=EventType.BATTLE,
                        region=region,
                        source_url=doc.url,
                        tags=tags,
                    )
                )

            except Exception as e:
                logger.warning("Failed to parse battle row", error=str(e), row=row)
                continue

        return events

    def _parse_thorpe(self, doc: RawDocument) -> list[HistoricalEvent]:
        """Parse Thorpe engagements CSV into historical events."""
        events: list[HistoricalEvent] = []

        reader = csv.DictReader(io.StringIO(doc.html))

        for row in reader:
            try:
                # Parse date components
                year = row.get("year", "")
                month = row.get("month", "")
                day = row.get("day", "")

                if not year:
                    continue

                # Handle unknown day
                if row.get("day_unknown") == "TRUE" or not day:
                    day = "15"  # Middle of month
                if not month:
                    month = "6"  # Middle of year

                try:
                    event_date = datetime(int(year), int(month), int(day))
                except ValueError:
                    event_date = datetime(int(year), 6, 15)

                name = row.get("name", "Unknown Engagement")
                description = row.get("description", "")
                engagement_type = row.get("type", "engagement")
                killed_total = row.get("killed_total", "")
                casualties_us = row.get("casualties_us", "")
                casualties_cs = row.get("casualties_cs", "")
                lat = row.get("lat", "")
                lng = row.get("lng", "")

                # Build content
                content_parts = [f"{name}: {description}" if description else name]
                content_parts.append(f"Occurred on {event_date.strftime('%B %d, %Y')}.")

                if killed_total:
                    content_parts.append(f"Total killed: {killed_total}.")
                if casualties_us:
                    content_parts.append(f"Union casualties: {casualties_us}.")
                if casualties_cs:
                    content_parts.append(f"Confederate casualties: {casualties_cs}.")

                content = " ".join(content_parts)

                # Classify event type
                event_type = EventType.BATTLE
                if "siege" in engagement_type.lower():
                    event_type = EventType.SIEGE

                events.append(
                    HistoricalEvent(
                        title=name,
                        content=content,
                        event_date=event_date,
                        publication_date=event_date,
                        participants=["United States", "Confederate States"],
                        event_type=event_type,
                        region="United States",
                        source_url=doc.url,
                        tags=["civil_war", engagement_type.lower()],
                    )
                )

            except Exception as e:
                logger.warning("Failed to parse Thorpe row", error=str(e))
                continue

        return events

    def _parse_date(self, date_str: str) -> datetime | None:
        """Parse a date string in YYYY-MM-DD format."""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str.strip(), "%Y-%m-%d")
        except ValueError:
            return None

    def _determine_region(self, state: str) -> str:
        """Determine region based on state abbreviation."""
        if state in CONFEDERATE_STATES:
            return "Confederate States"
        elif state in BORDER_STATES:
            return "Border States"
        elif state in UNION_STATES:
            return "Union States"
        else:
            return "United States"
