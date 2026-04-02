import type { Context, Next } from "hono";

export function authMiddleware(proxyApiKey: string) {
  return async (c: Context, next: Next) => {
    if (!proxyApiKey) {
      return c.json({ error: "Server misconfiguration: PROXY_API_KEY not set" }, 500);
    }

    const apiKey = c.req.header("X-API-Key");

    if (!apiKey) {
      return c.json({ error: "Missing X-API-Key header" }, 401);
    }

    if (apiKey !== proxyApiKey) {
      return c.json({ error: "Invalid API key" }, 401);
    }

    await next();
  };
}
