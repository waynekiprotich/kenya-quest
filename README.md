# Kenya Quest

A Nairobi discovery app: choose a quest, visit real places, complete five tasks, and keep progress on your device.

## Development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run setup
npm run dev
```

Open http://localhost:5173. The root dev script starts Vite and the Cloudflare API Worker together. The API runs on port 8787 and Vite proxies `/api` to it. Ctrl+C stops both processes.

```sh
npm run check     # progress/proxy/API tests, typecheck, backend and frontend builds
npm run format    # consistent formatting for JS, TS, JSX and CSS
```

The `client/` and `server/` directories are independent Git repositories. Root orchestration and documentation live outside those repositories; include them separately when sharing the complete workspace.

## Architecture

- `client/`: React 19, Vite 7, Motion, GSAP with ScrollTrigger, Lenis, three.js and Leaflet. Routes, the WebGL stage and maps all load on demand.
- `client/src/three/`: the home page's single WebGL stage (`stage.js`) and its seeded, procedural point clouds (`shapes.js`): the floating particle city, five landmark sculptures, the mood formations and the contour-line shader.
- `client/src/motion/`: GSAP setup and scroll timelines (`gsap.js`), Lenis smooth scrolling on GSAP's ticker, text reveals, marquee, magnetic buttons, parallax and the pointer label.
- `client/worker/`: production asset server with `/api` forwarding through a Cloudflare service binding. `client/public/_headers` caches hashed assets for a year.
- `server/worker/`: primary API in TypeScript: indexed catalog, ranked search, ETags, data validation, configurable CORS and API tests.
- `server/data/`: single source of truth for quests, places, locations, photos and sample deals. Both backends use these files.
- `server/main.py`: optional FastAPI fallback with the same catalog, route order and search ranking.

### Interface

The look is night-first: near-black and deep navy surfaces, off-white editorial type (Bricolage Grotesque with Instrument Serif italics) and electric lime. A circular control in the header switches to a paper theme.

The home page shares one fixed, transparent WebGL canvas. Each section hands it a DOM element and the stage draws that element's scene inside its rectangle:

- **Hero**: a floating particle city with a contour-lined terrain, a river, routes with travelling light and five numbered hotspots, one per quest. Drag (mouse or touch) to turn it; select a hotspot, a tab, or use previous and next to swing the camera to that landmark and update the floating quest panel. The tour advances on its own until you interact, and the pause control stops both the tour and the ambient motion. Left and right arrow keys turn the city when it has focus; arrow keys, Home and End move between the numbered tabs.
- **The idea**: a lime panel whose diagonal edge flattens as it arrives, with the statement filling in word by word.
- **Selected quests**: alternating editorial rows numbered like the hotspots, each with its own particle sculpture that assembles on scroll and reacts to the pointer. "Find on the map" returns to the hero with that quest selected.
- **Moods**: hovering or focusing a mood morphs the particle field (rings, canopy, spiral, grid, ridges) and swaps the word to its serif form. Touch screens follow the scroll instead.
- **How it works**: three oversized numbers that fill with lime as they pass.
- **Suggest a quest**: a validated form over the contour shader. Ideas are saved to `kenya-quest:ideas` in this browser only; nothing is sent to a server, and the success message says so.

The stage adapts particle counts and pixel ratio to the device and lowers resolution if frames run slow. Without WebGL, every section falls back to static art and all controls keep working. With `prefers-reduced-motion`, smooth scrolling, the tour, ambient drift and scroll-linked movement switch off, the camera cuts instead of gliding, and mood changes use a short fade.

Other pages share the same system: a pinned horizontal quest rail on `/quests`, the neighbourhood index with a trailing photo, maps that open as they scroll in, animated checklists, a completion stamp and a lime page curtain. Photos are illustrative; venue details and prices remain seed content.

## API

All routes are under `/api`:

| Route | Behavior |
| --- | --- |
| `/discover` | Homepage quests, location counts and category counts in one response |
| `/quests`, `/quests/:id` | Filters: `location`, `category`; detail includes places and sample deals |
| `/places`, `/places/:id` | Filters: `location`, `type`; detail includes quests and sample deals |
| `/locations`, `/locations/:id` | Counts and area details |
| `/categories` | Category counts |
| `/deals` | Sample offers; filter by `location` |
| `/search?q=` | Quests, places, areas and categories; maximum 200 characters |
| `/health` | Service health |

Search matches every word of the query (accents ignored) and ranks names and titles above descriptions. Quest detail lists places in route order.

The Worker accepts GET, HEAD and OPTIONS. Successful catalog responses are cacheable for 60 seconds in browsers and 300 seconds in shared caches, and carry an ETag, so repeat requests with `If-None-Match` get `304 Not Modified`. Errors and `/health` use `no-store`. `ALLOWED_ORIGINS` optionally adds comma-separated origins for direct cross-origin API consumers; localhost:5173 is included for development. Same-origin production calls need no CORS configuration.

## Build and deploy

Validate both deployments without publishing:

```sh
npm --prefix server/worker run deploy:check
npm --prefix client run deploy:check
```

Deploy the API first, then the client, after authenticating Wrangler to the intended Cloudflare account:

```sh
npm --prefix server/worker run deploy
npm --prefix client run deploy
```

The client binds `API` to `kenya-quest-api`. Both Workers must be in the same account. The client build defaults to `/api`; no production `VITE_API_URL` is needed. For a separate external API, set `VITE_API_URL` before building and configure that API’s CORS origins. `npm run preview` uses the same local API proxy as development.

## FastAPI fallback

```sh
cd server
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload --port 8000
```

In another terminal, start the client with `API_PROXY_TARGET=http://127.0.0.1:8000 npm --prefix client run dev`. The Python backend is optional; normal development and deployment use the Worker.

## Progress

`kenya-quest:progress` stores `{ [questId]: [taskId, ...] }` in localStorage. Data is sanitized, stale task IDs do not count toward completion, updates synchronize across tabs, and blocked storage falls back to memory for the current page session. There is no account, database, booking or payment flow.
