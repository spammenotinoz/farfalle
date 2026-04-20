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
            link_results, image_results = await asyncio.gather(
                self.get_link_results(client, query),
                self.get_image_results(client, query),
            )

        return SearchResponse(results=link_results, images=image_results)

    async def get_link_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 6
    ) -> list[SearchResult]:
        print(f"[Tavily] Searching: {query!r}")
        response = await client.post(
            self.host,
            headers=self.headers,
            json={"query": query, "search_depth": "basic", "max_results": num_results},
        )

        print(f"[Tavily] Status: {response.status_code}")
        print(f"[Tavily] Body: {response.text[:500]}")

        if response.status_code == 401:
            raise PermissionError("Tavily API key is invalid. Check TAVILY_API_KEY.")
        if response.status_code == 403:
            raise PermissionError("Tavily API access forbidden. Is your plan active?")
        if response.status_code >= 400:
            raise RuntimeError(f"Tavily API error {response.status_code}: {response.text}")

        results = response.json()

        if "results" not in results and "detail" in results:
            raise RuntimeError(f"Tavily error: {results['detail']}")

        count = len(results.get("results", []))
        print(f"[Tavily] Got {count} results")
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
        response = await client.post(
            self.host,
            headers=self.headers,
            json={
                "query": query,
                "search_depth": "basic",
                "max_results": num_results,
                "include_images": True,
            },
        )

        if response.status_code >= 400:
            # Don't let image failures break the whole search
            return []

        results = response.json()
        return [img["url"] for img in results.get("images", [])[:num_results]]
