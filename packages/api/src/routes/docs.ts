import { Hono } from "hono";

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Typesense Proxy API",
    description: "A proxy server for Typesense with Algolia-compatible search, caching, rate limiting, and ingestion queue.",
    version: "0.1.0",
  },
  paths: {
    "/api/search": {
      post: {
        summary: "Multi-search (Algolia-compatible)",
        description: "Accepts Algolia InstantSearch multi-search format, transforms to Typesense, and returns Algolia-formatted results.",
        tags: ["Search"],
        parameters: [
          {
            name: "X-Locale",
            in: "header",
            description: "Locale for multilingual collection routing",
            schema: { type: "string" },
          },
          {
            name: "locale",
            in: "query",
            description: "Locale for multilingual collection routing (alternative to header)",
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["requests"],
                properties: {
                  requests: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["indexName", "params"],
                      properties: {
                        indexName: { type: "string", description: "Collection/index name" },
                        params: { type: "string", description: "URL-encoded search parameters" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Algolia-formatted search results" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/ingest/{collection}/documents": {
      post: {
        summary: "Upsert a single document",
        tags: ["Ingest"],
        security: [{ apiKey: [] }],
        parameters: [
          { name: "collection", in: "path", required: true, schema: { type: "string" } },
          { name: "X-Locale", in: "header", schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "201": { description: "Document upserted" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit or queue full" },
        },
      },
      delete: {
        summary: "Delete documents by filter",
        tags: ["Ingest"],
        security: [{ apiKey: [] }],
        parameters: [
          { name: "collection", in: "path", required: true, schema: { type: "string" } },
          { name: "filter_by", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Documents deleted" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/ingest/{collection}/documents/import": {
      post: {
        summary: "Bulk import documents",
        tags: ["Ingest"],
        security: [{ apiKey: [] }],
        parameters: [
          { name: "collection", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
        },
        responses: {
          "200": { description: "Import results" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/ingest/{collection}/documents/{id}": {
      patch: {
        summary: "Partial update a document",
        tags: ["Ingest"],
        security: [{ apiKey: [] }],
        parameters: [
          { name: "collection", in: "path", required: true, schema: { type: "string" } },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } },
        },
        responses: {
          "200": { description: "Document updated" },
          "401": { description: "Unauthorized" },
        },
      },
      delete: {
        summary: "Delete a single document",
        tags: ["Ingest"],
        security: [{ apiKey: [] }],
        parameters: [
          { name: "collection", in: "path", required: true, schema: { type: "string" } },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Document deleted" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/ingest/queue/status": {
      get: {
        summary: "Get ingestion queue status",
        tags: ["Ingest"],
        security: [{ apiKey: [] }],
        responses: {
          "200": { description: "Queue statistics" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/health": {
      get: {
        summary: "Health check",
        tags: ["System"],
        responses: {
          "200": { description: "System healthy" },
          "503": { description: "System degraded" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
    },
  },
};

export function createDocsRoutes() {
  const app = new Hono();

  app.get("/api/openapi.json", (c) => {
    return c.json(OPENAPI_SPEC);
  });

  app.get("/api/docs", (c) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Typesense Proxy API - Documentation</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <script id="api-reference" data-url="/api/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;
    return c.html(html);
  });

  return app;
}
