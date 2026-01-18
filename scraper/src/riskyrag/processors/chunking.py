"""Text chunking for historical content.

This module provides intelligent chunking that preserves temporal context
and maintains date metadata across chunks.
"""

import re
from dataclasses import dataclass

import structlog

from riskyrag.core.types import HistoricalEvent

logger = structlog.get_logger()


@dataclass
class Chunk:
    """A chunk of text with inherited metadata from parent event."""

    content: str
    chunk_index: int
    total_chunks: int
    parent_title: str
    # Inherited from parent event
    event_date: float  # Unix timestamp ms
    publication_date: float
    source_url: str
    region: str
    tags: list[str]
    participants: list[str]


class TextChunker:
    """Chunks historical content while preserving temporal metadata.

    Uses sentence-aware chunking with configurable overlap to maintain
    context across chunk boundaries.
    """

    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 100,
        min_chunk_size: int = 100,
    ) -> None:
        """Initialize the chunker.

        Args:
            chunk_size: Target size for each chunk in characters
            chunk_overlap: Number of overlapping characters between chunks
            min_chunk_size: Minimum chunk size (smaller content stays as-is)
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def chunk_event(self, event: HistoricalEvent) -> list[Chunk]:
        """Chunk a historical event into smaller pieces.

        Each chunk inherits the parent event's temporal metadata,
        ensuring temporal RAG filtering works correctly.

        Args:
            event: The historical event to chunk

        Returns:
            List of Chunk objects with inherited metadata
        """
        content = event.content.strip()

        # If content is small enough, return as single chunk
        if len(content) <= self.chunk_size:
            return [
                Chunk(
                    content=content,
                    chunk_index=0,
                    total_chunks=1,
                    parent_title=event.title,
                    event_date=event.event_timestamp,
                    publication_date=event.publication_timestamp,
                    source_url=event.source_url,
                    region=event.region,
                    tags=event.tags,
                    participants=event.participants,
                )
            ]

        # Split into sentences first
        sentences = self._split_sentences(content)

        # Group sentences into chunks
        chunks_text = self._group_sentences(sentences)

        # Create Chunk objects with inherited metadata
        chunks = []
        for i, chunk_text in enumerate(chunks_text):
            chunks.append(
                Chunk(
                    content=chunk_text,
                    chunk_index=i,
                    total_chunks=len(chunks_text),
                    parent_title=event.title,
                    event_date=event.event_timestamp,
                    publication_date=event.publication_timestamp,
                    source_url=event.source_url,
                    region=event.region,
                    tags=event.tags,
                    participants=event.participants,
                )
            )

        logger.debug(
            "Chunked event",
            title=event.title,
            original_length=len(content),
            num_chunks=len(chunks),
        )

        return chunks

    def _split_sentences(self, text: str) -> list[str]:
        """Split text into sentences.

        Uses a simple approach that handles most cases:
        1. Split on sentence-ending punctuation followed by space and capital
        2. Handles common abbreviations by not splitting after them
        """
        # First, protect common abbreviations by replacing periods with placeholder
        protected = text
        abbreviations = [
            "Dr.", "Mr.", "Mrs.", "Ms.", "Jr.", "Sr.", "St.", "Gen.", "Col.",
            "Capt.", "Lt.", "Rev.", "Hon.", "Prof.", "U.S.", "U.K.", "etc.",
            "vs.", "i.e.", "e.g.", "c.", "ca.", "No.", "Vol.", "pp.", "Ch.",
        ]
        placeholder = "\x00"  # Null char as placeholder
        for abbr in abbreviations:
            protected = protected.replace(abbr, abbr.replace(".", placeholder))

        # Split on sentence endings: . ! ? followed by space(s) and capital letter
        # or end of string
        pattern = r'(?<=[.!?])\s+(?=[A-Z])'
        sentences = re.split(pattern, protected)

        # Restore abbreviations and filter
        result = []
        for s in sentences:
            restored = s.replace(placeholder, ".").strip()
            if restored:
                result.append(restored)

        return result

    def _group_sentences(self, sentences: list[str]) -> list[str]:
        """Group sentences into chunks with overlap.

        Tries to keep chunks close to target size while respecting
        sentence boundaries.
        """
        if not sentences:
            return []

        chunks = []
        current_chunk: list[str] = []
        current_length = 0

        for sentence in sentences:
            sentence_len = len(sentence)

            # If adding this sentence would exceed chunk size
            if current_length + sentence_len > self.chunk_size and current_chunk:
                # Save current chunk
                chunks.append(" ".join(current_chunk))

                # Start new chunk with overlap from previous
                overlap_text = self._get_overlap_sentences(current_chunk)
                if overlap_text:
                    current_chunk = [overlap_text]
                    current_length = len(overlap_text)
                else:
                    current_chunk = []
                    current_length = 0

            current_chunk.append(sentence)
            current_length += sentence_len + 1  # +1 for space

        # Don't forget the last chunk
        if current_chunk:
            final_chunk = " ".join(current_chunk)
            # Only add if it meets minimum size or is the only chunk
            if len(final_chunk) >= self.min_chunk_size or not chunks:
                chunks.append(final_chunk)
            elif chunks:
                # Merge with previous chunk if too small
                chunks[-1] = chunks[-1] + " " + final_chunk

        return chunks

    def _get_overlap_sentences(self, sentences: list[str]) -> str:
        """Get sentences from the end to use as overlap.

        Returns sentences that fit within the overlap size.
        """
        if not sentences:
            return ""

        overlap_sentences = []
        total_length = 0

        # Work backwards through sentences
        for sentence in reversed(sentences):
            if total_length + len(sentence) <= self.chunk_overlap:
                overlap_sentences.insert(0, sentence)
                total_length += len(sentence) + 1
            else:
                break

        return " ".join(overlap_sentences)


def chunk_events(
    events: list[HistoricalEvent],
    chunk_size: int = 500,
    chunk_overlap: int = 100,
) -> list[Chunk]:
    """Convenience function to chunk multiple events.

    Args:
        events: List of historical events to chunk
        chunk_size: Target chunk size in characters
        chunk_overlap: Overlap between chunks

    Returns:
        Flat list of all chunks from all events
    """
    chunker = TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    all_chunks = []

    for event in events:
        chunks = chunker.chunk_event(event)
        all_chunks.extend(chunks)

    logger.info(
        "Chunking complete",
        events_processed=len(events),
        total_chunks=len(all_chunks),
    )

    return all_chunks
