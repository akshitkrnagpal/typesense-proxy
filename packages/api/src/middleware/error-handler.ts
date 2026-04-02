import type { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
  console.error(`[Error] ${err.message}`, err.stack);

  const status = (err as Error & { status?: number }).status ??
    (err as Error & { statusCode?: number }).statusCode ??
    500;

  return c.json(
    {
      error: status === 500 ? "Internal Server Error" : err.message,
      ...(process.env["NODE_ENV"] === "development" && { stack: err.stack }),
    },
    status as 500
  );
}
