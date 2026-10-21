# Kenya Quest — PRD

Tagline: Go somewhere. Do something. Make a memory.

## 1. Concept

Travel discovery site for Kenya (MVP: Nairobi only). Instead of listing places, gives users a quest — set of tasks tied to a location — to complete. No account, no photo upload required, no backend.

## 2. Tech Stack

Client/server separated, two folders in repo:

```
client/   React + Vite + JavaScript + Tailwind CSS
server/   FastAPI (Python)
```

- Client fetches quests/places/deals from server API instead of static JS files.
- Server serves seed data (can start as in-memory / JSON-backed, no real DB required for MVP).
- localStorage still used client-side for quest progress (no account).
- No auth, no payments, no admin dashboard.

### API endpoints (FastAPI, MVP)
```
GET /api/quests
GET /api/quests/{id}
GET /api/places
GET /api/places/{id}
GET /api/locations
GET /api/locations/{id}
GET /api/categories
GET /api/deals
GET /api/search?q=
GET /api/health
```

Quest and place objects carry `lat`/`lng` so the map can plot them. Categories are an array per quest.

## 3. Routes (client)

```
/
/quests
/quests/:id
/places
/places/:id
/locations
/locations/:id
/categories/:category
* (404)
```

## 4. Data files (server-side seed data)

```
server/data/quests.json
server/data/places.json
server/data/deals.json
server/data/locations.json
```

Client no longer holds static data files; fetches via API (section 2).

### Quest object shape
```js
{
  id, title, location, category, description,
  duration, budget, difficulty,
  tasks: [{ id, label }],
  nearbyPlaces: [placeId],
  mapUrl
}
```

### Place object shape
```js
{
  id, name, type, description, location,
  price, openingInfo, website, mapsUrl,
  relatedQuests: [questId]
}
```
Types: Restaurant, Café, Attraction, Activity, Hotel, Nature, Shopping, Entertainment

### Deal object shape (static sample data only)
```js
{ id, title, placeId, description, priceRange }
```

## 5. Categories

Food, Adventure, Culture, Nature, Nightlife, Date, Family, Budget

## 6. Initial locations

Nairobi CBD, Karen, Westlands, Kilimani, Gigiri

Each location page shows: quests, places, food, deals for that location.

## 7. Initial quests (5, seed data)

1. KICC City Quest — Culture/Explore — Nairobi CBD
2. Karura Nature Quest — Nature/Adventure
3. Nairobi Museum Quest — Culture
4. Karen Experience Quest — Culture/Food — Karen
5. Westlands Food Quest — Food/Nightlife — Westlands

## 8. Quest task completion

- Tasks checkable, progress shown as `x / n completed`.
- All tasks done -> Quest Complete state, CTA "Explore Another Quest".
- Progress persisted in localStorage, keyed by quest id, no account needed.
- Photos never required to complete a quest.

## 9. Search

Search across quests, places, locations, categories, keywords. Simple client-side filter over static data, no backend.

## 10. Navigation

Top nav: Kenya Quest logo, Explore, Quests, Places, Categories, Search. Mobile: simplified/collapsed nav.

## 11. Design direction

Apple-style glassmorphism. Minimal, premium, spacious.

- Frosted-glass panels: `backdrop-filter: blur(20px)`, semi-transparent white/black surfaces, thin 1px translucent border
- Soft depth via layered blur + subtle shadow, not flat cards
- Neutral background (soft gradient or blurred photo behind glass panels), never loud gradients on UI elements themselves
- Strong SF-Pro-like typography (system font stack), generous whitespace
- Rounded corners (large radius, 16–24px), pill-shaped buttons/nav
- Motion: subtle spring/ease transitions only (hover lift, fade-in), no flashy animation
- Light and dark mode both supported, glass effect readable in both
- Avoid: heavy drop shadows, skeuomorphism, clutter, generic AI-template look, excess card borders

## 12. Explicit non-goals for MVP

No accounts, profiles, reviews, payments, booking, live availability, real maps SDK, GPS, chat, notifications, admin dashboard, backend API.

## 13. Future (not MVP)

Accounts, badges (Nairobi Explorer, Food Explorer, Nature Explorer, Coast Explorer, Kenya Explorer), optional photo memories, personalized discovery, more cities (Mombasa, Kisumu, Nakuru, Naivasha, Eldoret, Diani, Malindi).

## 14. MVP success criteria

User can: open site, browse quests, search, open quest, see tasks, check off tasks, see progress, complete quest, discover nearby places, open map/external link, return later with progress intact. Works desktop + mobile.
