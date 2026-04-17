import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { getServerState } from "react-instantsearch";
import { renderToString } from "react-dom/server";
import type { InstantSearchServerState } from "react-instantsearch";
import { SearchUI } from "@/components/SearchUI";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";
const SERVER_URL = `${SITE_URL}/api/tsproxy`;

interface PageProps {
  serverState: InstantSearchServerState;
  serverUrl: string;
}

/**
 * getServerSideProps renders the whole SearchUI tree via
 * `getServerState` so InstantSearch captures the initial results.
 * JSON round-tripping strips any non-serializable bits before Next
 * hands it to the page component as a prop.
 */
export const getServerSideProps: GetServerSideProps<PageProps> = async () => {
  const serverState = await getServerState(
    <SearchUI serverUrl={SERVER_URL} />,
    { renderToString },
  );

  return {
    props: {
      serverState: JSON.parse(JSON.stringify(serverState)),
      serverUrl: SERVER_URL,
    },
  };
};

export default function SearchPage({
  serverState,
  serverUrl,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return <SearchUI serverUrl={serverUrl} serverState={serverState} />;
}
