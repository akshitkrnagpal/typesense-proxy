import { SearchUI } from "./SearchUI";

/**
 * Absolute URL so client fetches from `createSearchClient` hit the
 * same origin, regardless of where the page is hosted. Override with
 * `NEXT_PUBLIC_SITE_URL` when deployed.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
const SERVER_URL = `${SITE_URL}/api/tsproxy`;

/**
 * App Router renders InstantSearch client-side only.
 *
 * Why no `getServerState`: react-instantsearch's SSR primitive needs
 * `renderToString` over a tree that includes a client component
 * (InstantSearchSSRProvider). With Next.js 16 + React 19, rendering
 * a `"use client"` component *inside* a server component via
 * `renderToString` breaks — the server receives a client-module
 * reference, not a callable component, and crashes on `createContext`.
 * The Pages Router sibling example (`examples/pages-router`) shows
 * the full SSR story because getServerSideProps sits outside the RSC
 * graph and can render the tree directly.
 *
 * App Router trade-off: the first page render ships an empty shell;
 * InstantSearch then fetches results from `/api/tsproxy/api/search`
 * on mount. The shell is still server-rendered, so SEO meta and the
 * static chrome show up before JS runs.
 */
export default function Page() {
  return <SearchUI serverUrl={SERVER_URL} />;
}
