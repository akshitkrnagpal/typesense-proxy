import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          tsproxy
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
          A search proxy framework for Typesense with caching, rate limiting,
          ingestion queue, and headless React components.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/search"
            className="rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Try Search Demo
          </Link>
          <a
            href="https://tsproxy.akshit.io"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Documentation
          </a>
        </div>
        <div className="mt-6">
          <code className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700">
            npx @tsproxy/cli init
          </code>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Search Proxy",
                desc: "InstantSearch-compatible API with LRU cache and per-IP rate limiting.",
              },
              {
                title: "Ingestion Queue",
                desc: "BullMQ + Redis for persistent, concurrency-limited document writes.",
              },
              {
                title: "Headless React",
                desc: "Every component is overridable via BaseUI-style overrides prop.",
              },
              {
                title: "SSR Ready",
                desc: "Server-rendered search with getServerState and URL sync.",
              },
              {
                title: "CLI",
                desc: "tsproxy init, dev, migrate, seed, generate, health.",
              },
              {
                title: "Config-Driven",
                desc: "tsproxy.config.ts with collections, synonyms, curations, computed fields.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="border-t border-gray-200 px-6 py-12">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-8 text-sm text-gray-500">
          <Link href="/search" className="hover:text-gray-900">
            Search Demo
          </Link>
          <Link href="/ingest" className="hover:text-gray-900">
            Ingest Demo
          </Link>
          <a
            href="https://tsproxy.akshit.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900"
          >
            Docs
          </a>
          <a
            href="https://github.com/akshitkrnagpal/tsproxy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/org/tsproxy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900"
          >
            npm
          </a>
        </div>
      </div>
    </div>
  );
}
