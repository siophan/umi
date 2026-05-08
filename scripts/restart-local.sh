#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs/local"
RUN_DIR="$ROOT_DIR/.run"

mkdir -p "$LOG_DIR" "$RUN_DIR"

kill_listeners() {
  local port="$1"
  local pids

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "$pids" | xargs kill -9
  fi
}

start_service() {
  local name="$1"
  local workdir="$2"
  local command="$3"
  local logfile="$LOG_DIR/$name.log"
  local pidfile="$RUN_DIR/$name.pid"

  rm -f "$logfile" "$pidfile"

  (
    cd "$workdir"
    nohup bash -lc "$command" >"$logfile" 2>&1 &
    echo $! >"$pidfile"
  )
}

echo "Pulling latest code..."
git -C "$ROOT_DIR" pull --ff-only

echo "Installing dependencies..."
(
  cd "$ROOT_DIR"
  pnpm install
)

echo "Stopping old listeners on 3000 / 3001 / 4000..."
kill_listeners 3000
kill_listeners 3001
kill_listeners 4000

echo "Starting api..."
start_service \
  "api" \
  "$ROOT_DIR/apps/api" \
  "pnpm exec tsx src/index.ts"

echo "Starting web..."
start_service \
  "web" \
  "$ROOT_DIR/apps/web" \
  "pnpm exec next dev --hostname 127.0.0.1 --port 3000"

echo "Starting admin..."
start_service \
  "admin" \
  "$ROOT_DIR/apps/admin" \
  "pnpm exec vite --host 127.0.0.1 --port 3001"

sleep 3

echo
echo "PIDs:"
for name in api web admin; do
  if [[ -f "$RUN_DIR/$name.pid" ]]; then
    printf "  %-5s %s\n" "$name" "$(cat "$RUN_DIR/$name.pid")"
  fi
done

echo
echo "Health checks:"
curl -s http://localhost:4000/health || true
echo
curl -I http://127.0.0.1:3000/ || true
curl -I http://127.0.0.1:3001/ || true

echo
echo "Logs:"
echo "  api   $LOG_DIR/api.log"
echo "  web   $LOG_DIR/web.log"
echo "  admin $LOG_DIR/admin.log"
