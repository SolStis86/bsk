#!/bin/sh
set -e

# Named volumes mount as root-owned; ensure asset dirs exist for the vendure user.
mkdir -p /app/apps/server/static/assets/cache
chown -R vendure:vendure /app/apps/server/static/assets

exec su vendure -s /bin/sh -c 'cd /app/apps/server && exec "$@"' -- "$@"
