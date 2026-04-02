import { Client } from "typesense";
import type { Config } from "../config.js";

let client: Client | null = null;

export function getTypesenseClient(config: Config): Client {
  if (!client) {
    client = new Client({
      nodes: [
        {
          host: config.typesense.host,
          port: config.typesense.port,
          protocol: config.typesense.protocol,
        },
      ],
      apiKey: config.typesense.apiKey,
      connectionTimeoutSeconds: 5,
    });
  }
  return client;
}

export function resetClient(): void {
  client = null;
}
