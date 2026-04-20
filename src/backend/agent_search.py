# This code was messy but has been refined for multi-step agentic research
import asyncio
from typing import AsyncIterator

from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.chat import rephrase_query_with_history
from backend.constants import get_model_string
from backend.db.chat import save_turn_to_db
from backend.llm.base import BaseLLM, OpenAILLM
from backend.page_reader import read_pages, format_pages_for_context
from backend.prompts import (
    SYSTEM_PROMPT_PRO,
    QUERY_PLAN_PROMPT,
    SEARCH_QUERY_PROMPT,
)
from backend.related_queries import generate_related_queries
from backend.schemas import (
    AgentFinishStream,
    AgentQueryPlanStream,
    AgentReadResultsStream,
    AgentSearchFullResponse,
    AgentSearchQueriesStream,
    AgentSearchStep,
    AgentSearchStepStatus,
    BeginStream,
    ChatRequest,
    ChatResponseEvent,
    FinalResponseStream,
    RelatedQueriesStream,
    SearchResponse,
    SearchResult,
    SearchResultStream,
    StreamEndStream,
    StreamEvent,
    TextChunkStream,
)
from backend.search.search_service import perform_search
from backend.utils import PRO_MODE_ENABLED, is_local_model


class QueryPlanStep(BaseModel):
    id: int = Field(..., description="Unique id of the step")
    step: str
    dependencies: list[int] = Field(
        ...,
        description="List of step ids that this step depends on information from",
        default_factory=list,
    )


class QueryPlan(BaseModel):
    steps: list[QueryPlanStep] = Field(
        ..., description="The steps to complete the query", max_length=5
    )


class QueryStepExecution(BaseModel):
    search_queries: list[str] | None = Field(
        ...,
        description="The search queries to complete the step",
        min_length=1,
        max_length=3,
    )


class StepContext(BaseModel):
    step: str
    context: str


def format_step_context(step_contexts: list[StepContext]) -> str:
    return "\n".join(
        [f"Step: {step.step}\nContext: {step.context}" for step in step_contexts]
    )


def _reciprocal_rank_fusion(
    result_lists: list[list[SearchResult]], k: int = 60
) -> list[SearchResult]:
    """Reciprocal Rank Fusion for combining ranked result lists.

    RRF scores each result as: score = sum(1 / (k + rank)) across all lists.
    This is superior to naive zip-interleaving because it rewards results
    that appear consistently at the top across multiple queries.
    """
    scores: dict[str, tuple[float, SearchResult]] = {}

    for results in result_lists:
        for rank, result in enumerate(results):
            if result.url in scores:
                scores[result.url] = (scores[result.url][0] + 1 / (k + rank + 1), result)
            else:
                scores[result.url] = (1 / (k + rank + 1), result)

    # Sort by RRF score descending
    sorted_results = sorted(scores.values(), key=lambda x: x[0], reverse=True)
    return [result for _, result in sorted_results]


async def ranked_search_results_and_images_from_queries(
    queries: list[str],
) -> tuple[list[SearchResult], list[str]]:
    """Execute multiple search queries and fuse results using RRF."""
    search_responses: list[SearchResponse] = await asyncio.gather(
        *(perform_search(query) for query in queries)
    )

    result_lists = [response.results for response in search_responses]
    fused_results = _reciprocal_rank_fusion(result_lists)

    # Collect unique images across all responses
    seen_images: set[str] = set()
    all_images: list[str] = []
    for response in search_responses:
        for img in response.images:
            if img not in seen_images:
                seen_images.add(img)
                all_images.append(img)

    return fused_results, all_images


def build_context_from_search_results(search_results: list[SearchResult]) -> str:
    """Build a rich context string from search results, preserving all content."""
    context = "\n".join(str(result) for result in search_results)
    # Use generous limits — the LLM needs the full picture
    return context[:12000]


