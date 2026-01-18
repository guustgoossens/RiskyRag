"""Core types and utilities for RiskyRag scraper."""

from riskyrag.core.registry import (
    ScraperRegistry,
    get_scraper,
    list_scrapers,
    register_scraper,
)
from riskyrag.core.types import (
    EventType,
    HistoricalEvent,
    ProcessedSnippet,
    RawDocument,
)

__all__ = [
    "EventType",
    "HistoricalEvent",
    "ProcessedSnippet",
    "RawDocument",
    "ScraperRegistry",
    "register_scraper",
    "get_scraper",
    "list_scrapers",
]
