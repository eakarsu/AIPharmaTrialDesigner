#!/usr/bin/env bash
set -Eeuo pipefail

APP_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$APP_ROOT"

if [[ ! -f .env ]]; then
  echo 'Missing .env; copy .env.example and provide local secrets.' >&2
  exit 1
fi
set -a
source .env
set +a
: "${BACKEND_PORT:?BACKEND_PORT is required}"
: "${FRONTEND_PORT:?FRONTEND_PORT is required}"
[[ "${ALLOW_SCHEMA_MIGRATION:-}" == "true" ]] || { echo 'ALLOW_SCHEMA_MIGRATION=true is required.' >&2; exit 1; }
export BACKEND_PORT FRONTEND_PORT

for dependency_dir in backend/node_modules; do
  if [[ ! -d "$dependency_dir" ]]; then
    echo "Missing $dependency_dir; install dependencies explicitly before starting." >&2
    exit 1
  fi
done

check_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use; refusing to terminate an unrelated process." >&2
    exit 1
  fi
}
check_port "$BACKEND_PORT"

(cd backend && node scripts/prepareRuntime.js)

if [[ "${NODE_ENV:-}" == "test" ]]; then
  echo "Starting API-only test runtime on port $BACKEND_PORT."
  cd backend
  exec node server.js
fi

if [[ ! -d frontend/node_modules ]]; then
  echo "Missing frontend/node_modules; install dependencies explicitly before starting." >&2
  exit 1
fi
check_port "$FRONTEND_PORT"

BACKEND_PID=
FRONTEND_PID=
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "${BACKEND_PID:-}" ]] && wait "$BACKEND_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && wait "$FRONTEND_PID" 2>/dev/null || true
  exit "$status"
}
trap cleanup EXIT INT TERM

(cd backend && node server.js) &
BACKEND_PID=$!
(cd frontend && BROWSER=none PORT="$FRONTEND_PORT" npm start) &
FRONTEND_PID=$!

while kill -0 "$BACKEND_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do
  sleep 1
done

status=0
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  wait "$BACKEND_PID" || status=$?
else
  wait "$FRONTEND_PID" || status=$?
fi
exit "$status"
