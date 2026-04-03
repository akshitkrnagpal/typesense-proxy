import { useInstantSearch } from "react-instantsearch";
import type { ReactNode } from "react";
import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";

type NoResultsElements = {
  Root: "div";
  Title: "p";
  Message: "p";
};

interface NoResultsProps {
  title?: string;
  message?: string;
  children?: ReactNode;
  overrides?: Overrides<NoResultsElements>;
}

export function NoResults({
  title = "No results found",
  message = "Try adjusting your search or filters.",
  children,
  overrides,
}: NoResultsProps) {
  const { results } = useInstantSearch();

  if (results.__isArtificial || results.nbHits > 0) {
    return null;
  }

  const root = getOverride("div", overrides?.Root);
  const titleEl = getOverride("p", overrides?.Title);
  const messageEl = getOverride("p", overrides?.Message);

  if (children) {
    return <root.Component {...root.resolveProps({})}>{children}</root.Component>;
  }

  return (
    <root.Component {...root.resolveProps({})}>
      <titleEl.Component {...titleEl.resolveProps({ children: title })} />
      <messageEl.Component {...messageEl.resolveProps({ children: message })} />
    </root.Component>
  );
}

export type { NoResultsProps, NoResultsElements };
