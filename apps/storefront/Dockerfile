# Build context: repository root (see .github/workflows/docker-publish.yml)
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/
COPY apps/storefront/package.json apps/storefront/

RUN npm ci --workspace=storefront --include-workspace-root

COPY apps/storefront apps/storefront

ARG NEXT_PUBLIC_SITE_URL
ARG VENDURE_ASSET_HOSTNAME
ARG BUILD_CHANNEL=unknown
ARG GIT_SHA=unknown

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV VENDURE_ASSET_HOSTNAME=${VENDURE_ASSET_HOSTNAME}

RUN npm run build -w storefront

FROM node:22-bookworm-slim AS runtime

ARG BUILD_CHANNEL=unknown
ARG GIT_SHA=unknown

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

LABEL org.opencontainers.image.source="https://github.com/SolStis86/bsk" \
      org.opencontainers.image.title="bsk-storefront" \
      com.bsk.build.channel="${BUILD_CHANNEL}" \
      com.bsk.build.sha="${GIT_SHA}"

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/apps/storefront/public ./apps/storefront/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/static ./apps/storefront/.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "apps/storefront/server.js"]
