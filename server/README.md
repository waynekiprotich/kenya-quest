# Kenya Quest Backend

This directory houses the backend implementations and canonical data for Kenya Quest.

## Architecture

- **`worker/`**: Primary production backend implemented in TypeScript for Cloudflare Workers. High performance, zero cold starts, and low edge latency.
- **`main.py`**: Optional Python / FastAPI backend fallback providing identical REST endpoints, response structures, and search ranking logic.
- **`data/`**: Canonical JSON datasets used as the single source of truth across both backends:
  - `quests.json`: Quests with ordered place IDs, difficulty levels, estimated durations, and checkpoints.
  - `places.json`: Curated places, coordinates (latitude/longitude), categories, descriptions, and photography metadata.
  - `locations.json`: Nairobi neighbourhoods and districts (CBD, Westlands, Karen, Kilimani, etc.).
  - `deals.json`: Special promotions and deals linked to places and quests.

## Running the Backends

### Cloudflare Worker (Primary)

```sh
cd server/worker
npm ci
npm run dev        # http://localhost:8787
```

### FastAPI Fallback (Optional)

```sh
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Endpoint Reference

All endpoints return JSON and are prefixed with `/api`.

- `GET /api/discover` - Featured quests, curated places, and categories
- `GET /api/categories` - Categories with place count metrics
- `GET /api/quests?location={id}&category={id}` - Filterable quest listing
- `GET /api/quests/{id}` - Individual quest details with ordered stops
- `GET /api/places?location={id}&type={type}` - Filterable venues and attractions
- `GET /api/places/{id}` - Place details with coordinates and location
- `GET /api/locations` - Neighbourhood listing
- `GET /api/locations/{id}` - Neighbourhood detail with linked quests and places
- `GET /api/deals?location={id}` - Current perks and deals
- `GET /api/search?q={query}` - Ranked search across names, tags, and descriptions
