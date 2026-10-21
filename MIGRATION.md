# Backend migration status

The Cloudflare Worker is now the primary development and deployment target. FastAPI remains an optional fallback.

- Both APIs read the canonical files in `server/data/`; duplicate Worker seed files have been removed.
- Both provide `/api/discover` in addition to the original catalog routes.
- The client dev proxy targets port 8787 by default; `API_PROXY_TARGET` can select FastAPI on port 8000.
- The production client Worker forwards `/api` through an `API` service binding to `kenya-quest-api`. This avoids a build-time API hostname and browser CORS dependency.
- Direct cross-origin access to the Worker is configured with `ALLOWED_ORIGINS`; origins are never reflected without checking the allowlist.
- Wrangler 4 is installed in both projects. Build, API/progress/proxy tests, and deployment dry-run commands are available.
- The API remains public, stateless and read only. No database, auth or payment migration is needed.

This document describes the checked-in configuration, not the state of any live deployment. See README.md for commands and deployment order.
