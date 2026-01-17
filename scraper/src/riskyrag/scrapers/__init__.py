"""Scrapers for historical data sources."""

from riskyrag.scrapers.base import BaseScraper
from riskyrag.scrapers.wikipedia import WikipediaScraper

__all__ = ["BaseScraper", "WikipediaScraper"]
