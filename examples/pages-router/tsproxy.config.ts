import { defineConfig } from "@tsproxy/api";

/**
 * Shared config for the embedded Pages Router example.
 *
 * Imported by:
 *   - pages/api/tsproxy/[[...path]].ts   (the embedded handler)
 *   - scripts/seed.ts                    (the one-shot ingest)
 *   - pages/index.tsx                    (in-process searchClient)
 *
 * Demonstrates synonyms and curations alongside the usual schema so
 * you can see how the proxy applies both transparently at query time.
 */
export default defineConfig({
  typesense: {
    host: process.env.TYPESENSE_HOST ?? "localhost",
    port: Number(process.env.TYPESENSE_PORT ?? 8108),
    protocol: (process.env.TYPESENSE_PROTOCOL as "http" | "https") ?? "http",
    apiKey: process.env.TYPESENSE_API_KEY ?? "test-api-key",
  },

  server: {
    apiKey: process.env.TSPROXY_INGEST_API_KEY ?? "ingest-secret-key",
  },

  cache: { ttl: 60, maxSize: 1000 },
  queue: { concurrency: 5, maxSize: 10000 },
  rateLimit: { search: 100, ingest: 30 },

  collections: {
    products: {
      fields: {
        name: { type: "string", searchable: true },
        description: { type: "string", searchable: true, optional: true },
        price: { type: "float", sortable: true, facet: true },
        category: { type: "string", facet: true },
        color: { type: "string", facet: true },
        brand: { type: "string", facet: true },
        tags: { type: "string[]", facet: true, optional: true },
        in_stock: { type: "bool", facet: true },
        rating: { type: "float", sortable: true },
        created_at: { type: "int64", sortable: true },
      },
      defaultSortBy: "created_at",

      // Synonyms — two-way equivalences applied at query time. Search
      // for "sweatshirt" and the hoodie shows up, and vice versa.
      synonyms: {
        hoodie_sweatshirt: {
          synonyms: ["hoodie", "sweatshirt", "pullover"],
        },
        lamp_light: {
          synonyms: ["lamp", "light"],
        },
      },

      // Curations — query-specific pin rules. When someone searches
      // for "linen" we pin the linen throw blanket to the top so it
      // always leads the results, ahead of looser keyword matches.
      curations: {
        linen_lead: {
          query: "linen",
          match: "contains",
          pinnedIds: ["4"],
        },
      },
    },
  },
});
