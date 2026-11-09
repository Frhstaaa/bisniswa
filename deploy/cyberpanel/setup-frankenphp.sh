#!/usr/bin/env bash
# BisnisWA CyberPanel / OpenLiteSpeed / Nginx Reverse Proxy Setup for FrankenPHP Octane
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$DIR"

echo "🚀 Preparing BisnisWA for Enterprise Octane with FrankenPHP..."

# 1. Warm Laravel production caches
echo "📦 Optimizing configuration, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 2. Check FrankenPHP binary permissions
if [ -f "./frankenphp" ]; then
    chmod +x ./frankenphp
    echo "✅ Local frankenphp binary verified."
fi

# 3. Validate Caddyfile configuration
echo "🔍 Validating Caddyfile..."
APP_PUBLIC_PATH="$DIR/public" ./frankenphp validate --config Caddyfile --adapter caddyfile

echo "✨ BisnisWA Octane & FrankenPHP configuration ready!"
echo ""
echo "To start in foreground:"
echo "  ./bin/octane-start.sh"
echo ""
echo "To manage as background systemd service:"
echo "  sudo cp deploy/systemd/bisniswa-octane.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable --now bisniswa-octane"
echo "  sudo systemctl status bisniswa-octane"
