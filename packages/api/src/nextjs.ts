/**
 * Next.js adapter for tsproxy.
 *
 * Embeds the Hono proxy server inside Next.js API routes.
 * Supports both App Router (route.ts) and Pages Router (pages/api).
 *
 * App Router usage (app/api/[...path]/route.ts):
 *
 *   import { createAppRouterHandler } from "@tsproxy/api/nextjs";
 *   const { GET, POST, PUT, DELETE, PATCH } = createAppRouterHandler();
 *   export { GET, POST, PUT, DELETE, PATCH };
 *
 * Pages Router usage (pages/api/[...path].ts):
 *
 *   import { createPagesRouterHandler } from "@tsproxy/api/nextjs";
 *   export default createPagesRouterHandler();
 */

import { createApp } from "./index.js";
import type { Config } from "./config.js";
import type { CollectionDefinition } from "./proxy-config.js";

interface HandlerOptions {
  /** Override the auto-loaded config. */
  config?: Config;
  /** Collection definitions for schema-aware features. */
  collections?: Record<string, CollectionDefinition>;
  /**
   * Base path to strip from incoming requests before passing to Hono.
   * For example, if your catch-all is at /api/proxy/[...path], set
   * basePath to "/api/proxy" so Hono sees routes starting at "/".
   */
  basePath?: string;
}

/**
 * Creates route handlers for Next.js App Router (route.ts).
 *
 * Returns named exports for each HTTP method.
 */
export function createAppRouterHandler(options?: HandlerOptions) {
  const { app } = createApp(options?.config, options?.collections);
  const basePath = options?.basePath ?? "";

  async function handler(req: Request): Promise<Response> {
    if (basePath) {
      const url = new URL(req.url);
      const newPath = url.pathname.startsWith(basePath)
        ? url.pathname.slice(basePath.length) || "/"
        : url.pathname;
      const newUrl = new URL(newPath + url.search, url.origin);
      req = new Request(newUrl.toString(), {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
    }
    return app.fetch(req);
  }

  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    PATCH: handler,
  };
}

/**
 * Creates an InstantSearch-compatible searchClient that dispatches
 * directly to the embedded Hono app (no HTTP round-trip). Use this
 * in `getServerSideProps` / RSC contexts so the server doesn't have
 * to fetch localhost back at itself — a pattern that deadlocks some
 * hosts and doubles the latency of a cold request.
 *
 * The returned client matches the shape of `createSearchClient`
 * from `@tsproxy/js`, so it can be passed straight into
 * `<SearchProvider searchClient={...}>` or a bare `<InstantSearch>`.
 */
export function createInProcessSearchClient(
  options?: HandlerOptions & { locale?: string },
) {
  const { app } = createApp(options?.config, options?.collections);
  const locale = options?.locale;

  async function performSearch(requests: unknown[]): Promise<unknown> {
    const res = await app.fetch(
      new Request("http://tsproxy.internal/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(locale ? { "X-Locale": locale } : {}),
        },
        body: JSON.stringify({ requests }),
      }),
    );
    if (!res.ok) {
      throw new Error(
        `In-process search failed: ${res.status} ${res.statusText}`,
      );
    }
    return res.json();
  }

  // Matches the shape of @tsproxy/js createSearchClient. We can't
  // import the SearchClient type here without pulling @tsproxy/js
  // into api's dependency graph (tsup's DTS build resolves deps
  // strictly). The consumer (@tsproxy/react SearchProvider) already
  // types the prop as SearchClient and casts internally.
  return {
    search: performSearch,
    searchForFacetValues: performSearch,
    clearCache: () => {},
  };
}

/**
 * Creates a handler for Next.js Pages Router (pages/api/[...path].ts).
 *
 * Converts the Node.js IncomingMessage/ServerResponse into a fetch
 * Request/Response pair that Hono understands.
 */
export function createPagesRouterHandler(options?: HandlerOptions) {
  const { app } = createApp(options?.config, options?.collections);
  const basePath = options?.basePath ?? "";

  return async function handler(
    req: import("http").IncomingMessage,
    res: import("http").ServerResponse,
  ): Promise<void> {
    const protocol = (req.headers["x-forwarded-proto"] as string) ?? "http";
    const host = req.headers.host ?? "localhost:3000";
    let pathname = req.url ?? "/";

    if (basePath && pathname.startsWith(basePath)) {
      pathname = pathname.slice(basePath.length) || "/";
    }

    const url = `${protocol}://${host}${pathname}`;

    // Read body for non-GET/HEAD requests
    let body: BodyInit | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          for (const v of value) headers.append(key, v);
        } else {
          headers.set(key, value);
        }
      }
    }

    const fetchReq = new Request(url, {
      method: req.method ?? "GET",
      headers,
      body,
    });

    const fetchRes = await app.fetch(fetchReq);

    res.statusCode = fetchRes.status;
    fetchRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const resBody = await fetchRes.arrayBuffer();
    res.end(Buffer.from(resBody));
  };
}
