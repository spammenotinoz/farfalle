import asyncio

import httpx

from backend.schemas import SearchResponse, SearchResult
from backend.search.providers.base import SearchProvider


class SearxngSearchProvider(SearchProvider):
    def __init__(self, host: str):
        self.host = host

    async def search(self, query: str, max_results: int = 8) -> SearchResponse:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            link_results, image_results = await asyncio.gather(
                self.get_link_results(client, query, num_results=max_results),
                self.get_image_results(client, query),
            )

        return SearchResponse(results=link_results, images=image_results)

    async def get_link_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 6
    ) -> list[SearchResult]:
        response = await client.get(
            f"{self.host}/search",
            params={"q": query, "format": "json", "language": "auto"},
        )

        if response.status_code >= 400:
            raise RuntimeError(f"SearXNG error {response.status_code}: {response.text}")

        results = response.json()
        return [
            SearchResult(
                title=result.get("title", "Untitled"),
                url=result.get("url", ""),
                content=result.get("content", ""),
                image=result.get("img_src") or result.get("thumbnail"),
            )
            for result in results.get("results", [])[:num_results]
            if result.get("url")
        ]

    async def get_image_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 4
    ) -> list[str]:
        response = await client.get(
            f"{self.host}/search",
            params={"q": query, "format": "json", "categories": "images"},
        )
        if response.status_code >= 400:
            return []
        results = response.json()
        return [
            result["img_src"]
            for result in results.get("results", [])[:num_results]
            if result.get("img_src")
        ]
