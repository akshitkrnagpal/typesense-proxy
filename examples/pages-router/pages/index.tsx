import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerState } from "react-instantsearch";
import { renderToString } from "react-dom/server";
import type { InstantSearchServerState } from "react-instantsearch";
import { createInProcessSearchClient } from "@tsproxy/api/nextjs";
import { proxyConfigToConfig } from "@tsproxy/api";
import type { SearchClient } from "@tsproxy/js";
import superjson from "superjson";
import proxyConfig from "@/tsproxy.config";
import { SearchUI } from "@/components/SearchUI";

/**
 * `SERVER_URL` is only used by the *client* InstantSearch client —
 * on the server we bypass HTTP entirely via the in-process client
 * below. Override with `NEXT_PUBLIC_SITE_URL` when deployed so the
 * client fetches hit the deployed origin.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
const SERVER_URL = `${SITE_URL}/api/tsproxy`;

interface PageProps {
  /** superjson-serialized InstantSearchServerState. */
  serverState: string;
  serverUrl: string;
}

/**
 * Server-side render the InstantSearch tree to capture initial
 * results. Two choices worth flagging:
 *
 * 1. We render with an *in-process* searchClient instead of the
 *    URL-based one, so `getServerState` doesn't have to fetch
 *    localhost back at itself. Same Hono app either way — just no
 *    network hop.
 *
 * 2. The resulting `serverState` is serialized with superjson (not
 *    `JSON.parse(JSON.stringify(...))`) so Dates, Maps, and other
 *    non-JSON values survive the transport cleanly. The page
 *    component re-parses with superjson on the other side.
 */
export const getServerSideProps: GetServerSideProps<PageProps> = async () => {
  const inProcessClient = createInProcessSearchClient({
    config: proxyConfigToConfig(proxyConfig),
    collections: proxyConfig.collections,
  }) as unknown as SearchClient;

  const serverState = await getServerState(
    <SearchUI searchClient={inProcessClient} />,
    { renderToString },
  );

  return {
    props: {
      serverState: superjson.stringify(serverState),
      serverUrl: SERVER_URL,
    },
  };
};

export default function SearchPage({
  serverState,
  serverUrl,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const parsedState = superjson.parse<InstantSearchServerState>(serverState);
  return <SearchUI serverUrl={serverUrl} serverState={parsedState} />;
}
