#!/bin/bash
set -e

run_backend() {
    echo "Running backend"
    exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
}

run_frontend() {
    echo "Running frontend"
    cd /workspace/src/frontend
    exec pnpm start
}

run_searxng() {
    echo "Running searxng"
    cd /workspace/searxng
    export SEARXNG_SETTINGS_PATH="/workspace/searxng/settings.yml"
    python3 searx/webapp.py
}

# Start services in background
run_searxng &
run_frontend &
run_backend
