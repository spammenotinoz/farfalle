# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Farfalle is an open-source AI-powered search engine (Perplexity clone) combining web search with LLM-powered question answering. It has two main parts:

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: FastAPI (Python 3.11+) + PostgreSQL + SQLAlchemy

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
| `pnpm generate` | frontend | Regenerate TypeScript API types from running backend |
| `poetry run uvicorn backend.main:app --reload` | backend | Run FastAPI dev server |
| `poetry run pre-commit run --all-files` | backend | Lint/format Python |

## Architecture

### Chat Flow
1. User submits query → Frontend POSTs to `/chat`
2. Backend validates and performs search (SearXNG, Tavily, Serper, or Bing)
3. LLM generates answer based on search results
4. Response streams via SSE back to frontend
5. Chat history saved to PostgreSQL (if `DB_ENABLED=True`)

### Research Mode
- `/chat` always uses the agentic deep research flow: multi-step planning → multiple searches → ranked results → synthesized answer.

### Key Directories

```
src/backend/
  ├── main.py              # FastAPI entry point
  ├── chat.py              # Legacy single-pass chat streaming helpers
  ├── agent_search.py      # Deep research mode (multi-step agent)
  ├── schemas.py           # Pydantic request/response models
  ├── prompts.py           # LLM prompt templates
  ├── llm/base.py          # LLM abstraction (OpenAI-compatible)
  ├── search/providers/    # Pluggable search provider implementations
  └── db/                  # SQLAlchemy ORM models and operations

src/frontend/src/
  ├── app/                 # Next.js App Router pages
  ├── components/          # React UI components
  │   └── ui/             # shadcn/ui components
  ├── hooks/              # SSE streaming hook, history, threads
  ├── stores/              # Zustand state (config + messages slices)
  └── services/           # API client services

src/frontend/generated/   # Auto-generated TypeScript types from OpenAPI schema — do not edit manually
```

## Environment Variables

**Backend (`.env`):**
```
SEARCH_PROVIDER=searxng|brave|tavily
BRAVE_API_KEY=              # or BRAVE_API_KEYS=key1,key2
TAVILY_API_KEY=             # or TAVILY_API_KEYS=key1,key2
OPENAI_API_KEY=
OPENAI_API_BASE=
GROQ_API_KEY=
DATABASE_URL=postgresql+psycopg2://...
DB_ENABLED=True|False
OPENAI_MODE=openai|groq|azure|custom
ENABLE_LOCAL_MODELS=False
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

Also reflected in auto-generated TypeScript types (`src/frontend/generated/types.gen.ts`, `schemas.gen.ts`) and the LLM default model in `src/backend/llm/base.py`.

> **Note:** When updating model values in `constants.py`, remember to also update the corresponding enum in `src/frontend/generated/types.gen.ts` and the enum values in `src/frontend/generated/schemas.gen.ts`, plus the default model string in `src/backend/llm/base.py`. Also update `ChatModel.POWERFUL` → `ChatModel.THINKING` references in `src/frontend/src/lib/utils.ts` and `src/frontend/src/components/model-selection.tsx` (both the key and the `name` display label). Then run `pnpm generate` to regenerate fully.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | SSE stream for chat completions |
| GET | `/history` | List all chat threads |
| GET | `/thread/{thread_id}` | Get specific thread messages |

## Deployment

- Frontend → Vercel (from `src/frontend`)
- Backend → Render (Poetry-based)
- Full stack → Single Docker container via `standalone.Dockerfile`

## Notes

- `src/frontend/generated/` is auto-generated from the running backend's OpenAPI schema via `@hey-api/openapi-ts`. Run `pnpm generate` after starting the backend to regenerate.
- Database is optional — set `DB_ENABLED=False` to disable PostgreSQL (chat history won't persist).
- Pre-commit hooks (`.pre-commit-config.yaml`): isort, ruff, ruff-format, prettier, check-yaml.
