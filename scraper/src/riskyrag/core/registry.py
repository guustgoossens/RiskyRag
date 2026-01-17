"""Scraper registry pattern for RiskyRag.

This module provides a decorator-based registration system for scrapers,
inspired by the pattern used in the context repository.
"""

from collections.abc import Callable
from typing import TYPE_CHECKING, TypeVar

import structlog

if TYPE_CHECKING:
    from riskyrag.scrapers.base import BaseScraper

logger = structlog.get_logger()

T = TypeVar("T", bound="BaseScraper")


class ScraperRegistry:
    """Registry for historical data scrapers.

    Scrapers can register themselves using the @register_scraper decorator,
    and can be retrieved by name using get_scraper().
    """

    _scrapers: dict[str, type["BaseScraper"]] = {}

    @classmethod
    def register(cls, name: str) -> Callable[[type[T]], type[T]]:
        """Register a scraper class with the given name.

        Usage:
            @ScraperRegistry.register("wikipedia")
            class WikipediaScraper(BaseScraper):
                ...
        """

        def decorator(scraper_class: type[T]) -> type[T]:
            if name in cls._scrapers:
                logger.warning(
                    "Overwriting existing scraper",
                    name=name,
                    old=cls._scrapers[name].__name__,
                    new=scraper_class.__name__,
                )
            cls._scrapers[name] = scraper_class
            logger.debug("Registered scraper", name=name, class_name=scraper_class.__name__)
            return scraper_class

        return decorator

    @classmethod
    def get(cls, name: str) -> type["BaseScraper"] | None:
        """Get a scraper class by name."""
        return cls._scrapers.get(name)

    @classmethod
    def list_all(cls) -> list[str]:
        """List all registered scraper names."""
        return list(cls._scrapers.keys())

    @classmethod
    def clear(cls) -> None:
        """Clear all registered scrapers (for testing)."""
        cls._scrapers.clear()


# Convenience functions
def register_scraper(name: str) -> Callable[[type[T]], type[T]]:
    """Decorator to register a scraper.

    Usage:
        @register_scraper("wikipedia")
        class WikipediaScraper(BaseScraper):
            ...
    """
    return ScraperRegistry.register(name)


def get_scraper(name: str) -> type["BaseScraper"] | None:
    """Get a scraper class by name."""
    return ScraperRegistry.get(name)


def list_scrapers() -> list[str]:
    """List all registered scraper names."""
    return ScraperRegistry.list_all()
