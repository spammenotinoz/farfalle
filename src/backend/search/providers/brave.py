import asyncio

import httpx

from backend.schemas import SearchResponse, SearchResult
from backend.search.providers.base import SearchProvider


class BraveSearchProvider(SearchProvider):
    def __init__(self, api_key: str):
        self.host = "https://api.search.brave.com/res/v1"
        self.headers = {
            "Accept": "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": api_key,
        }

    async def search(self, query: str, max_results: int = 8) -> SearchResponse:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            link_results, image_results = await asyncio.gather(
                self.get_link_results(client, query, num_results=max_results),
                self.get_image_results(client, query),
            )

        return SearchResponse(results=link_results, images=image_results)

    async def get_link_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 8
    ) -> list[SearchResult]:
        response = await client.get(
            f"{self.host}/web/search",
            headers=self.headers,
            params={
                "q": query,
                "count": min(num_results, 20),
                "text_decorations": False,
                "result_filter": "web",
                "summary": True,
            },
        )
        if response.status_code == 401:
            raise PermissionError("Brave Search API key is invalid.")
        if response.status_code == 429:
            raise RuntimeError("Brave Search rate limit hit. Try again later.")
        if response.status_code >= 400:
            raise RuntimeError(
                f"Brave Search error {response.status_code}: {response.text[:300]}"
            )

        data = response.json()
        raw_results = data.get("web", {}).get("results", [])
        return [
            SearchResult(
                title=result.get("title") or "Untitled",
                url=result.get("url") or "",
                content=(
                    result.get("description")
                    or result.get("extra_snippets", [""])[0]
                    or ""
                ),
                image=self._thumbnail_url(result),
            )
            for result in raw_results[:num_results]
            if result.get("url")
        ]

    async def get_image_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 4
    ) -> list[str]:
        response = await client.get(
            f"{self.host}/images/search",
            headers=self.headers,
            params={"q": query, "count": num_results},
        )
        if response.status_code >= 400:
            return []

        data = response.json()
        images = []
        for result in data.get("results", [])[:num_results]:
            image_url = (
                result.get("properties", {}).get("url")
                or result.get("thumbnail", {}).get("src")
                or result.get("url")
            )
            if image_url:
                images.append(image_url)
        return images

    def _thumbnail_url(self, result: dict) -> str | None:
        thumbnail = result.get("thumbnail")
        if isinstance(thumbnail, dict):
            return thumbnail.get("src") or thumbnail.get("url")
        return None
