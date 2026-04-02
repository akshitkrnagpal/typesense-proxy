import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Typesense Proxy
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          A search proxy with caching, rate limiting, and ingestion queue.
          Powered by Typesense.
        </p>
        <Link
          href="/search"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Try Search Demo
        </Link>
      </main>
    </div>
  );
}
