import { defineConfig } from "@tsproxy/api";

export default defineConfig({
  typesense: {
    host: "localhost",
    port: 8108,
    protocol: "http",
    apiKey: "test-api-key",
  },

  server: {
    port: 3000,
    apiKey: "ingest-secret-key",
  },

  cache: {
    ttl: 60,
    maxSize: 1000,
  },

  queue: {
    concurrency: 5,
    maxSize: 10000,
  },

  rateLimit: {
    search: 100,
    ingest: 30,
  },

  collections: {
    products: {
      fields: {
        name: { type: "string", searchable: true },
        description: { type: "string", searchable: true, optional: true },
        price: { type: "float", sortable: true },
        category: { type: "string", facet: true },
        color: { type: "string", facet: true },
        brand: { type: "string", facet: true },
        tags: { type: "string[]", facet: true, optional: true },
        in_stock: { type: "bool", facet: true },
        rating: { type: "float", sortable: true },
        created_at: { type: "int64", sortable: true },

        // Computed field: generates a category page slug from color + category
        // Locale-aware: receives the locale so you can compute localized slugs
        // e.g., "red-furniture" (en), "rouge-meubles" (fr), "rot-möbel" (de)
        category_page_slug: {
          type: "string",
          facet: true,
          compute: (doc, locale) => {
            const color = String(doc.color || "").toLowerCase().trim();
            const category = String(doc.category || "").toLowerCase().trim();
            if (!color || !category) return "";
            return `${color}-${category}`.replace(/\s+/g, "-");
          },
        },
      },
      locales: ["en", "fr", "de"],
      defaultSortBy: "created_at",
    },
  },
});
