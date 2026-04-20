#!/bin/bash
set -e

# Source env defaults if present
if [ -f /workspace/env-defaults ]; then
    set -a
    . /workspace/env-defaults
    set +a
fi

run_backend() {
    echo "Running backend"
    exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
}

run_frontend() {
    echo "Running frontend"
    cd /workspace/src/frontend
    exec pnpm start
}

# Start services — backend runs foreground, frontend runs in background
run_frontend &
run_backend
