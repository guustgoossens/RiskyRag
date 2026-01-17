"""Embedding processor for historical content.

This module provides embedding generation using Voyage AI or OpenAI.
"""

import asyncio
import os
from typing import Literal

import httpx
import structlog

logger = structlog.get_logger()


class EmbeddingProcessor:
    """Processor for generating embeddings from text.

    Supports multiple embedding providers:
    - Voyage AI (preferred, 1024 dimensions)
    - OpenAI (fallback, configurable dimensions)
    """

    def __init__(
        self,
        provider: Literal["voyage", "openai"] = "voyage",
        model: str | None = None,
        dimensions: int = 1024,
    ) -> None:
        """Initialize the embedding processor.

        Args:
            provider: The embedding provider to use
            model: The model to use (defaults to provider default)
            dimensions: Output dimensions (for providers that support it)
        """
        self.provider = provider
        self.dimensions = dimensions

        if provider == "voyage":
            self.model = model or "voyage-2"
            self.api_key = os.environ.get("VOYAGE_API_KEY")
            self.api_url = "https://api.voyageai.com/v1/embeddings"
        elif provider == "openai":
            self.model = model or "text-embedding-3-small"
            self.api_key = os.environ.get("OPENAI_API_KEY")
            self.api_url = "https://api.openai.com/v1/embeddings"
        else:
            raise ValueError(f"Unknown provider: {provider}")

        if not self.api_key:
            raise ValueError(f"API key not found for {provider}")

        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "EmbeddingProcessor":
        """Enter async context."""
        self._client = httpx.AsyncClient(timeout=30.0)
        return self

    async def __aexit__(self, *args: object) -> None:
        """Exit async context."""
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get the HTTP client."""
        if self._client is None:
            # Create a client if not in async context
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client

    async def embed(self, text: str) -> list[float]:
        """Generate an embedding for the given text.

        Args:
            text: The text to embed

        Returns:
            A list of floats representing the embedding
        """
        if self.provider == "voyage":
            return await self._embed_voyage(text)
        elif self.provider == "openai":
            return await self._embed_openai(text)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed

        Returns:
            List of embeddings
        """
        # For now, process sequentially to avoid rate limits
        # Could be optimized with batching if needed
        embeddings = []
        for text in texts:
            embedding = await self.embed(text)
            embeddings.append(embedding)
            # Small delay to avoid rate limits
            await asyncio.sleep(0.1)
        return embeddings

    async def _embed_voyage(self, text: str) -> list[float]:
        """Generate embedding using Voyage AI."""
        response = await self.client.post(
            self.api_url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            json={
                "model": self.model,
                "input": text,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["data"][0]["embedding"]

    async def _embed_openai(self, text: str) -> list[float]:
        """Generate embedding using OpenAI."""
        response = await self.client.post(
            self.api_url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            json={
                "model": self.model,
                "input": text,
                "dimensions": self.dimensions,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["data"][0]["embedding"]
