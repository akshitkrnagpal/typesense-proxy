import { useHits } from "react-instantsearch";
import type { ReactNode } from "react";
import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";

type HitsElements = {
  Root: "div";
  List: "ol";
  Item: "li";
};

interface HitsProps {
  hitComponent: (props: { hit: Record<string, unknown> }) => ReactNode;
  overrides?: Overrides<HitsElements>;
}

export function Hits({ hitComponent: HitComponent, overrides }: HitsProps) {
  const { items } = useHits();

  const root = getOverride("div", overrides?.Root);
  const list = getOverride("ol", overrides?.List);
  const item = getOverride("li", overrides?.Item);

  return (
    <root.Component {...root.resolveProps({})}>
      <list.Component {...list.resolveProps({})}>
        {items.map((hit) => (
          <item.Component key={hit.objectID} {...item.resolveProps({})}>
            <HitComponent hit={hit as Record<string, unknown>} />
          </item.Component>
        ))}
      </list.Component>
    </root.Component>
  );
}

export type { HitsProps, HitsElements };
