import { useState, useCallback, useMemo } from "react";
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  Pagination,
  Stats,
  Configure,
} from "react-instantsearch";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function createSearchClient(url: string, locale?: string) {
  const resultsCache = new Map<string, any>();

  return {
    search(requests: any[]) {
      const key = JSON.stringify(requests);
      if (resultsCache.has(key)) {
        return Promise.resolve(resultsCache.get(key));
      }

      return fetch(`${url}/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(locale ? { "X-Locale": locale } : {}),
        },
        body: JSON.stringify({ requests }),
      })
        .then((res) => res.json())
        .then((results) => {
          resultsCache.set(key, results);
          return results;
        });
    },
    searchForFacetValues(requests: any[]) {
      return this.search(requests);
    },
    clearCache() {
      resultsCache.clear();
    },
  };
}

function Hit({ hit }: { hit: any }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {hit.name || hit.title || hit.objectID}
      </h3>
      {hit.description && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {hit.description}
        </p>
      )}
      {hit.price !== undefined && (
        <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          ${hit.price}
        </p>
      )}
      {hit.category && (
        <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {hit.category}
        </span>
      )}
    </article>
  );
}

const LOCALES = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
];

export default function SearchPage() {
  const [locale, setLocale] = useState("en");
  const indexName = process.env.NEXT_PUBLIC_INDEX_NAME || "products";

  const searchClient = useMemo(
    () => createSearchClient(API_URL, locale),
    [locale]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Search Demo
          </h1>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Language:
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <InstantSearch searchClient={searchClient} indexName={indexName}>
        <Configure hitsPerPage={12} />
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mb-6">
            <SearchBox
              placeholder="Search products..."
              classNames={{
                root: "w-full",
                input:
                  "w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
                submit: "hidden",
                reset: "hidden",
              }}
            />
          </div>

          <div className="mb-4">
            <Stats
              classNames={{
                root: "text-sm text-zinc-500 dark:text-zinc-400",
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <aside className="md:col-span-1">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Category
              </h2>
              <RefinementList
                attribute="category"
                classNames={{
                  root: "space-y-1",
                  item: "flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300",
                  selectedItem: "font-semibold text-zinc-900 dark:text-zinc-100",
                  count:
                    "rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800",
                  checkbox: "rounded border-zinc-300 dark:border-zinc-600",
                  label: "flex items-center gap-2 cursor-pointer",
                }}
              />
            </aside>

            <div className="md:col-span-3">
              <Hits
                hitComponent={Hit}
                classNames={{
                  root: "",
                  list: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
                }}
              />

              <div className="mt-8 flex justify-center">
                <Pagination
                  classNames={{
                    root: "flex gap-1",
                    item: "rounded px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                    selectedItem:
                      "rounded bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900",
                    link: "",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </InstantSearch>
    </div>
  );
}
