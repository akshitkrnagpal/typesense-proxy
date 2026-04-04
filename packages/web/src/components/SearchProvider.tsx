import { useMemo, type ReactNode } from "react";
import { InstantSearch } from "react-instantsearch";
import { createSearchClient } from "@tsproxy/js";

interface SearchProviderProps {
  serverUrl: string;
  indexName: string;
  locale?: string;
  children: ReactNode;
}

export function SearchProvider({
  serverUrl,
  indexName,
  locale,
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

  return (
    <InstantSearch searchClient={searchClient as any} indexName={indexName}>
      {children}
    </InstantSearch>
  );
}
