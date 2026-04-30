import asyncio

import httpx

from backend.schemas import SearchResponse, SearchResult
from backend.search.providers.base import SearchProvider


class SerperSearchProvider(SearchProvider):
    def __init__(self, api_key: str):
        self.host = "https://google.serper.dev"
        self.headers = {
            "X-API-KEY": api_key,
            "Content-Type": "application/json",
        }

    async def search(self, query: str, max_results: int = 8) -> SearchResponse:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            link_results = await self.get_link_results(client, query)
            image_results = await self.get_image_results(client, query)

        return SearchResponse(results=link_results, images=image_results)

    async def get_link_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 6
    ) -> list[SearchResult]:
        response = await client.get(
            f"{self.host}/search",
            headers=self.headers,
            params={"q": query, "num": num_results},
        )
        results = response.json()

        organic = results.get("organic", [])
        return [
            SearchResult(
                title=result["title"],
                url=result["link"],
                content=result["snippet"],
                image=result.get("image"),
            )
            for result in organic[:num_results]
        ]

    async def get_image_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 4
    ) -> list[str]:
        # Fall back to image search only if we got no thumbnails from the
        # main search results. This is a last resort — images sourced from
        # the article thumbnails above are always preferred.
        images: list[str] = []
        response = await client.get(
            f"{self.host}/search",
            headers=self.headers,
            params={"q": query},
        )
        for result in response.json().get("organic", [])[:num_results]:
            if result.get("image"):
                images.append(result["image"])

        if len(images) < num_results:
            extra = await client.get(
                f"{self.host}/images",
                headers=self.headers,
                params={"q": query},
            )
            for result in extra.json().get("images", [])[:num_results]:
                if result.get("imageUrl"):
                    images.append(result["imageUrl"])

        return images[:num_results]
