import { Hono } from "hono";
import type { Config } from "../config.js";
import { getTypesenseClient } from "../lib/typesense.js";

export function createHealthRoutes(config: Config) {
  const app = new Hono();
  const typesense = getTypesenseClient(config);

  app.get("/api/health", async (c) => {
    let typesenseStatus: "ok" | "error" = "error";
    let typesenseMessage = "";

    try {
      const health = (await typesense.health.retrieve()) as { ok: boolean };
      typesenseStatus = health.ok ? "ok" : "error";
    } catch (err) {
      typesenseMessage = err instanceof Error ? err.message : "Unknown error";
    }

    const status = typesenseStatus === "ok" ? 200 : 503;

    return c.json(
      {
        status: typesenseStatus === "ok" ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        proxy: { status: "ok" },
        typesense: {
          status: typesenseStatus,
          host: `${config.typesense.protocol}://${config.typesense.host}:${config.typesense.port}`,
          ...(typesenseMessage && { error: typesenseMessage }),
        },
      },
      status as 200
    );
  });

  return app;
}
