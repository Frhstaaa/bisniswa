#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🔄 Gracefully reloading BisnisWA Octane workers (zero-downtime)..."
php artisan octane:reload
echo "✅ Octane workers reloaded successfully!"
