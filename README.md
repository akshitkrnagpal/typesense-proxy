# tsproxy

> **This project is under heavy development. APIs may change without notice.**

A search proxy framework for [Typesense](https://typesense.org) with caching, rate limiting, a BullMQ ingestion queue, and headless React components.

**[Documentation](https://tsproxy.akshit.io)** · [GitHub](https://github.com/akshitkrnagpal/tsproxy)

## Quick Start

```bash
npx @tsproxy/cli init
docker compose up -d
npx tsproxy dev
```

## Packages

| Package | Description |
|---------|-------------|
| [`@tsproxy/cli`](https://github.com/akshitkrnagpal/tsproxy/tree/main/packages/cli) | CLI — init, dev, start, migrate, seed, health |
| [`@tsproxy/api`](https://github.com/akshitkrnagpal/tsproxy/tree/main/packages/api) | HonoJS proxy server with search, ingest, caching, rate limiting |
| [`@tsproxy/js`](https://github.com/akshitkrnagpal/tsproxy/tree/main/packages/js) | InstantSearch-compatible searchClient adapter |
| [`@tsproxy/react`](https://github.com/akshitkrnagpal/tsproxy/tree/main/packages/web) | Headless React components with BaseUI-style overrides |

## Features

- **Search proxy** — InstantSearch-compatible multi-search endpoint
- **LRU cache** — configurable TTL, error-aware (never caches failures)
- **Rate limiting** — per-IP, configurable per endpoint
- **Ingestion queue** — BullMQ (Redis) with in-memory fallback
- **Computed fields** — transform documents during ingestion
- **Headless React components** — every sub-element overridable via `overrides` prop
- **SSR** — `getServerState` + `InstantSearchSSRProvider` for server-rendered search
- **URL sync** — search state syncs to URL params
- **Multilingual** — locale-aware collection routing
- **CLI** — `tsproxy init`, `tsproxy dev`, `tsproxy migrate`, `tsproxy seed`
- **Config file** — `tsproxy.config.ts` with `defineConfig`

## Development

```bash
pnpm install
docker compose up -d
pnpm seed
pnpm dev
```

## License

MIT
