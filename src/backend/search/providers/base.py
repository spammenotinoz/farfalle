from abc import ABC, abstractmethod

from backend.schemas import SearchResponse


class SearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 8) -> SearchResponse:
        pass
