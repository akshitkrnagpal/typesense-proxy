# typesense-proxy

A production-ready search proxy for Typesense with caching, rate limiting, ingestion queue, and InstantSearch-compatible React components.

## Architecture

```
Frontend (React + InstantSearch)
    |
    v
[@tsproxy/web]  React components + adapter
    |
    v  (POST /api/search)
[@tsproxy/api]  HonoJS proxy server
    |  - In-memory LRU cache
    |  - Rate limiting
    |  - Ingestion queue
    v
[Typesense]
```

## Packages

| Package | Description |
|---------|-------------|
| `@tsproxy/api` | HonoJS proxy server with search, ingest, caching, and rate limiting |
| `@tsproxy/web` | React components and InstantSearch adapter |
| `apps/web` | Next.js Pages Router demo app |

## Features

### Search (Public)
- Algolia InstantSearch-compatible API
- In-memory LRU cache with configurable TTL
- Rate limiting per endpoint
- Multilingual collection routing

### Ingest (API Key Protected)
- Concurrency-limited ingestion queue
- Single document upsert, bulk import, partial update, delete
- Configurable batch size and queue depth
- Queue status monitoring endpoint

### Frontend
- Drop-in React components wrapping Algolia InstantSearch
- Custom adapter that talks to the proxy server
- Locale selector for multilingual search
- Works with SearchBox, Hits, RefinementList, Pagination, Stats

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm
- Docker (for Typesense)

### Setup

```bash
# Clone
git clone https://github.com/akshitkrnagpal/typesense-proxy.git
cd typesense-proxy

# Install
pnpm install

# Start Typesense
docker compose up -d

# Seed sample data
pnpm seed

# Start dev servers
pnpm dev
```

## Config-Driven Server

The proxy server is configured via `tsproxy.config.ts`:

```typescript
import { defineConfig } from "@tsproxy/api";

export default defineConfig({
  typesense: {
    host: "localhost",
    port: 8108,
    apiKey: "your-api-key",
  },

  server: {
    port: 3000,
    apiKey: "your-ingest-secret",
  },

  cache: { ttl: 60, maxSize: 1000 },
  queue: { concurrency: 5, maxSize: 10000 },
  rateLimit: { search: 100, ingest: 30 },

  collections: {
    products: {
      fields: {
        name: { type: "string", searchable: true },
        price: { type: "float", sortable: true },
        category: { type: "string", facet: true },
        brand: { type: "string", facet: true },
      },
      locales: ["en", "fr", "de"],
      defaultSortBy: "created_at",
    },
  },
});
```

### CLI Commands

```bash
# Development mode
tsproxy dev

# Production mode
tsproxy start

# Validate config
tsproxy validate

# Custom config file
tsproxy dev --config ./my-config.ts

# Override port
tsproxy dev --port 4000
```

### With Portless (recommended)

```bash
# Install portless globally
npm install -g portless

# Start API server
portless api pnpm --filter @tsproxy/api dev
# → https://api.localhost

# Start web app
portless web pnpm --filter apps/web dev
# → https://web.localhost
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TYPESENSE_HOST` | `localhost` | Typesense host |
| `TYPESENSE_PORT` | `8108` | Typesense port |
| `TYPESENSE_PROTOCOL` | `http` | `http` or `https` |
| `TYPESENSE_API_KEY` | - | Typesense admin API key (required) |
| `PROXY_PORT` | `3000` | Proxy server port |
| `PROXY_API_KEY` | - | API key for ingest endpoints (required) |
| `CACHE_TTL` | `60` | Search cache TTL in seconds |
| `CACHE_MAX_SIZE` | `1000` | Max cached search results |
| `QUEUE_CONCURRENCY` | `5` | Max concurrent Typesense writes |
| `QUEUE_MAX_SIZE` | `10000` | Max queued ingestion tasks |
| `RATE_LIMIT_SEARCH` | `100` | Search requests per minute |
| `RATE_LIMIT_INGEST` | `30` | Ingest requests per minute |

### Multilingual Collections

Set `COLLECTIONS_CONFIG` environment variable:

```json
{
  "products": {
    "locales": {
      "en": "products_en",
      "fr": "products_fr",
      "de": "products_de"
    }
  }
}
```

The proxy routes search/ingest requests to the correct collection based on the `X-Locale` header or `locale` query parameter.

## API Endpoints

### Search (Public)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/search` | Multi-search (InstantSearch-compatible) |

### Ingest (Protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ingest/:collection/documents` | Upsert single document |
| POST | `/api/ingest/:collection/documents/import` | Bulk import |
| PATCH | `/api/ingest/:collection/documents/:id` | Partial update |
| DELETE | `/api/ingest/:collection/documents/:id` | Delete document |
| DELETE | `/api/ingest/:collection/documents` | Delete by filter |
| GET | `/api/ingest/queue/status` | Queue stats |

### Infrastructure

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/docs` | API documentation (Scalar UI) |
| GET | `/api/openapi.json` | OpenAPI specification |

## Frontend Usage

```tsx
import { InstantSearch, SearchBox, Hits } from "react-instantsearch";

const searchClient = {
  search(requests) {
    return fetch("https://api.localhost/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests }),
    }).then(res => res.json());
  },
};

function App() {
  return (
    <InstantSearch searchClient={searchClient} indexName="products">
      <SearchBox />
      <Hits />
    </InstantSearch>
  );
}
```

## Development

```bash
# Install dependencies
pnpm install

# Start all dev servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## License

MIT
