"""Scrapers for historical data sources.

Available scrapers (registered names):
- constantinople: Wikipedia scraper for 1453 scenario
- civil_war: Wikipedia scraper for Civil War scenario
- acw_battles: ACW Battle Data (GitHub CSV) for Civil War battles
- wikidata: Wikidata SPARQL for battles/sieges/treaties
- loc: Library of Congress API for newspapers/manuscripts
- deremilitari: De Re Militari siege diaries (1453)
"""

from riskyrag.scrapers.base import BaseScraper

# Import all scrapers to trigger registration
from riskyrag.scrapers.acw_battles import ACWBattleScraper
from riskyrag.scrapers.civil_war import CivilWarScraper
from riskyrag.scrapers.constantinople import ConstantinopleScraper
from riskyrag.scrapers.deremilitari import DeReMilitariScraper
from riskyrag.scrapers.loc import LibraryOfCongressScraper
from riskyrag.scrapers.wikidata import WikidataScraper

__all__ = [
    "BaseScraper",
    # 1453 Constantinople scenario
    "ConstantinopleScraper",
    "WikidataScraper",
    "DeReMilitariScraper",
    # Civil War scenario
    "CivilWarScraper",
    "ACWBattleScraper",
    "LibraryOfCongressScraper",
]