#!/bin/sh
set -e

# Named volumes mount as root-owned; ensure shared dirs exist for the vendure user.
mkdir -p \
    /var/lib/vendure/assets/cache \
    /var/lib/vendure/import-sessions/product-feed-import
chown -R vendure:vendure /var/lib/vendure/assets /var/lib/vendure/import-sessions

cd /app/apps/server || exit 1
exec su -s /bin/sh vendure -c 'exec "$@"' sh "$@"
