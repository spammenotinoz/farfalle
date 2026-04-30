import asyncio
from typing import AsyncIterator, List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.constants import get_model_string
from backend.db.chat import save_turn_to_db
from backend.llm.base import BaseLLM, OpenAILLM
from backend.page_reader import read_pages, format_pages_for_context
from backend.prompts import SYSTEM_PROMPT_STANDARD, HISTORY_QUERY_REPHRASE
from backend.related_queries import generate_related_queries
from backend.schemas import (
    BeginStream,
    ChatRequest,
    ChatResponseEvent,
    FinalResponseStream,
    Message,
    RelatedQueriesStream,
    ResearchDepth,
    SearchResult,
    SearchResultStream,
    StreamEndStream,
    StreamEvent,
    TextChunkStream,
)
from backend.search.search_service import perform_search
from backend.utils import is_local_model


async def rephrase_query_with_history(
    question: str, history: List[Message], llm: BaseLLM
) -> str:
    if not history:
        return question

    try:
        history_str = "\n".join(f"{msg.role}: {msg.content}" for msg in history)
        formatted_query = HISTORY_QUERY_REPHRASE.format(
            chat_history=history_str, question=question
        )
        question = (await llm.complete(formatted_query)).replace('"', "")
        return question
    except Exception:
        raise HTTPException(
            status_code=500, detail="Model is at capacity. Please try again later."
        )


def format_context(search_results: List[SearchResult]) -> str:
    return "\n\n".join(
        [f"Source [{i+1}]. {str(result)}" for i, result in enumerate(search_results)]
    )


def format_context_with_pages(
    search_results: List[SearchResult], pages_context: str
) -> str:
    """Combine search result snippets with full page content."""
    result_context = format_context(search_results)
    if pages_context:
        return f"## Search Result Summaries\n{result_context}\n\n{pages_context}"
    return result_context


DEPTH_CONFIG = {
    ResearchDepth.QUICK: {
        "search_results": 6,
        "pages": 2,
        "page_chars": 3000,
        "instruction": "Produce a concise but well-cited research brief. Prioritize the direct answer and key evidence.",
    },
    ResearchDepth.BALANCED: {
        "search_results": 10,
        "pages": 5,
        "page_chars": 5000,
        "instruction": "Produce a balanced research report with synthesis, source comparison, and explicit uncertainty.",
    },
    ResearchDepth.DEEP: {
        "search_results": 14,
        "pages": 8,
        "page_chars": 7000,
        "instruction": "Produce a deep research report with rigorous synthesis, evidence grading, contradictions, and next-step questions.",
    },
}


def get_depth_config(depth: ResearchDepth | None) -> dict:
    return DEPTH_CONFIG.get(
        depth or ResearchDepth.DEEP, DEPTH_CONFIG[ResearchDepth.DEEP]
    )


async def stream_qa_objects(
    request: ChatRequest, session: Session
) -> AsyncIterator[ChatResponseEvent]:
    try:
        model_name = get_model_string(request.model)
        llm = OpenAILLM(model=model_name)

        yield ChatResponseEvent(
            event=StreamEvent.BEGIN_STREAM,
            data=BeginStream(query=request.query),
        )

        query = await rephrase_query_with_history(request.query, request.history, llm)

        depth_config = get_depth_config(request.research_depth)

        search_response = await perform_search(
            query, max_results=depth_config["search_results"]
        )

        search_results = search_response.results
        images = search_response.images

        yield ChatResponseEvent(
            event=StreamEvent.SEARCH_RESULTS,
            data=SearchResultStream(
                results=search_results,
                images=images,
            ),
        )

        # Fetch full content from top source pages for richer context
        source_urls = [r.url for r in search_results[: depth_config["pages"]]]
        pages = await read_pages(
            source_urls,
            max_pages=depth_config["pages"],
            concurrency=4,
            max_chars=depth_config["page_chars"],
        )
        pages_context = format_pages_for_context(
            pages, max_chars=depth_config["page_chars"]
        )

        # Start related queries generation in parallel (no need to await before streaming)
        related_queries_task = None
        if not is_local_model(request.model):
            related_queries_task = asyncio.create_task(
                generate_related_queries(query, search_results, llm)
            )

        # Build context: snippets + page content
        context = format_context_with_pages(search_results, pages_context)
        fmt_qa_prompt = SYSTEM_PROMPT_STANDARD.format(
            my_context=context,
            my_query=query,
            research_depth=(request.research_depth or ResearchDepth.DEEP).value,
            research_instruction=depth_config["instruction"],
        )

        # Stream tokens one at a time for true streaming UX
        full_response_parts: List[str] = []
        async for token in llm.astream(fmt_qa_prompt):
            full_response_parts.append(token)
            yield ChatResponseEvent(
                event=StreamEvent.TEXT_CHUNK,
                data=TextChunkStream(text=token),
            )

        full_response = "".join(full_response_parts)

        # Gather related queries (from task or fresh)
        related_queries = await (
            related_queries_task
            if related_queries_task
            else generate_related_queries(query, search_results, llm)
        )

        yield ChatResponseEvent(
            event=StreamEvent.RELATED_QUERIES,
            data=RelatedQueriesStream(related_queries=related_queries),
        )

        thread_id = save_turn_to_db(
            session=session,
            thread_id=request.thread_id,
            user_message=request.query,
            assistant_message=full_response,
            model=request.model,
            search_results=search_results,
            image_results=images,
            related_queries=related_queries,
        )

        yield ChatResponseEvent(
            event=StreamEvent.FINAL_RESPONSE,
            data=FinalResponseStream(message=full_response),
        )

        yield ChatResponseEvent(
            event=StreamEvent.STREAM_END,
            data=StreamEndStream(thread_id=thread_id),
        )

    except Exception as e:
        detail = str(e)
        raise HTTPException(status_code=500, detail=detail)
