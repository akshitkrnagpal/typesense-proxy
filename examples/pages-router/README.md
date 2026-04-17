# tsproxy example: Next.js Pages Router (embedded, SSR)

Same marketplace UI as `../app-router`, on the Pages Router with
full server-side rendering. Next.js 16 + Tailwind v4.

## What it exercises

- `@tsproxy/api/nextjs` `createPagesRouterHandler` mounted at
  `pages/api/tsproxy/[[...path]].ts`.
- `@tsproxy/react` SearchProvider passing `serverState` through to
  `InstantSearchSSRProvider`.
- `getServerSideProps` → `getServerState` so initial HTML ships with
  hits already rendered — no "empty state flash" on first paint.
- Shared `tsproxy.config.ts` consumed by the handler and the `pnpm
  seed` script.

## Rendering model

Full SSR. `getServerSideProps` runs for every request, calls
`getServerState` from `react-instantsearch`, and hands the resulting
`serverState` to the page component as a prop. The page renders the
tree inside `SearchProvider` with that `serverState`, which wraps
the InstantSearch subtree in `InstantSearchSSRProvider`. First paint
shows the hits; hydration matches the server HTML and doesn't
re-fetch.

## Prerequisites

Run a Typesense instance. From the repo root:

    docker compose up -d

## Run

    pnpm install         # from the monorepo root
    pnpm dev             # from this example — starts on :3002
    pnpm seed            # second terminal, one-shot

Open <http://localhost:3002>. Initial HTML already contains the
first page of hits; disable JS in the devtools to see the plain
server render.

## Key differences vs `../app-router`

- Handler file: `pages/api/tsproxy/[[...path]].ts`.
- `config.api.bodyParser = false` — Next's default parser would drain
  the request stream before the adapter sees it.
- Full SSR story: getServerSideProps is outside the RSC graph, so
  `renderToString` over client components works cleanly.

## Files worth reading

- `pages/api/tsproxy/[[...path]].ts` — the embedded handler.
- `pages/index.tsx` — getServerSideProps doing the SSR dance.
- `components/SearchUI.tsx` — the InstantSearch tree (shared with
  getServerSideProps via direct JSX).
- `scripts/seed.ts` — one-shot bulk import.
