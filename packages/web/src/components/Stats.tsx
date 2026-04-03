import { useStats } from "react-instantsearch";
import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";

type StatsElements = {
  Root: "div";
  Text: "span";
};

interface StatsProps {
  overrides?: Overrides<StatsElements>;
  formatText?: (nbHits: number, processingTimeMS: number) => string;
}

export function Stats({ overrides, formatText }: StatsProps) {
  const { nbHits, processingTimeMS } = useStats();

  const root = getOverride("div", overrides?.Root);
  const text = getOverride("span", overrides?.Text);

  const content = formatText
    ? formatText(nbHits, processingTimeMS)
    : `${nbHits.toLocaleString()} results found in ${processingTimeMS}ms`;

  return (
    <root.Component {...root.resolveProps({})}>
      <text.Component {...text.resolveProps({ children: content })} />
    </root.Component>
  );
}

export type { StatsProps, StatsElements };
