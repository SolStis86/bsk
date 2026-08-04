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
# Resulting build-time URLs:
#   production  → https://buysomeknickers.com, https://api.buysomeknickers.com/shop-api
#   development → https://dev.buysomeknickers.com, https://api.dev.buysomeknickers.com/shop-api
#
# Optional environment settings:
#   - Deployment branches: production ← main, development ← develop
#   - Required reviewers for production (recommended before go-live)
#
# Secrets (COOKIE_SECRET, DB_PASSWORD, etc.) belong in Plesk .env only — not in GitHub CI.
