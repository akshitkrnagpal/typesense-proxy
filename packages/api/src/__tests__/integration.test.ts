import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "typesense";
import { createApp, type Config } from "../index.js";
import { resetClient } from "../lib/typesense.js";

const TYPESENSE_API_KEY = "test-api-key";
const PROXY_API_KEY = "test-ingest-key";
const COLLECTION_NAME = "products";

const config: Config = {
  typesense: {
    host: "localhost",
    port: 8108,
    protocol: "http",
    apiKey: TYPESENSE_API_KEY,
  },
  proxy: {
    port: 3000,
    apiKey: PROXY_API_KEY,
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
    ingest: 100,
  },
  collections: { collections: {} },
};

// Direct Typesense client for setup/teardown
const tsClient = new Client({
  nodes: [{ host: "localhost", port: 8108, protocol: "http" }],
  apiKey: TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 5,
});

let app: ReturnType<typeof createApp>["app"];

beforeAll(async () => {
  // Reset the singleton so our test config is picked up
  resetClient();

  const result = createApp(config);
  app = result.app;

  // Drop collection if it exists, then create fresh
  try {
    await tsClient.collections(COLLECTION_NAME).delete();
  } catch {
    // ignore — collection may not exist
  }

  await tsClient.collections().create({
    name: COLLECTION_NAME,
    fields: [
      { name: "name", type: "string" },
      { name: "price", type: "float" },
      { name: "category", type: "string", facet: true },
    ],
  });

  // Seed some documents for search tests
  await tsClient
    .collections(COLLECTION_NAME)
    .documents()
    .import(
      [
        { id: "1", name: "Laptop", price: 999.99, category: "Electronics" },
        { id: "2", name: "Phone", price: 699.99, category: "Electronics" },
        { id: "3", name: "Desk", price: 249.99, category: "Furniture" },
      ],
      { action: "upsert" },
    );
});

afterAll(async () => {
  try {
    await tsClient.collections(COLLECTION_NAME).delete();
  } catch {
    // ignore
  }
  resetClient();
});

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
describe("Health endpoint", () => {
  it("GET /api/health returns 200 with healthy status", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.proxy.status).toBe("ok");
    expect(body.typesense.status).toBe("ok");
  });
});

// ---------------------------------------------------------------------------
// Ingest — auth
// ---------------------------------------------------------------------------
describe("Ingest auth", () => {
  it("POST without X-API-Key returns 401", async () => {
    const res = await app.request("/api/ingest/products/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "auth-1", name: "Test", price: 1, category: "Test" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST with wrong X-API-Key returns 401", async () => {
    const res = await app.request("/api/ingest/products/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": "wrong-key",
      },
      body: JSON.stringify({ id: "auth-2", name: "Test", price: 1, category: "Test" }),
    });
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Ingest — CRUD
// ---------------------------------------------------------------------------
describe("Ingest endpoints", () => {
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": PROXY_API_KEY,
  };

  it("POST /api/ingest/products/documents — upsert a single document", async () => {
    const doc = { id: "100", name: "Widget", price: 9.99, category: "Gadgets" };
    const res = await app.request("/api/ingest/products/documents", {
      method: "POST",
      headers,
      body: JSON.stringify(doc),
    });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.id).toBe("100");
    expect(body.name).toBe("Widget");
  });

  it("POST /api/ingest/products/documents/import — bulk import", async () => {
    const docs = [
      { id: "200", name: "Bolt", price: 0.5, category: "Hardware" },
      { id: "201", name: "Nut", price: 0.25, category: "Hardware" },
    ];
    const res = await app.request("/api/ingest/products/documents/import", {
      method: "POST",
      headers,
      body: JSON.stringify(docs),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
  });

  it("PATCH /api/ingest/products/documents/:id — partial update", async () => {
    const res = await app.request("/api/ingest/products/documents/100", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ price: 12.99 }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.price).toBe(12.99);
  });

  it("DELETE /api/ingest/products/documents/:id — delete a document", async () => {
    const res = await app.request("/api/ingest/products/documents/100", {
      method: "DELETE",
      headers,
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe("100");
  });

  it("GET /api/ingest/queue/status — returns queue stats", async () => {
    const res = await app.request("/api/ingest/queue/status", {
      headers: { "X-API-Key": PROXY_API_KEY },
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("pending");
    expect(body).toHaveProperty("active");
    expect(body).toHaveProperty("completed");
    expect(body).toHaveProperty("failed");
    expect(body).toHaveProperty("maxSize");
    expect(body).toHaveProperty("concurrency");
  });
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
describe("Search endpoint", () => {
  it("POST /api/search returns Algolia-compatible response", async () => {
    const res = await app.request("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            indexName: COLLECTION_NAME,
            params: "query=Laptop&hitsPerPage=10&facets=%5B%22category%22%5D&restrictSearchableAttributes=%5B%22name%22%5D",
          },
        ],
      }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();

    // Top-level structure
    expect(body).toHaveProperty("results");
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBe(1);

    const result = body.results[0];

    // Required Algolia fields
    expect(result).toHaveProperty("hits");
    expect(result).toHaveProperty("nbHits");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("nbPages");
    expect(result).toHaveProperty("hitsPerPage");
    expect(result).toHaveProperty("processingTimeMS");

    // Hits have objectID
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits[0]).toHaveProperty("objectID");

    // Facets are returned correctly
    expect(result).toHaveProperty("facets");
    expect(result.facets).toHaveProperty("category");
    expect(typeof result.facets.category).toBe("object");
  });
});

// ---------------------------------------------------------------------------
// Docs
// ---------------------------------------------------------------------------
describe("Docs endpoint", () => {
  it("GET /api/docs returns HTML", async () => {
    const res = await app.request("/api/docs");
    expect(res.status).toBe(200);

    const contentType = res.headers.get("content-type") ?? "";
    expect(contentType).toContain("text/html");

    const text = await res.text();
    expect(text).toContain("<!DOCTYPE html>");
  });

  it("GET /api/openapi.json returns JSON with openapi field", async () => {
    const res = await app.request("/api/openapi.json");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("openapi");
    expect(body.openapi).toMatch(/^3\./);
  });
});
