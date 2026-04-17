import { useMemo, type ReactNode } from "react";
import {
  InstantSearch,
  InstantSearchSSRProvider,
  type InstantSearchServerState,
} from "react-instantsearch";
import { createSearchClient } from "@tsproxy/js";

interface SearchProviderProps {
  serverUrl: string;
  indexName: string;
  locale?: string;
  /**
   * Pre-rendered InstantSearch state from `getServerState`. When
   * provided, the tree is wrapped in `InstantSearchSSRProvider` so the
   * first client render matches the server HTML and no second round-
   * trip to the proxy is needed on hydration.
   */
  serverState?: InstantSearchServerState;
  children: ReactNode;
}

export function SearchProvider({
  serverUrl,
  indexName,
  locale,
  serverState,
  children,
}: SearchProviderProps) {
  const searchClient = useMemo(
    () =>
      createSearchClient({
        url: serverUrl,
        ...(locale ? { locale } : {}),
        cache: true,
      }),
    [serverUrl, locale],
  );

  const tree = (
    <InstantSearch searchClient={searchClient as any} indexName={indexName}>
      {children as any}
    </InstantSearch>
  );

  if (serverState) {
    return (
      <InstantSearchSSRProvider {...serverState}>
        {tree}
      </InstantSearchSSRProvider>
    );
  }
  return tree;
}
