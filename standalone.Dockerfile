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

# Install poetry first
RUN pip install --no-cache-dir poetry

# Copy dependency files first for better caching
COPY pyproject.toml poetry.lock ./
COPY README.md ./

# Install dependencies (no dev dependencies, no-cache)
RUN poetry config virtualenvs.in-project true && \
    poetry install --no-interaction --no-ansi --no-root --only main

# Copy backend source
COPY src/backend src/backend


FROM node:20-alpine as frontend
LABEL authors="rashadphz"

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_LOCAL_MODE_ENABLED
ARG NEXT_PUBLIC_PRO_MODE_ENABLED

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_LOCAL_MODE_ENABLED=${NEXT_PUBLIC_LOCAL_MODE_ENABLED}
ENV NEXT_PUBLIC_PRO_MODE_ENABLED=${NEXT_PUBLIC_PRO_MODE_ENABLED}

WORKDIR /app

# Copy package files
COPY src/frontend/package.json src/frontend/pnpm-lock.yaml ./

# Create .env for Next.js build (reads NEXT_PUBLIC_* vars at build time)
RUN echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" >> .env && \
    echo "NEXT_PUBLIC_LOCAL_MODE_ENABLED=${NEXT_PUBLIC_LOCAL_MODE_ENABLED}" >> .env && \
    echo "NEXT_PUBLIC_PRO_MODE_ENABLED=${NEXT_PUBLIC_PRO_MODE_ENABLED}" >> .env

# Install dependencies (including dev for build)
RUN npm install -g pnpm && \
    pnpm install --force

# Copy source and build
COPY src/frontend/ .
RUN pnpm build


FROM python:3.11-slim-bookworm as runtime
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
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally in runtime
RUN npm install -g pnpm

# Copy Python virtualenv from builder
COPY --from=builder /workspace/.venv /workspace/.venv

# Copy backend
COPY --from=builder /workspace/src/backend /workspace/src/backend

# Copy built frontend application and dependencies
COPY --from=frontend /app/node_modules /workspace/src/frontend/node_modules
COPY --from=frontend /app/.next /workspace/src/frontend/.next
COPY --from=frontend /app/public /workspace/src/frontend/public
COPY --from=frontend /app/next.config.mjs /workspace/src/frontend/next.config.mjs
COPY --from=frontend /app/package.json /workspace/src/frontend/package.json

COPY docker-scripts/entrypoint.sh /workspace/sbin/entrypoint.sh
RUN chmod +x /workspace/sbin/entrypoint.sh

EXPOSE 8000
EXPOSE 3000

ENTRYPOINT ["/workspace/sbin/entrypoint.sh"]
