# Performance & Optimization Guide

Kenya Quest is engineered for 60fps interaction on mobile and desktop devices.

## Core Optimization Strategies

### 1. Single WebGL Canvas
Rather than allocating multiple WebGL contexts across sections, the home page uses a single, fixed transparent canvas (`stage.js`). Each section registers a DOM bounding box, and the renderer draws only the visible viewport segment.

### 2. Adaptive Particle Budget & Resolution
- Procedural geometries adapt particle counts based on GPU capabilities.
- Device pixel ratio (`dpr`) is clamped to 1.5–2.0 to conserve mobile fill rate.
- Dynamic frame throttling lowers resolution if frame times drop below 50fps.

### 3. Motion & Animation Synchronization
- **Unified Ticker**: Lenis smooth scrolling hooks directly into GSAP's central requestAnimationFrame ticker, eliminating RAF desync and stutter.
- **ScrollTrigger Refresh**: Throttled resize and orientation listeners recalculate scroll trigger pinning boundaries efficiently.

### 4. Edge Asset Caching & Service Bindings
- Static production bundles include content-hashed filenames cached for 1 year via Cloudflare Pages `_headers`.
- Browser API requests talk to the Cloudflare Worker backend over in-process Service Bindings, avoiding public TLS/DNS overhead.
