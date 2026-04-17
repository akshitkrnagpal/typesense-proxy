import { useEffect, useState, useRef } from "react";
import {
  SearchProvider,
  SearchBox,
  Hits,
  RefinementList,
  Pagination,
  Stats,
  SortBy,
  NoResults,
} from "@tsproxy/react";
import type { SearchClient } from "@tsproxy/js";
import { Configure, useSearchBox, useInstantSearch } from "react-instantsearch";
import type { InstantSearchServerState } from "react-instantsearch";

const INDEX_NAME = "products";

interface Props {
  /** Relative/absolute URL for the browser's InstantSearch client. */
  serverUrl?: string;
  /**
   * Pre-built searchClient (used during SSR to invoke the Hono app
   * in-process instead of fetching localhost). Mutually exclusive
   * with `serverUrl`.
   */
  searchClient?: SearchClient;
  serverState?: InstantSearchServerState;
}

interface Suggestion {
  objectID: string;
  query: string;
  highlight: string;
}

function Hit({ hit }: { hit: Record<string, unknown> }) {
  const name = String(hit.name ?? "");
  const brand = hit.brand ? String(hit.brand) : null;
  const price = typeof hit.price === "number" ? hit.price : Number(hit.price);
  const color = String(hit.color ?? "").toLowerCase();
  const hitId = String(hit.objectID ?? hit.id ?? "");

  const handleClick = () => {
    // Fire analytics click for the tsproxy analytics endpoint. The
    // proxy aggregates click-throughs so `/api/analytics/popular` can
    // surface the hits users actually open.
    void fetch("/api/tsproxy/api/analytics/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collection: INDEX_NAME,
        objectID: hitId,
        position: Number(hit.__position ?? 0),
      }),
    }).catch(() => {
      /* swallow — analytics are best-effort. */
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Fire analytics conversion when someone "buys". In a real
    // marketplace this would be hooked to the order-created event.
    void fetch("/api/tsproxy/api/analytics/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collection: INDEX_NAME,
        objectID: hitId,
        value: price,
      }),
    }).catch(() => {});
  };

  return (
    <div
      className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-sm"
      onClick={handleClick}
    >
      <div className="flex aspect-square items-center justify-center rounded-lg bg-neutral-100 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {color || "—"}
      </div>
      <div className="flex min-h-[2.5rem] flex-col">
        <span className="text-sm font-semibold leading-tight text-foreground">
          {name}
        </span>
        {brand ? <span className="text-xs text-muted">{brand}</span> : null}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">${price.toFixed(2)}</span>
        {hit.in_stock === false ? (
          <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-orange-700">
            Out of stock
          </span>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium uppercase tracking-wide hover:border-foreground"
          >
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
}

const refinementListProps = {
  overrides: {
    List: { props: { className: "space-y-2" } },
    Label: {
      props: {
        className:
          "flex items-center gap-2 cursor-pointer text-sm text-foreground hover:text-black",
      },
    },
    Checkbox: {
      props: { className: "h-4 w-4 rounded border-border accent-black" },
    },
    Count: { props: { className: "ml-auto text-xs text-muted" } },
  },
} as const;

/**
 * Fused search input: a normal SearchBox bound to InstantSearch plus
 * a suggestion dropdown that hits /api/suggestions. Picking a
 * suggestion refines InstantSearch's query, so the dropdown drives
 * the same result set as typing manually.
 */
function SmartSearchBox({ serverUrl }: { serverUrl: string }) {
  const { query, refine } = useSearchBox();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${serverUrl}/api/suggestions?q=${encodeURIComponent(query)}&collection=${INDEX_NAME}&limit=5`,
        );
        if (!res.ok) return;
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setOpen((data.suggestions ?? []).length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 180);
    return () => clearTimeout(timerRef.current);
  }, [query, serverUrl]);

  return (
    <div className="relative flex-1 min-w-[200px]">
      <SearchBox
        placeholder="Search products..."
        overrides={{
          Input: {
            props: {
              className:
                "w-full h-11 rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-foreground",
              onFocus: () => setOpen(suggestions.length > 0),
              onBlur: () => setTimeout(() => setOpen(false), 120),
            },
          },
          SubmitButton: { props: { hidden: true } },
          ResetButton: { props: { hidden: true } },
        }}
      />
      {open ? (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-surface shadow-sm">
          {suggestions.map((s) => (
            <li key={s.objectID}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  refine(s.query);
                  setOpen(false);
                }}
                className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-neutral-100"
                dangerouslySetInnerHTML={{ __html: s.highlight }}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RefreshIndicator() {
  const { status } = useInstantSearch();
  if (status === "idle") return null;
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
      {status === "loading" || status === "stalled" ? "…" : ""}
    </span>
  );
}

export function SearchUI({ serverUrl, searchClient, serverState }: Props) {
  // SearchProvider wants one or the other. Pick based on what was
  // passed in — the server render sends `searchClient`, the client
  // render sends `serverUrl`.
  const provider =
    searchClient !== undefined
      ? {
          searchClient,
          indexName: INDEX_NAME,
          serverState,
        }
      : {
          serverUrl: serverUrl!,
          indexName: INDEX_NAME,
          serverState,
        };

  return (
    <SearchProvider {...(provider as Parameters<typeof SearchProvider>[0])}>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex flex-wrap items-center gap-4 border-b border-border pb-6">
          <div className="text-lg font-semibold tracking-tight">Marketplace</div>
          <div className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Pages Router · SSR · embedded tsproxy
          </div>
          <SmartSearchBox serverUrl={serverUrl ?? "/api/tsproxy"} />
          <RefreshIndicator />
        </header>

        <Configure hitsPerPage={8} />

        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <aside className="space-y-6">
            <section>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                Category
              </h3>
              <RefinementList attribute="category" {...refinementListProps} />
            </section>
            <section>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                Brand
              </h3>
              <RefinementList attribute="brand" {...refinementListProps} />
            </section>
            <section>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                Color
              </h3>
              <RefinementList attribute="color" {...refinementListProps} />
            </section>
            <section>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                Try it
              </h3>
              <ul className="space-y-1 text-xs text-muted">
                <li><span className="font-mono">sweatshirt</span> → synonym for hoodie</li>
                <li><span className="font-mono">light</span> → synonym for lamp</li>
                <li><span className="font-mono">linen</span> → curation pins blanket</li>
              </ul>
            </section>
          </aside>

          <main>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Stats
                overrides={{
                  Text: { props: { className: "text-sm text-muted" } },
                }}
                formatText={(n) => `${n.toLocaleString()} products`}
              />
              <SortBy
                items={[
                  { value: INDEX_NAME, label: "Relevance" },
                  { value: `${INDEX_NAME}/sort/price:asc`, label: "Price low to high" },
                  { value: `${INDEX_NAME}/sort/price:desc`, label: "Price high to low" },
                  { value: `${INDEX_NAME}/sort/rating:desc`, label: "Top rated" },
                ]}
                overrides={{
                  Select: {
                    props: {
                      className:
                        "rounded-lg border border-border bg-surface px-3 py-2 text-sm",
                    },
                  },
                }}
              />
            </div>

            <NoResults
              overrides={{
                Root: {
                  props: {
                    className:
                      "rounded-xl border border-dashed border-border p-12 text-center text-muted",
                  },
                },
              }}
            />
            <Hits
              hitComponent={Hit}
              overrides={{
                List: {
                  props: {
                    className:
                      "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
                  },
                },
              }}
            />
            <Pagination
              overrides={{
                List: {
                  props: {
                    className: "mt-6 flex flex-wrap items-center justify-center gap-1",
                  },
                },
                Item: { props: { className: "text-sm" } },
                Link: {
                  props: {
                    className:
                      "inline-flex min-w-8 justify-center rounded-md border border-border bg-surface px-3 py-1.5 hover:border-foreground",
                  },
                },
              }}
            />
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
