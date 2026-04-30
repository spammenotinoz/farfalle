import json
import os

from dotenv import load_dotenv
from fastapi import HTTPException

from backend.schemas import SearchResponse
from backend.search.providers.base import SearchProvider
from backend.search.providers.bing import BingSearchProvider
from backend.search.providers.brave import BraveSearchProvider
from backend.search.providers.searxng import SearxngSearchProvider
from backend.search.providers.serper import SerperSearchProvider
from backend.search.providers.tavily import TavilySearchProvider

load_dotenv()


def get_searxng_base_url():
    searxng_base_url = os.getenv("SEARXNG_BASE_URL")
    if not searxng_base_url:
        raise HTTPException(
            status_code=500,
            detail="SEARXNG_BASE_URL is not set in the environment variables.",
        )
    return searxng_base_url


def get_tavily_api_key():
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        raise HTTPException(
            status_code=500,
            detail="Tavily API key is not set in the environment variables. Please set the TAVILY_API_KEY environment variable or set SEARCH_PROVIDER to 'searxng' or 'serper'.",
        )
    return tavily_api_key


def get_serper_api_key():
    serper_api_key = os.getenv("SERPER_API_KEY")
    if not serper_api_key:
        raise HTTPException(
            status_code=500,
            detail="Serper API key is not set in the environment variables. Please set the SERPER_API_KEY environment variable or set SEARCH_PROVIDER to 'searxng' or 'tavily'.",
        )
    return serper_api_key


def get_bing_api_key():
    bing_api_key = os.getenv("BING_API_KEY")
    if not bing_api_key:
        raise HTTPException(
            status_code=500,
            detail="Bing API key is not set in the environment variables. Please set the BING_API_KEY environment variable or set SEARCH_PROVIDER to 'searxng', 'tavily', or 'serper'.",
        )
    return bing_api_key


def get_brave_api_key():
    brave_api_key = os.getenv("BRAVE_API_KEY")
    if not brave_api_key:
        raise HTTPException(
            status_code=500,
            detail="Brave Search API key is not set. Please set BRAVE_API_KEY or use SEARCH_PROVIDER=searxng.",
        )
    return brave_api_key


def get_search_provider() -> SearchProvider:
    search_provider = os.getenv("SEARCH_PROVIDER", "searxng").lower()

    match search_provider:
        case "searxng":
            searxng_base_url = get_searxng_base_url()
            return SearxngSearchProvider(searxng_base_url)
        case "brave":
            brave_api_key = get_brave_api_key()
            return BraveSearchProvider(brave_api_key)
        case "tavily":
            tavily_api_key = get_tavily_api_key()
            return TavilySearchProvider(tavily_api_key)
        case "serper":
            serper_api_key = get_serper_api_key()
            return SerperSearchProvider(serper_api_key)
        case "bing":
            bing_api_key = get_bing_api_key()
            return BingSearchProvider(bing_api_key)
        case _:
            raise HTTPException(
                status_code=500,
                detail="Invalid search provider. Please set SEARCH_PROVIDER to 'searxng' or 'brave'. Legacy providers 'tavily', 'serper', and 'bing' are still supported.",
            )


async def perform_search(query: str, max_results: int = 8) -> SearchResponse:
    search_provider = get_search_provider()

    try:
        results = await search_provider.search(query, max_results=max_results)
        if not results.results:
            raise HTTPException(
                status_code=502,
                detail=(
                    f"No search results returned from "
                    f"{os.getenv('SEARCH_PROVIDER', 'search provider')}. "
                    f"Check that the API key is valid and the service is accessible."
                ),
            )
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