def format_context_with_steps(
    search_results_map: dict[int, list[SearchResult]],
    step_contexts: dict[int, StepContext],
) -> str:
    """Combine context from all completed steps for the final synthesis."""
    parts = []
    for step_id in sorted(step_contexts.keys()):
        step = step_contexts[step_id]
        results = search_results_map.get(step_id, [])
        results_str = "\n".join(str(r) for r in results)
        parts.append(
            f"## Research Step: {step.step}\n{results_str}"
        )
    return "\n\n".join(parts)[:15000]


def format_context_with_pages(
    search_results: list[SearchResult],
    pages_context: str,
) -> str:
    """Combine search result snippets with full page content for synthesis."""
    result_context = "\n\n".join(
        f"Citation {i+1}. {str(result)}" for i, result in enumerate(search_results)
    )
    if pages_context:
        return (
            f"## Search Result Summaries\n{result_context}\n\n"
            f"## Full Page Content (fetched from top sources)\n{pages_context}"
        )
    return result_context


async def stream_pro_search_objects(
    request: ChatRequest, llm: BaseLLM, query: str, session: Session
) -> AsyncIterator[ChatResponseEvent]:
    # ── Step 1: Plan ──────────────────────────────────────────────────────
    query_plan_prompt = QUERY_PLAN_PROMPT.format(query=query)
    query_plan = await llm.structured_complete(
        response_model=QueryPlan, prompt=query_plan_prompt
    )
    if query_plan is None or not query_plan.steps:
        raise HTTPException(
            status_code=500,
            detail="There was an error generating the query plan",
        )

    yield ChatResponseEvent(
        event=StreamEvent.AGENT_QUERY_PLAN,
        data=AgentQueryPlanStream(steps=[step.step for step in query_plan.steps]),
    )

    # ── Step 2: Execute non-final steps ─────────────────────────────────
    step_context: dict[int, StepContext] = {}
    search_result_map: dict[int, list[SearchResult]] = {}
    image_map: dict[int, list[str]] = {}
    agent_search_steps: list[AgentSearchStep] = []

    for idx, step in enumerate(query_plan.steps):
        step_id = step.id
        is_last_step = idx == len(query_plan.steps) - 1
        dependencies = step.dependencies

        relevant_context = [step_context[sid] for sid in dependencies]

        if not is_last_step:
            # Generate search queries for this step
            search_prompt = SEARCH_QUERY_PROMPT.format(
                user_query=query,
                current_step=step.step,
                prev_steps_context=format_step_context(relevant_context),
            )
            query_step_execution = await llm.structured_complete(
                response_model=QueryStepExecution, prompt=search_prompt
            )
            if query_step_execution is None or not query_step_execution.search_queries:
                raise HTTPException(
                    status_code=500,
                    detail="There was an error generating the search queries",
                )
            search_queries = query_step_execution.search_queries

            yield ChatResponseEvent(
                event=StreamEvent.AGENT_SEARCH_QUERIES,
                data=AgentSearchQueriesStream(
                    queries=search_queries, step_number=step_id
                ),
            )

            # Execute searches and fuse with RRF
            search_results, image_results = await ranked_search_results_and_images_from_queries(
                search_queries
            )
            search_result_map[step_id] = search_results
            image_map[step_id] = image_results

            yield ChatResponseEvent(
                event=StreamEvent.AGENT_READ_RESULTS,
                data=AgentReadResultsStream(
                    results=search_results, step_number=step_id
                ),
            )

            context = build_context_from_search_results(search_results)
            step_context[step_id] = StepContext(step=step.step, context=context)

            agent_search_steps.append(
                AgentSearchStep(
                    step_number=step_id,
                    step=step.step,
                    queries=search_queries,
                    results=search_results,
                    status=AgentSearchStepStatus.DONE,
                )
            )
        else:
            # ── Step 3: Final synthesis ────────────────────────────────────
            yield ChatResponseEvent(
                event=StreamEvent.AGENT_FINISH,
                data=AgentFinishStream(),
            )

            yield ChatResponseEvent(
                event=StreamEvent.BEGIN_STREAM,
                data=BeginStream(query=query),
            )

            # Collect up to 12 results from dependency steps, deduplicated
            relevant_result_map: dict[int, list[SearchResult]] = {
                sid: search_result_map[sid] for sid in dependencies
            }
            DESIRED_RESULT_COUNT = 12
            total_results = sum(len(r) for r in relevant_result_map.values())
            if total_results > 0:
                results_per_dep = max(
                    1, min(
                        DESIRED_RESULT_COUNT // max(1, len(dependencies)),
                        total_results // max(1, len(dependencies)),
                    )
                )
                for sid in dependencies:
                    relevant_result_map[sid] = search_result_map[sid][:results_per_dep]

            search_results = [
                result for results in relevant_result_map.values() for result in results
            ]
            # Final deduplication
            search_results = list({r.url: r for r in search_results}.values())
            images = list({img for sid in dependencies for img in (image_map.get(sid) or [])[:2]})

            # Start related queries in parallel
            related_queries_task = None
            if not is_local_model(request.model):
                related_queries_task = asyncio.create_task(
                    generate_related_queries(query, search_results, llm)
                )

            yield ChatResponseEvent(
                event=StreamEvent.SEARCH_RESULTS,
                data=SearchResultStream(
                    results=search_results,
                    images=images,
                ),
            )

            # Fetch full content from top source pages for richer context
            source_urls = [r.url for r in search_results[:4]]
            pages = await read_pages(source_urls, max_pages=4, concurrency=3)
            pages_context = format_pages_for_context(pages)

            # Augment context with page content
            context_with_pages = format_context_with_pages(search_results, pages_context)

            fmt_qa_prompt = SYSTEM_PROMPT_PRO.format(
                my_context=context_with_pages,
                my_query=query,
            )

            # Stream tokens one at a time
            full_response_parts: list[str] = []
            async for token in llm.astream(fmt_qa_prompt):
                full_response_parts.append(token)
                yield ChatResponseEvent(
                    event=StreamEvent.TEXT_CHUNK,
                    data=TextChunkStream(text=token),
                )

            full_response = "".join(full_response_parts)

            related_queries = await (
                related_queries_task
                if related_queries_task
                else generate_related_queries(query, search_results, llm)
            )

            yield ChatResponseEvent(
                event=StreamEvent.RELATED_QUERIES,
                data=RelatedQueriesStream(related_queries=related_queries),
            )

            yield ChatResponseEvent(
                event=StreamEvent.FINAL_RESPONSE,
                data=FinalResponseStream(message=full_response),
            )

            agent_search_steps.append(
                AgentSearchStep(
                    step_number=step_id,
                    step=step.step,
                    queries=[],
                    results=[],
                    status=AgentSearchStepStatus.DONE,
                )
            )

            thread_id = save_turn_to_db(
                session=session,
                thread_id=request.thread_id,
                user_message=request.query,
                assistant_message=full_response,
                agent_search_full_response=AgentSearchFullResponse(
                    steps=[step.step for step in agent_search_steps],
                    steps_details=agent_search_steps,
                ),
                model=request.model,
                search_results=search_results,
                image_results=images,
                related_queries=related_queries,
            )

            yield ChatResponseEvent(
                event=StreamEvent.STREAM_END,
                data=StreamEndStream(thread_id=thread_id),
            )
            return


async def stream_pro_search_qa(
    request: ChatRequest, session: Session
) -> AsyncIterator[ChatResponseEvent]:
    try:
        if not PRO_MODE_ENABLED:
            raise HTTPException(
                status_code=400,
                detail="Pro mode is not enabled",
            )

        model_name = get_model_string(request.model)
        llm = OpenAILLM(model=model_name)

        query = await rephrase_query_with_history(request.query, request.history, llm)
        async for event in stream_pro_search_objects(request, llm, query, session):
            yield event
            await asyncio.sleep(0)

    except Exception as e:
        detail = str(e)
        raise HTTPException(status_code=500, detail=detail)
