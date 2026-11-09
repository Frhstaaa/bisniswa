#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "⚡ Starting BisnisWA Enterprise Octane (FrankenPHP)..."
exec php artisan octane:start \
    --server=frankenphp \
    --caddyfile=Caddyfile \
    --host="${OCTANE_HOST:-127.0.0.1}" \
    --port="${OCTANE_PORT:-8008}" \
    --admin-port="${OCTANE_ADMIN_PORT:-2029}" \
    --workers="${OCTANE_WORKERS:-auto}" \
    --max-requests="${OCTANE_MAX_REQUESTS:-1000}"
