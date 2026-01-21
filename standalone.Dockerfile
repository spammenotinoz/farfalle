# Based on: https://github.com/cohere-ai/cohere-toolkit/blob/main/standalone.Dockerfile

FROM python:3.11-slim-bookworm as builder
LABEL authors="rashadphz"

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8
ENV PYTHONPATH=/workspace/src/
ENV VIRTUAL_ENV=/workspace/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /workspace

# Copy dependency files first for better caching
COPY pyproject.toml poetry.lock ./
COPY README.md ./

# Install dependencies (no dev dependencies, no-cache)
RUN poetry config virtualenvs.in-project true && \
    poetry install --no-interaction --no-ansi --no-root --only main

# Copy backend source
COPY src/backend src/backend


FROM node:20-alpine as frontend

WORKDIR /app

# Copy dependency files
COPY src/frontend/package.json src/frontend/pnpm-lock.yaml ./

# Install dependencies and build
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile && \
    pnpm build

# Final stage
FROM python:3.11-slim-bookworm
LABEL authors="rashadphz"

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8
ENV PYTHONPATH=/workspace/src/
ENV VIRTUAL_ENV=/workspace/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /workspace

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python virtualenv from builder
COPY --from=builder /workspace/.venv /workspace/.venv

# Copy backend
COPY --from=builder /workspace/src/backend /workspace/src/backend

# Copy frontend build from frontend stage
COPY --from=frontend /app/public /workspace/src/frontend/public
COPY --from=frontend /app/.next /workspace/src/frontend/.next
COPY --from=frontend /app/next.config.mjs /workspace/src/frontend/next.config.mjs

# Install Next.js for standalone output
COPY --from=frontend /app/node_modules /workspace/src/frontend/node_modules
COPY --from=frontend /app/package.json /workspace/src/frontend/package.json

COPY docker-scripts/entrypoint.sh /workspace/sbin/entrypoint.sh
RUN chmod +x /workspace/sbin/entrypoint.sh

EXPOSE 8000
EXPOSE 3000

ENTRYPOINT ["/workspace/sbin/entrypoint.sh"]
