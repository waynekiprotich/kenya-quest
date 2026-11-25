# Testing Strategy

Kenya Quest uses Node.js's built-in native test runner (`node:test`) and assertion library (`node:assert/strict`) across both frontend and backend suites, eliminating external testing dependencies.

## Test Suites

### 1. Client Unit Tests (`client/tests/`)
- **`progress.test.js`**: Validates localStorage serialization, sanitization of malformed progress snapshots, cross-tab event synchronization, and multiple subscriber lifecycles.
- **`ideas.test.js`**: Tests form input validation (email regex, budget constraints, character limits, whitespace trimming) and localStorage fallback persistence.
- **`images.test.js`**: Verifies responsive srcset formation, dynamic Unsplash dimensions, and category asset mapping.
- **`landmarks.test.js`**: Asserts Nairobi hotspot metadata completeness, unique particle kinds, and API record overlay merging.
- **`routes.test.js`**: Tests route loader registration and safe dynamic chunk prefetching for SPA navigation.
- **`proxy.test.js`**: Verifies Cloudflare Pages proxy worker routing, asset pass-through, and service binding error handling.

### 2. Edge API Integration Tests (`server/worker/tests/`)
- **`api.test.mjs`**: Runs against the compiled Cloudflare Worker bundle (`dist/index.js`).
- Verifies catalog consistency between aggregated `/api/discover` and individual resource endpoints.
- Validates operational health reporting and location-level entity relationships.
- Validates ETag generation, weak validator matching, and `304 Not Modified` conditional responses.
- Tests multi-term ranked search algorithms and input bounds enforcement.
- Checks CORS headers, origin whitelist validation, and preflight request rejection.

## Running Tests

```sh
# Run both test suites
npm test

# Run client tests only
npm --prefix client test

# Run worker tests (builds and executes test suite)
npm --prefix server/worker test

# Complete verification (tests + typecheck + bundle builds)
npm run check
```
