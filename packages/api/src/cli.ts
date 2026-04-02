#!/usr/bin/env node

import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { serve } from "@hono/node-server";
import { createApp } from "./index.js";
import type { ProxyConfig } from "./proxy-config.js";
import { proxyConfigToConfig } from "./proxy-config.js";

const args = process.argv.slice(2);
const command = args[0] || "dev";

if (command === "--help" || command === "-h") {
  console.log(`
tsproxy - Typesense Proxy Server

Usage:
  tsproxy dev          Start in development mode (with hot reload hints)
  tsproxy start        Start in production mode
  tsproxy validate     Validate the config file
  tsproxy --help       Show this help

Options:
  --config, -c <path>  Path to config file (default: tsproxy.config.ts)
  --port, -p <port>    Override the port

Config File:
  Create a tsproxy.config.ts in your project root:

  import { defineConfig } from "@tsproxy/api";

  export default defineConfig({
    typesense: {
      host: "localhost",
      port: 8108,
      apiKey: "your-api-key",
    },
    collections: {
      products: {
        fields: {
          title: { type: "string", searchable: true },
          price: { type: "float", sortable: true },
          category: { type: "string", facet: true },
        },
        locales: ["en", "fr"],
      },
    },
  });
`);
  process.exit(0);
}

if (command === "--version" || command === "-V") {
  console.log("0.1.0");
  process.exit(0);
}

// Parse flags
let configPath: string | undefined;
let portOverride: number | undefined;

for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  if ((arg === "--config" || arg === "-c") && args[i + 1]) {
    configPath = args[++i];
  } else if ((arg === "--port" || arg === "-p") && args[i + 1]) {
    portOverride = parseInt(args[++i]!, 10);
  }
}

async function loadProxyConfig(): Promise<ProxyConfig | null> {
  const searchPaths = configPath
    ? [resolve(configPath)]
    : [
        resolve(process.cwd(), "tsproxy.config.ts"),
        resolve(process.cwd(), "tsproxy.config.js"),
        resolve(process.cwd(), "tsproxy.config.mjs"),
      ];

  for (const filePath of searchPaths) {
    if (existsSync(filePath)) {
      try {
        const fileUrl = pathToFileURL(filePath).href;
        const mod = await import(`${fileUrl}?t=${Date.now()}`);
        const config = mod.default || mod;
        console.log(`Loaded config from ${filePath}`);
        return config as ProxyConfig;
      } catch (error) {
        console.error(`Error loading config from ${filePath}:`, error);
        process.exit(1);
      }
    }
  }

  return null;
}

async function main() {
  const proxyConfig = await loadProxyConfig();

  if (command === "validate") {
    if (!proxyConfig) {
      console.error("No config file found. Create tsproxy.config.ts");
      process.exit(1);
    }
    console.log("Config is valid!");
    console.log(`Collections: ${Object.keys(proxyConfig.collections || {}).join(", ") || "(none)"}`);
    if (proxyConfig.typesense) {
      console.log(`Typesense: ${proxyConfig.typesense.protocol || "http"}://${proxyConfig.typesense.host}:${proxyConfig.typesense.port}`);
    }
    process.exit(0);
  }

  // Convert proxy config to internal config format
  const config = proxyConfig
    ? proxyConfigToConfig(proxyConfig)
    : undefined;

  if (portOverride && config) {
    config.proxy.port = portOverride;
  }

  const { app, config: finalConfig } = createApp(config, proxyConfig?.collections);
  const port = portOverride || finalConfig.proxy.port;
  const isDev = command === "dev";

  if (isDev) {
    console.log("\n  tsproxy dev server\n");
  } else {
    console.log("\n  tsproxy production server\n");
  }

  console.log(`  Typesense:  ${finalConfig.typesense.protocol}://${finalConfig.typesense.host}:${finalConfig.typesense.port}`);
  console.log(`  Cache:      TTL=${finalConfig.cache.ttl}s, max=${finalConfig.cache.maxSize}`);
  console.log(`  Queue:      concurrency=${finalConfig.queue.concurrency}, max=${finalConfig.queue.maxSize}`);
  console.log(`  Rate limit: search=${finalConfig.rateLimit.search}/min, ingest=${finalConfig.rateLimit.ingest}/min`);

  const collectionNames = Object.keys(finalConfig.collections.collections);
  if (collectionNames.length > 0) {
    console.log(`  Collections: ${collectionNames.join(", ")}`);
  }

  console.log();

  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`  Listening on http://localhost:${info.port}`);
      console.log(`  API docs:   http://localhost:${info.port}/api/docs`);
      console.log(`  Health:     http://localhost:${info.port}/api/health`);
      console.log();
    }
  );
}

main().catch((error) => {
  console.error("Failed to start:", error);
  process.exit(1);
});
