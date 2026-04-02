import { Hono } from "hono";
import type { Config } from "../config.js";
import { resolveCollection } from "../config.js";
import { LRUCache } from "../lib/cache.js";
import {
  transformAlgoliaRequestToTypesense,
  transformMultiSearchResponse,
  type AlgoliaMultiSearchRequest,
  type TypesenseMultiSearchResponse,
} from "../lib/transform.js";
import { getTypesenseClient } from "../lib/typesense.js";

export function createSearchRoutes(config: Config) {
  const app = new Hono();
  const cache = new LRUCache({ maxSize: config.cache.maxSize, ttl: config.cache.ttl });
  const typesense = getTypesenseClient(config);

  // Rate limiting state
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = config.rateLimit.search;

  function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
      return true;
    }

    if (entry.count >= rateLimit) {
      return false;
    }

    entry.count++;
    return true;
  }

  app.post("/api/search", async (c) => {
    const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";

    if (!checkRateLimit(ip)) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }

    const body = await c.req.json<AlgoliaMultiSearchRequest>();

    if (!body.requests || !Array.isArray(body.requests)) {
      return c.json({ error: "Invalid request: 'requests' array is required" }, 400);
    }

    const locale =
      c.req.header("X-Locale") ??
      c.req.query("locale") ??
      undefined;

    // Build cache key
    const cacheKey = JSON.stringify({ requests: body.requests, locale });
    const cached = cache.get(cacheKey);
    if (cached) {
      return c.json(cached);
    }

    // Transform Algolia requests to Typesense format
    const searches = body.requests.map((req) => {
      const resolvedCollection = resolveCollection(config.collections, req.indexName, locale);
      return transformAlgoliaRequestToTypesense(req, resolvedCollection);
    });

    // Execute multi_search
    const tsResponse = (await typesense.multiSearch.perform(
      { searches },
      {}
    )) as TypesenseMultiSearchResponse;

    // Transform response back to Algolia format
    const algoliaResponse = transformMultiSearchResponse(tsResponse, body.requests);

    // Cache the response
    cache.set(cacheKey, algoliaResponse);

    return c.json(algoliaResponse);
  });

  return { app, cache };
}
