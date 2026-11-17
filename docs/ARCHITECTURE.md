# Kenya Quest Architecture & System Design

This document details the architectural design, runtime environments, data flows, and state management strategies in Kenya Quest.

## System Overview

```
                      +-----------------------------+
                      |       Client Browser        |
                      |  React 19 + Three.js + GSAP |
                      +--------------+--------------+
                                     |
                       HTTP / Fetch  |  (LocalStorage: Progress & Ideas)
                                     v
                      +-----------------------------+
                      |    Cloudflare Pages Edge    |
                      |   Asset & Service Binding   |
                      +--------------+--------------+
                                     |
                       Service Binding (In-process RPC)
                                     v
                      +-----------------------------+
                      |   Cloudflare Worker (API)   |
                      |  TypeScript + In-Memory DB  |
                      +--------------+--------------+
                                     |
                         Bundles at Build Time
                                     v
                      +-----------------------------+
                      |    Canonical JSON Data      |
                      |  server/data/*.json         |
                      +-----------------------------+
```

## Core Components

### 1. Frontend Client (`client/`)
- **React 19 & React Router 7**: Single-page application rendering routes and interactive states.
- **Three.js WebGL Stage**: Shared single canvas rendering procedural particle geometry for Nairobi landmarks, contour lines, and mood transitions.
- **GSAP & Lenis**: Custom ticker integration orchestrating smooth scrolling and ScrollTrigger timelines.
- **Leaflet**: Geospatial rendering of quest routes and venue pins across Nairobi.
- **Local Progress Store**: Synchronizes quest task completions and custom suggestions via browser `localStorage`.

### 2. Primary Edge API (`server/worker/`)
- **Cloudflare Worker**: Zero-latency edge computation responding to `/api/*` routes.
- **In-Memory Catalog & Index**: Pre-indexed catalog validated during build and startup.
- **Search Engine**: Ranked multi-term keyword search weighting names and categories over body text.
- **ETags & Conditional Caching**: Generates weak ETags supporting `304 Not Modified` responses.

### 3. Fallback Backend (`server/main.py`)
- **FastAPI**: Python implementation with equivalent routing and search semantics for local development or alternative hosting.

### 4. Canonical Datasets (`server/data/`)
- `quests.json`: Structured quest paths, difficulty scores, and duration estimates.
- `places.json`: Geo-tagged venues and attractions with coordinates.
- `locations.json`: Distinct Nairobi neighbourhoods (CBD, Westlands, Karen, etc.).
- `deals.json`: Promotional perks and special offers.
