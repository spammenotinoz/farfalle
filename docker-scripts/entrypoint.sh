#!/bin/bash
set -e
source /workspace/env-defaults

run_backend() {
    cd /workspace
    echo "Running backend"
    exec poetry run uvicorn backend.main:app --host 0.0.0.0 --port 8000
}

run_frontend() {
    cd /workspace/src/frontend
    pnpm build
    echo "Running frontend"
    pm2 start pnpm -- start
}

run_frontend &
run_backend
