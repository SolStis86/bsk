# Build context: repository root (see .github/workflows/docker-publish.yml)
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/storefront/package.json apps/storefront/

RUN npm ci --include-workspace-root

COPY apps/server apps/server

RUN npm run build -w server
RUN npm prune --omit=dev --workspace=server

FROM node:22-bookworm-slim AS runtime

ARG BUILD_CHANNEL=unknown
ARG GIT_SHA=unknown

WORKDIR /app/apps/server

ENV NODE_ENV=production
ENV ASSET_UPLOAD_DIR=/var/lib/vendure/assets

LABEL org.opencontainers.image.source="https://github.com/SolStis86/bsk" \
      org.opencontainers.image.title="bsk-vendure" \
      com.bsk.build.channel="${BUILD_CHANNEL}" \
      com.bsk.build.sha="${GIT_SHA}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 vendure \
    && useradd --system --uid 1001 --gid vendure vendure \
    && mkdir -p /var/lib/vendure/assets/cache /var/lib/vendure/import-sessions/product-feed-import \
    && chown -R vendure:vendure /var/lib/vendure

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/static ./static
COPY apps/server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R vendure:vendure /app

USER root

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT:-3000}/health" || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "./dist/index.js"]
