import asyncio

import httpx

from backend.schemas import SearchResponse, SearchResult
from backend.search.providers.base import SearchProvider


class TavilySearchProvider(SearchProvider):
    def __init__(self, api_key: str):
        self.host = "https://api.tavily.com"
        self.api_key = api_key

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
        response = await client.post(
            f"{self.host}/search",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "query": query,
                "search_depth": "basic",
                "max_results": num_results,
            },
        )

        if response.status_code == 401:
            raise PermissionError(
                "Tavily API key is invalid. "
                "Ensure TAVILY_API_KEY starts with 'tvly-' and your account is active."
            )
        if response.status_code == 403:
            raise PermissionError(
                "Tavily API access forbidden. "
                "Your plan may be inactive or the key is wrong."
            )
        if response.status_code == 429:
            raise RuntimeError(
                "Tavily rate limit hit. "
                "Wait a moment or upgrade your plan at tavily.com"
            )
        if response.status_code >= 400:
            body = response.text[:200]
            raise RuntimeError(f"Tavily error {response.status_code}: {body}")

        data = response.json()

        # Tavily always returns results on 200; empty array = bad auth or no matches
        raw = data.get("results", [])
        if not raw:
            raise RuntimeError(
                f"Tavily returned 0 results for '{query}'. "
                "Check your API key is active at app.tavily.com"
            )

        return [
            SearchResult(
                title=result["title"],
                url=result["url"],
                content=result["content"],
                image=self._first_image(result),
            )
            for result in raw[:num_results]
        ]

    async def get_image_results(
        self, client: httpx.AsyncClient, query: str, num_results: int = 4
    ) -> list[str]:
        response = await client.post(
            f"{self.host}/search",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "query": query,
                "search_depth": "basic",
                "max_results": num_results,
                "include_images": True,
            },
        )

        if response.status_code >= 400:
            return []  # Don't break the whole search over images

        data = response.json()
        images = []
        for result in data.get("results", [])[:num_results]:
            images.extend(self._extract_images(result))

        if len(images) < num_results:
            for img in data.get("images", []):
                url = img.get("url") if isinstance(img, dict) else img
                if url and url not in images:
                    images.append(url)

        return images[:num_results]

    def _first_image(self, result: dict) -> str | None:
        """Extract the first image URL from a result, if available."""
        imgs = result.get("images", [])
        if isinstance(imgs, list) and imgs:
            first = imgs[0]
            return first.get("url") if isinstance(first, dict) else first
        return None

    def _extract_images(self, result: dict) -> list[str]:
        """Pull all images from a result's images array."""
        images = []
        for img in result.get("images", []):
            if isinstance(img, dict):
                if url := img.get("url"):
                    images.append(url)
            elif isinstance(img, str) and img:
                images.append(img)
        return images
