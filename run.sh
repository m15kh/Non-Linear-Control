#!/usr/bin/env bash
# Start the site:  ./run.sh            → http://localhost:8081
#                  PORT=3000 ./run.sh  → http://localhost:3000
# Any extra arguments go to the server, e.g. ./run.sh -addr 127.0.0.1:9000
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v go >/dev/null 2>&1; then
  echo "Go is not installed. Get Go 1.22 or newer from https://go.dev/dl/" >&2
  exit 1
fi

# Default port for this script; the server reads PORT, so the message and the server agree.
export PORT="${PORT:-8081}"

echo "Starting on http://localhost:${PORT}  (press Ctrl+C to stop)"
exec go run . "$@"
