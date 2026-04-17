import { useMemo, type ReactNode } from "react";
import {
  InstantSearch,
  InstantSearchSSRProvider,
  type InstantSearchServerState,
} from "react-instantsearch";
import { createSearchClient, type SearchClient } from "@tsproxy/js";

interface SearchProviderPropsBase {
  indexName: string;
  locale?: string;
  /**
   * Pre-rendered InstantSearch state from `getServerState`. When
   * provided, the tree is wrapped in `InstantSearchSSRProvider` so
   * the first client render matches the server HTML and no second
   * round-trip to the proxy is needed on hydration.
   */
  serverState?: InstantSearchServerState;
  children: ReactNode;
}

interface SearchProviderWithUrlProps extends SearchProviderPropsBase {
  /** URL base for the tsproxy server. */
  serverUrl: string;
  searchClient?: never;
}

interface SearchProviderWithClientProps extends SearchProviderPropsBase {
  /**
   * Pre-built InstantSearch searchClient. Use this when you want to
   * bypass HTTP entirely — e.g. pairing with
   * `createInProcessSearchClient` from `@tsproxy/api/nextjs` in
   * `getServerSideProps` to avoid fetching localhost from itself.
   */
  searchClient: SearchClient;
  serverUrl?: never;
}

type SearchProviderProps =
  | SearchProviderWithUrlProps
  | SearchProviderWithClientProps;

export function SearchProvider(props: SearchProviderProps) {
  const { indexName, locale, serverState, children } = props;
  const providedClient = "searchClient" in props ? props.searchClient : undefined;
  const serverUrl = "serverUrl" in props ? props.serverUrl : undefined;

  const searchClient = useMemo(() => {
    if (providedClient) return providedClient;
    if (!serverUrl) {
      throw new Error(
        "SearchProvider requires either `searchClient` or `serverUrl`.",
      );
    }
    return createSearchClient({
      url: serverUrl,
      ...(locale ? { locale } : {}),
      cache: true,
    });
  }, [providedClient, serverUrl, locale]);

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
