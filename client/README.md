# Kenya Quest Client

Frontend application for Kenya Quest, built with React 19, Vite, Tailwind-style modern CSS, Three.js, GSAP, and Leaflet.

## Features

- **Procedural 3D Stage**: Single canvas WebGL point cloud visualization of Nairobi landmarks and terrain using Three.js and custom shaders.
- **Fluid Motion System**: GSAP ScrollTrigger timelines, Lenis smooth scrolling, text reveal animations, and interactive magnetic cursors.
- **Discovery Map**: Interactive Leaflet map displaying quest routes, checkpoints, and venue pins across Nairobi.
- **Offline Progress Tracker**: Quest progress, task completions, and custom quest suggestions stored client-side in localStorage.
- **Responsive & Accessible**: Night-first aesthetic with paper theme switcher, responsive layouts, and full `prefers-reduced-motion` support.

## Project Structure

```
client/
├── public/              # Static assets, fonts, and headers
├── src/
│   ├── components/      # UI components (Nav, Footer, Cards, Maps, Stage)
│   ├── lib/             # API client, progress store, landmark data, utilities
│   ├── motion/          # Lenis, GSAP setup, cursor, and animation effects
│   ├── pages/           # Route views (Home, Quests, Places, Locations, etc.)
│   ├── three/           # Procedural particle geometries, shaders, stage manager
│   ├── App.jsx          # Route definitions and layout wrapper
│   └── main.jsx         # Application entry point
├── tests/               # Node test suite for client-side stores and proxy
└── worker/              # Cloudflare Pages asset and proxy worker
```

## Available Scripts

In the `client` directory:

```sh
npm run dev        # Start Vite dev server on http://localhost:5173
npm run build      # Build production bundle to client/dist
npm run preview    # Preview production build locally
npm test           # Run client unit tests
```
