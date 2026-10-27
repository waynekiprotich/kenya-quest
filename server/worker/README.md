# Kenya Quest API

Primary TypeScript API running on Cloudflare Workers.

Canonical data lives in `../data/` and is bundled at build time. Data validation ensures all IDs, coordinates, and relational links are verified on startup.

## Development

```sh
npm ci
npm run dev        # Run locally on port 8787 via Wrangler
npm test           # Typecheck, bundle with esbuild, and run API test suite
npm run build      # Validate TypeScript and bundle the worker
npm run deploy     # Deploy worker to Cloudflare
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/discover` | Aggregated discovery payload (featured quests, top places, categories) |
| `GET` | `/api/categories` | Complete category list with associated place counts |
| `GET` | `/api/quests` | Filter quests by query params (`location`, `category`) |
| `GET` | `/api/quests/:id` | Quest details with route-ordered places and task checklist |
| `GET` | `/api/places` | Filter places by query params (`location`, `type`) |
| `GET` | `/api/places/:id` | Place details with location info and photos |
| `GET` | `/api/locations` | All neighbourhood locations |
| `GET` | `/api/locations/:id` | Location detail with related quests and venues |
| `GET` | `/api/deals` | Sample venue deals and partner discounts |
| `GET` | `/api/search?q=:query` | Full-text ranked search across catalog names and descriptions |

## Features

- **In-Memory Caching & ETags**: Responses carry weak ETags and support `304 Not Modified` conditional requests.
- **Service Binding Support**: In production, the client worker talks directly to this worker via Cloudflare Service Bindings without traversing the public internet.
- **Configurable CORS**: Supports `ALLOWED_ORIGINS` environment variable for cross-origin client access, with localhost:5173 enabled by default during development.
