import { serve } from "@hono/node-server";
import { createApp } from "./index.js";

const { app, config } = createApp();

console.log(`Starting Typesense Proxy on port ${config.proxy.port}...`);
console.log(`Typesense backend: ${config.typesense.protocol}://${config.typesense.host}:${config.typesense.port}`);

serve(
  {
    fetch: app.fetch,
    port: config.proxy.port,
  },
  (info) => {
    console.log(`Proxy server listening on http://localhost:${info.port}`);
    console.log(`API docs available at http://localhost:${info.port}/api/docs`);
  }
);
