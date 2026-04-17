# tsproxy example: Next.js App Router (embedded)

A faceted marketplace search UI powered by an embedded `@tsproxy/api`
route handler. Next.js 16 + Tailwind v4, App Router, no separate
proxy server.

## What it exercises

- `@tsproxy/api/nextjs` `createAppRouterHandler` mounted at
  `/api/tsproxy/[[...path]]`.
- `@tsproxy/react` SearchProvider + SearchBox + RefinementList (×3) +
  Pagination + Stats + SortBy + NoResults, styled with Tailwind v4.
- Shared `tsproxy.config.ts` consumed by the route handler and the
  `pnpm seed` script.

## Rendering model

**Client-side only.** The RSC at `app/page.tsx` renders the static
shell (header, sidebar chrome) on the server and hands off to the
client `SearchUI` for the search tree.

> **Why not full SSR?** `getServerState` from react-instantsearch
> wants to `renderToString` a tree that contains a `"use client"`
> component. Next.js 16 + React 19 resolves that element to a
> client-module reference before the server can render it, and the
> call crashes on `createContext`. The Pages Router sibling example
> (`examples/pages-router`) ships full SSR because
> `getServerSideProps` renders outside the RSC graph. If you need
> SSR on App Router, use that pattern or fetch the initial results
> directly from a server component and hand them to the client as
> props.

## Prerequisites

Run a Typesense instance. From the repo root:

    docker compose up -d

That brings up Typesense on `localhost:8108` with API key
`test-api-key` (matches the default in `tsproxy.config.ts`).

## Run

    pnpm install         # from the monorepo root
    pnpm dev             # from this example — starts on :3001
    pnpm seed            # second terminal, one-shot

Open <http://localhost:3001>. If you set `NEXT_PUBLIC_SITE_URL` in
your env (e.g. a Vercel deployment URL), the client uses that for
the proxy base.

## Files worth reading

- `tsproxy.config.ts` — collection schema + cache / rate-limit config.
- `app/api/tsproxy/[[...path]]/route.ts` — the embedded handler.
- `app/SearchUI.tsx` — the client InstantSearch tree.
- `scripts/seed.ts` — one-shot bulk import against the ingest endpoint.
