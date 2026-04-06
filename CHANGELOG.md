# Changelog

## 0.1.0 (2026-04-06)

First minor release — all core features are in place and APIs are stabilizing.

### Highlights
- Search proxy with caching, rate limiting, and InstantSearch compatibility
- BullMQ ingestion queue with computed fields
- Query suggestions, analytics tracking, geo search, group by
- Synonyms and curations managed via config
- CLI with init, dev, generate, migrate, seed, health
- Headless React components with BaseUI-style overrides
- SSR support, URL sync, debounced search
- Nextra documentation site

*This release includes all changes from 0.0.1–0.0.3. See below for detailed changelogs.*

## 0.0.3 (2026-04-04)

### Features
- **@tsproxy/cli**: `tsproxy generate` — scaffold config from existing Typesense schema
- **@tsproxy/api**: Query suggestions endpoint (`GET /api/suggestions`)
- **@tsproxy/api**: Analytics tracking (`POST /api/analytics/click`, `/conversion`, `GET /popular`)
- **@tsproxy/api**: Geo search support (aroundLatLng + aroundRadius → Typesense geo filter)
- **@tsproxy/api**: Group by support (groupBy + groupLimit params)
- **@tsproxy/api**: Synonyms management via config (multi-way and one-way)
- **@tsproxy/api**: Curations/pinning via config (pin and hide documents per query)
- **@tsproxy/react**: Autocomplete component (standalone, calls /api/suggestions)
- **Demo**: Mobile responsive filter drawer
- **Demo**: SortBy hidden on mobile

### DX
- Friendly error messages for common failures (ECONNREFUSED, bad API key, timeout)
- `tsproxy migrate --apply` now syncs synonyms and curations to Typesense

### Tests
- Integration tests for suggestions and analytics endpoints
- CLI E2E tests (help, version, all commands)
- 69 total tests passing

## 0.0.2 (2026-04-04)

### Features
- **@tsproxy/cli**: New CLI package with `init`, `dev`, `start`, `build`, `seed`, `migrate`, `health` commands
- **@tsproxy/react**: Headless components with BaseUI-style overrides pattern
- **@tsproxy/react**: `NoResults` and `HitsSkeleton` components
- **@tsproxy/react**: `SearchProvider` standalone component
- **@tsproxy/api**: BullMQ queue backend with Redis (in-memory fallback)
- **@tsproxy/api**: Redis health check in `/api/health`
- **@tsproxy/api**: Error surfacing — `_errors` array in search response
- **@tsproxy/api**: Production Docker Compose with proxy container
- **Demo**: SSR with `getServerState` + `InstantSearchSSRProvider`
- **Demo**: URL sync with InstantSearch history router
- **Demo**: Debounced search (300ms)
- **Demo**: Loading skeletons and empty state
- **Demo**: SortBy widget (Relevance, Price, Rating)
- **Demo**: Mobile responsive filter drawer
- **Demo**: Ingest testing page at `/ingest`
- **Demo**: Whoppah-inspired design
- **Docs**: Nextra documentation site deployed to Cloudflare

### Bug Fixes
- Fix search: handle InstantSearch v7 object params format
- Fix search: auto-populate `query_by` from config's searchable fields
- Fix: don't cache error responses in LRU cache
- Fix: handle undefined `nbHits` in transform (no more NaN/null)
- Fix: SearchBox debounce shows typed text immediately
- Fix: client-side adapter doesn't cache empty/error responses
- Fix: single React version in monorepo via pnpm overrides

### Other
- Renamed project from typesense-proxy to tsproxy
- Added color field to seed data
- Locale-specific seeding with `--locales` flag
- npm trusted publishing with provenance
- GitHub Actions CI + publish workflows
- Node.js 24

## 0.0.1 (2026-04-03)

Initial release.

### Packages
- **@tsproxy/api**: HonoJS proxy server with search, ingest, caching, rate limiting
- **@tsproxy/js**: InstantSearch-compatible searchClient adapter
- **@tsproxy/react**: React components (thin wrappers around react-instantsearch)
