import { useSortBy } from "react-instantsearch";
import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";

type SortByElements = {
  Root: "div";
  Select: "select";
  Option: "option";
};

interface SortByItem {
  value: string;
  label: string;
}

interface SortByProps {
  items: SortByItem[];
  overrides?: Overrides<SortByElements>;
}

export function SortBy({ items, overrides }: SortByProps) {
  const { currentRefinement, refine } = useSortBy({ items });

  const root = getOverride("div", overrides?.Root);
  const select = getOverride("select", overrides?.Select);
  const option = getOverride("option", overrides?.Option);

  return (
    <root.Component {...root.resolveProps({})}>
      <select.Component
        {...select.resolveProps({
          value: currentRefinement,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
            refine(e.target.value),
          "aria-label": "Sort by",
        })}
      >
        {items.map((sortItem) => (
          <option.Component
            key={sortItem.value}
            {...option.resolveProps({
              value: sortItem.value,
              children: sortItem.label,
            })}
          />
        ))}
      </select.Component>
    </root.Component>
  );
}

export type { SortByProps, SortByElements, SortByItem };
