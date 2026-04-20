from backend.llm.base import BaseLLM
from backend.prompts import RELATED_QUESTION_PROMPT
from backend.schemas import RelatedQueries, SearchResult


async def generate_related_queries(
    query: str, search_results: list[SearchResult], llm: BaseLLM
) -> list[str]:
    context = "\n\n".join([f"{str(result)}" for result in search_results])
    context = context[:4000]
    # Use template safe approach that avoids .format() with curly braces in the template
    # Replace placeholders manually since prompts contain JSON schemas with curly braces
    prompt = RELATED_QUESTION_PROMPT.replace("{query}", query).replace("{context}", context)
    related = await llm.structured_complete(
        RelatedQueries, prompt
    )

    questions = getattr(related, 'related_questions', None)
    if questions is None:
        return []
    return [q.lower().replace("?", "") for q in questions]
