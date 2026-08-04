# GitHub Environments setup (Settings → Environments)
#
# Used by .github/workflows/docker-publish.yml — NOT the same as Plesk .env secrets.
# CI only needs variables (plaintext URLs/domains). No secrets required for image builds.
#
# ┌─────────────────┬──────────────────────────────────┬─────────────────────────────┐
# │ Variable        │ production                       │ development                 │
# ├─────────────────┼──────────────────────────────────┼─────────────────────────────┤
# │ ROOT_DOMAIN     │ buysomeknickers.com              │ buysomeknickers.com         │
# │ ENV_LABEL       │ (empty)                          │ dev.                        │
# └─────────────────┴──────────────────────────────────┴─────────────────────────────┘
#
# Resulting build-time URLs (baked into the storefront image):
#   production  → https://buysomeknickers.com, api.buysomeknickers.com (assets)
#   development → https://dev.buysomeknickers.com, api.dev.buysomeknickers.com (assets)
#
# VENDURE_SHOP_API_URL is NOT set in GitHub — the Docker build skips live API calls.
# Runtime API URL is set in Plesk compose (.env / environment block).
#
# Optional environment settings:
#   - Deployment branches: production ← main, development ← develop
#   - Required reviewers for production (recommended before go-live)
#
# Secrets (COOKIE_SECRET, DB_PASSWORD, etc.) belong in Plesk .env only — not in GitHub CI.
