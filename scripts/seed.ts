#!/usr/bin/env tsx

/**
 * Seed script — creates a products collection and inserts sample data
 * Run: pnpm seed (or tsx scripts/seed.ts)
 */

import Typesense from "typesense";

const TYPESENSE_HOST = process.env["TYPESENSE_HOST"] || "localhost";
const TYPESENSE_PORT = parseInt(process.env["TYPESENSE_PORT"] || "8108", 10);
const TYPESENSE_API_KEY = process.env["TYPESENSE_API_KEY"] || "test-api-key";

const client = new Typesense.Client({
  nodes: [{ host: TYPESENSE_HOST, port: TYPESENSE_PORT, protocol: "http" }],
  apiKey: TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 10,
});

const COLLECTION_NAME = "products";

const schema = {
  name: COLLECTION_NAME,
  fields: [
    { name: "name", type: "string" as const },
    { name: "description", type: "string" as const, optional: true },
    { name: "price", type: "float" as const },
    { name: "category", type: "string" as const, facet: true },
    { name: "brand", type: "string" as const, facet: true },
    { name: "tags", type: "string[]" as const, facet: true, optional: true },
    { name: "in_stock", type: "bool" as const, facet: true },
    { name: "rating", type: "float" as const },
    { name: "created_at", type: "int64" as const },
  ],
  default_sorting_field: "created_at",
};

const products = [
  { id: "1", name: "Wireless Headphones", description: "Premium noise-cancelling wireless headphones with 30h battery", price: 299.99, category: "Electronics", brand: "SoundMax", tags: ["audio", "wireless", "bluetooth"], in_stock: true, rating: 4.7, created_at: 1700000000 },
  { id: "2", name: "Running Shoes", description: "Lightweight running shoes with responsive cushioning", price: 129.99, category: "Footwear", brand: "SpeedFit", tags: ["running", "sports", "fitness"], in_stock: true, rating: 4.5, created_at: 1700100000 },
  { id: "3", name: "Coffee Maker", description: "Programmable drip coffee maker with thermal carafe", price: 79.99, category: "Kitchen", brand: "BrewMaster", tags: ["coffee", "appliance"], in_stock: true, rating: 4.3, created_at: 1700200000 },
  { id: "4", name: "Yoga Mat", description: "Non-slip eco-friendly yoga mat 6mm thick", price: 39.99, category: "Fitness", brand: "ZenFlow", tags: ["yoga", "fitness", "exercise"], in_stock: true, rating: 4.6, created_at: 1700300000 },
  { id: "5", name: "Mechanical Keyboard", description: "RGB mechanical keyboard with Cherry MX switches", price: 149.99, category: "Electronics", brand: "KeyCraft", tags: ["keyboard", "gaming", "mechanical"], in_stock: true, rating: 4.8, created_at: 1700400000 },
  { id: "6", name: "Hiking Backpack", description: "40L waterproof hiking backpack with rain cover", price: 89.99, category: "Outdoor", brand: "TrailBlazer", tags: ["hiking", "outdoor", "travel"], in_stock: true, rating: 4.4, created_at: 1700500000 },
  { id: "7", name: "Bluetooth Speaker", description: "Portable waterproof bluetooth speaker", price: 59.99, category: "Electronics", brand: "SoundMax", tags: ["audio", "bluetooth", "portable"], in_stock: false, rating: 4.2, created_at: 1700600000 },
  { id: "8", name: "Leather Wallet", description: "Slim bifold leather wallet with RFID blocking", price: 49.99, category: "Accessories", brand: "CraftLeather", tags: ["wallet", "leather", "accessories"], in_stock: true, rating: 4.5, created_at: 1700700000 },
  { id: "9", name: "Smart Watch", description: "Fitness tracker with heart rate monitor and GPS", price: 249.99, category: "Electronics", brand: "TechWear", tags: ["smartwatch", "fitness", "wearable"], in_stock: true, rating: 4.6, created_at: 1700800000 },
  { id: "10", name: "Cast Iron Skillet", description: "Pre-seasoned 12-inch cast iron skillet", price: 34.99, category: "Kitchen", brand: "IronChef", tags: ["cooking", "kitchen", "cast-iron"], in_stock: true, rating: 4.9, created_at: 1700900000 },
  { id: "11", name: "Desk Lamp", description: "LED desk lamp with adjustable brightness and color temperature", price: 44.99, category: "Home", brand: "LightPro", tags: ["lighting", "desk", "led"], in_stock: true, rating: 4.3, created_at: 1701000000 },
  { id: "12", name: "Water Bottle", description: "Insulated stainless steel water bottle 32oz", price: 29.99, category: "Fitness", brand: "HydroFlow", tags: ["bottle", "hydration", "fitness"], in_stock: true, rating: 4.7, created_at: 1701100000 },
  { id: "13", name: "Sunglasses", description: "Polarized UV400 sunglasses with lightweight frame", price: 69.99, category: "Accessories", brand: "SunShield", tags: ["sunglasses", "uv", "fashion"], in_stock: true, rating: 4.4, created_at: 1701200000 },
  { id: "14", name: "Camping Tent", description: "2-person waterproof dome tent with easy setup", price: 119.99, category: "Outdoor", brand: "TrailBlazer", tags: ["camping", "tent", "outdoor"], in_stock: false, rating: 4.1, created_at: 1701300000 },
  { id: "15", name: "Wireless Mouse", description: "Ergonomic wireless mouse with silent clicks", price: 39.99, category: "Electronics", brand: "KeyCraft", tags: ["mouse", "wireless", "ergonomic"], in_stock: true, rating: 4.5, created_at: 1701400000 },
];

async function seed() {
  console.log("Seeding Typesense...\n");

  // Check connection
  try {
    const health = await client.health.retrieve();
    console.log(`Connected to Typesense (health: ${health.ok ? "ok" : "not ok"})`);
  } catch (error) {
    console.error("Cannot connect to Typesense. Make sure it's running:");
    console.error("  docker compose up -d");
    process.exit(1);
  }

  // Delete existing collection if it exists
  try {
    await client.collections(COLLECTION_NAME).delete();
    console.log(`Deleted existing '${COLLECTION_NAME}' collection`);
  } catch {
    // Collection doesn't exist, that's fine
  }

  // Create collection
  await client.collections().create(schema);
  console.log(`Created '${COLLECTION_NAME}' collection (${schema.fields.length} fields)`);

  // Import documents
  const results = await client
    .collections(COLLECTION_NAME)
    .documents()
    .import(products, { action: "create" });

  const successes = results.filter((r) => r.success).length;
  const failures = results.filter((r) => !r.success).length;

  console.log(`Imported ${successes} documents (${failures} failures)`);

  // Verify
  const collection = await client.collections(COLLECTION_NAME).retrieve();
  console.log(`\nCollection '${COLLECTION_NAME}': ${(collection as any).num_documents} documents`);

  // Test search
  const searchResult = await client
    .collections(COLLECTION_NAME)
    .documents()
    .search({ q: "*", query_by: "name" });
  console.log(`Test search: found ${searchResult.found} results`);

  console.log("\nDone! You can now start the proxy:");
  console.log("  pnpm --filter @tsproxy/api dev");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
