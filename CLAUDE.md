# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Farfalle is an AI-powered search engine (Perplexity clone) combining web search with LLM-powered question answering. The `/chat` endpoint runs a multi-step agentic research flow (query planning → parallel searches → synthesis).

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Zustand
- **Backend**: FastAPI (Python 3.11+) + PostgreSQL (optional) + SQLAlchemy

## Quick Start

### Docker (Recommended)
```bash
cp .env-template .env
# Edit .env with your API keys
docker-compose -f docker-compose.dev.yaml up -d
# Visit http://localhost:3000
```

### Manual Development

**Backend:**
```bash
cd src/backend
poetry install
poetry run uvicorn backend.main:app --reload
```

**Frontend:**
```bash
cd src/frontend
pnpm install
pnpm dev
```

### Key Commands

| Command | Location | Description |
|---------|----------|-------------|
| `pnpm dev` | frontend | Next.js dev server (port 3000) |
| `pnpm build` | frontend | Production build |
| `pnpm lint` | frontend | ESLint |
| `pnpm generate` | frontend | Regenerate TypeScript types from running backend (requires backend on :8000) |
| `poetry run uvicorn backend.main:app --reload` | backend | Run FastAPI dev server |
| `poetry run pre-commit run --all-files` | backend | Lint/format Python |

## Architecture

### Request Flow (`/chat`)
1. User query → `main.py` POST `/chat` → always calls `stream_pro_search_qa`
2. `agent_search.py` → rephrase query with history
3. LLM generates a query plan (up to 5 steps based on depth)
4. Each non-final step: generate 2–4 search queries → execute in parallel → fuse results with Reciprocal Rank Fusion (RRF)
5. Final step: collect top results from all steps → fetch full page content → stream LLM synthesis with related queries

### Research Depth
`ChatRequest.research_depth` (`QUICK` / `BALANCED` / `DEEP`) controls:
- Max plan steps (3 / 4 / 5)
- Queries per step (2 / 3 / 4)
- Search results and page chars — configured in `chat.py` via `get_depth_config()`

### Key Directories

```
src/backend/
  ├── main.py              # FastAPI entry point; /chat always routes to agentic flow
  ├── chat.py              # Depth configs, query rephrasing with history
  ├── agent_search.py      # Multi-step research: planning, RRF fusion, page reading, synthesis
  ├── schemas.py           # Pydantic request/response models + SSE event types
  ├── prompts.py           # LLM prompt templates (plan, search queries, synthesis)
  ├── llm/base.py          # BaseLLM abstract class + OpenAILLM implementation
  ├── page_reader.py       # Fetches and extracts text from source URLs
  ├── related_queries.py   # Generates follow-up query suggestions
  ├── search/
  │   ├── search_service.py  # Provider factory; get_search_provider() returns a SearchProvider
  │   └── providers/         # Pluggable implementations: brave, searxng (default), tavily, serper, bing
  └── db/                  # SQLAlchemy ORM models + session management

src/frontend/src/
  ├── app/                 # Next.js App Router pages
  ├── components/          # UI components
  │   └── ui/             # shadcn/ui components
  ├── hooks/              # SSE streaming hook, history, threads
  ├── stores/              # Zustand state (config + messages slices)
  └── services/           # API client services

src/frontend/generated/   # Auto-generated from backend OpenAPI schema — do not edit manually
```

## Environment Variables

**Backend (`.env`):**
```
SEARCH_PROVIDER=searxng|brave    # searxng is default; brave supports comma-separated key rotation
SEARXNG_BASE_URL=http://searxng:8080
BRAVE_API_KEY=,BRAVE_API_KEYS=   # comma-separated for key rotation

# Legacy providers (still supported):
TAVILY_API_KEY=,TAVILY_API_KEYS=
SERPER_API_KEY=
BING_API_KEY=

OPENAI_API_KEY=
OPENAI_API_BASE=                 # defaults to https://api.openai.com/v1
GROQ_API_KEY=
AZURE_DEPLOYMENT_NAME=,AZURE_API_KEY=,AZURE_API_BASE=,AZURE_API_VERSION=
CUSTOM_MODEL=                   # format: provider/model (for LiteLLM)
OPENAI_MODE=openai|groq|azure|custom
ENABLE_LOCAL_MODELS=False

DATABASE_URL=postgresql+psycopg2://...
DB_ENABLED=True|False
RATE_LIMIT_ENABLED=False
REDIS_URL=
```

**Frontend (`.env`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Available Chat Models

Defined in `src/backend/constants.py` as a `ChatModel` enum:
- `FAST = "fast-latest"`
- `THINKING = "thinking-latest"`
- `TECHNICAL = "technical-latest"`

When updating model values in `constants.py`, also update the corresponding enum in:
- `src/frontend/generated/types.gen.ts`
- `src/frontend/generated/schemas.gen.ts`
- `src/backend/llm/base.py` (default model string)

Then update `ChatModel.POWERFUL` → `ChatModel.THINKING` references in `src/frontend/src/lib/utils.ts` and `src/frontend/src/components/model-selection.tsx` (key and `name` display label), and run `pnpm generate`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | SSE stream; always runs agentic research flow |
| GET | `/history` | List all chat threads (requires `DB_ENABLED=True`) |
| GET | `/thread/{thread_id}` | Get specific thread messages |

## Deployment

- Frontend → Vercel (from `src/frontend`)
- Backend → Render (Poetry-based)
- Full stack → Single Docker container via `standalone.Dockerfile`

## Notes

- `src/frontend/generated/` is auto-generated from the running backend's OpenAPI schema via `@hey-api/openapi-ts`. Run `pnpm generate` after starting the backend to regenerate.
- Database is optional — set `DB_ENABLED=False` to disable PostgreSQL (chat history won't persist).
- Pre-commit hooks (`.pre-commit-config.yaml`): isort, ruff, ruff-format, prettier, check-yaml.
