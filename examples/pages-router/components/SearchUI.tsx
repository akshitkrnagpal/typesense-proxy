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
import { Configure } from "react-instantsearch";
import type { InstantSearchServerState } from "react-instantsearch";

const INDEX_NAME = "products";

interface Props {
  serverUrl: string;
  serverState?: InstantSearchServerState;
}

function Hit({ hit }: { hit: Record<string, unknown> }) {
  const name = String(hit.name ?? "");
  const brand = hit.brand ? String(hit.brand) : null;
  const price = typeof hit.price === "number" ? hit.price : Number(hit.price);
  const color = String(hit.color ?? "").toLowerCase();

  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-sm">
      <div className="flex aspect-square items-center justify-center rounded-lg bg-neutral-100 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {color || "—"}
      </div>
      <div className="flex min-h-[2.5rem] flex-col">
        <span className="text-sm font-semibold leading-tight text-foreground">
          {name}
        </span>
        {brand ? <span className="text-xs text-muted">{brand}</span> : null}
      </div>
      <div className="mt-auto flex items-center justify-between">
        <span className="text-sm font-semibold">${price.toFixed(2)}</span>
        {hit.in_stock === false ? (
          <span className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-orange-700">
            Out of stock
          </span>
        ) : null}
      </div>
    </div>
  );
}

const refinementListProps = {
  overrides: {
    List: { props: { className: "space-y-2" } },
    Label: {
      props: {
        className: "flex items-center gap-2 cursor-pointer text-sm text-foreground hover:text-black",
      },
    },
    Checkbox: {
      props: { className: "h-4 w-4 rounded border-border accent-black" },
    },
    Count: { props: { className: "ml-auto text-xs text-muted" } },
  },
} as const;

export function SearchUI({ serverUrl, serverState }: Props) {
  return (
    <SearchProvider
      serverUrl={serverUrl}
      indexName={INDEX_NAME}
      serverState={serverState}
    >
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 flex flex-wrap items-center gap-4 border-b border-border pb-6">
          <div className="text-lg font-semibold tracking-tight">Marketplace</div>
          <div className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Pages Router · SSR · embedded tsproxy
          </div>
          <div className="flex-1 min-w-[200px]">
            <SearchBox
              placeholder="Search products..."
              overrides={{
                Input: {
                  props: {
                    className:
                      "w-full h-11 rounded-lg border border-border bg-surface px-4 text-sm outline-none focus:border-foreground",
                  },
                },
                SubmitButton: { props: { hidden: true } },
                ResetButton: { props: { hidden: true } },
              }}
            />
          </div>
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
