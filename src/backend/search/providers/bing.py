import asyncio

import httpx

from backend.schemas import SearchResponse, SearchResult
from backend.search.providers.base import SearchProvider


class BingSearchProvider(SearchProvider):
    def __init__(self, api_key: str):
        self.host = "https://api.bing.microsoft.com/v7.0"
        self.headers = {
            "Ocp-Apim-Subscription-Key": api_key,
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
        response = await client.get(
            f"{self.host}/search",
            headers=self.headers,
            params={"q": query, "count": num_results},
        )
        results = response.json()
        pages = results.get("webPages", {}).get("value", [])

        return [
            SearchResult(
                title=result["name"],
                url=result["url"],
                content=result["snippet"],
                image=result.get("imageInsightsMediaHoverUrl") or result.get("thumbnailUrl"),
            )
            for result in pages[:num_results]
        ]

    async def get_image_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 4
    ) -> list[str]:
        # Prefer images from the article thumbnails in the main search results
        images: list[str] = []
        response = await client.get(
            f"{self.host}/search",
            headers=self.headers,
            params={"q": query, "count": num_results, "responseFilter": "webPages"},
        )
        for result in response.json().get("webPages", {}).get("value", [])[:num_results]:
            url = result.get("imageInsightsMediaHoverUrl") or result.get("thumbnailUrl")
            if url:
                images.append(url)

        # Only hit the image endpoint if thumbnails weren't enough
        if len(images) < num_results:
            extra = await client.get(
                f"{self.host}/images/search",
                headers=self.headers,
                params={"q": query, "count": num_results},
            )
            for item in extra.json().get("value", [])[:num_results]:
                if item.get("contentUrl"):
                    images.append(item["contentUrl"])

        return images[:num_results]
