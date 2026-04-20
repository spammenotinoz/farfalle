import asyncio

import httpx

from backend.schemas import SearchResponse, SearchResult
from backend.search.providers.base import SearchProvider


class TavilySearchProvider(SearchProvider):
    def __init__(self, api_key: str):
        self.host = "https://api.tavily.com/search"
        self.headers = {
            "X-API-KEY": api_key,
            "Content-Type": "application/json",
        }

    async def search(self, query: str) -> SearchResponse:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            link_results = await self.get_link_results(client, query)
            image_results = await self.get_image_results(client, query)

        return SearchResponse(results=link_results, images=image_results)

    async def get_link_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 6
    ) -> list[SearchResult]:
        response = await client.post(
            self.host,
            headers=self.headers,
            json={"query": query, "search_depth": "basic", "max_results": num_results},
        )
        results = response.json()

        return [
            SearchResult(
                title=result["title"],
                url=result["url"],
                content=result["content"],
            )
            for result in results.get("results", [])[:num_results]
        ]

    async def get_image_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 4
    ) -> list[str]:
        # Re-use the main query to get images that are contextually related to
        # the actual search results, avoiding generic image search drift
        response = await client.post(
            self.host,
            headers=self.headers,
            json={"query": query, "search_depth": "basic", "max_results": num_results},
        )
        results = response.json()

        # Collect image URLs from result thumbnails/media fields
        images: list[str] = []
        for result in results.get("results", [])[:num_results]:
            if "image" in result and result["image"]:
                images.append(result["image"])
        return images[:num_results]
