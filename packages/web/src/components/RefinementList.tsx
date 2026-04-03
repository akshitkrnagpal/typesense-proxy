import { useRefinementList } from "react-instantsearch";
import type { UseRefinementListProps } from "react-instantsearch";
import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";

type RefinementListElements = {
  Root: "div";
  List: "ul";
  Item: "li";
  Label: "label";
  Checkbox: "input";
  LabelText: "span";
  Count: "span";
};

interface RefinementListProps extends UseRefinementListProps {
  overrides?: Overrides<RefinementListElements>;
}

export function RefinementList({ overrides, ...hookProps }: RefinementListProps) {
  const { items, refine, canToggleShowMore, isShowingMore, toggleShowMore } =
    useRefinementList(hookProps);

  const root = getOverride("div", overrides?.Root);
  const list = getOverride("ul", overrides?.List);
  const item = getOverride("li", overrides?.Item);
  const label = getOverride("label", overrides?.Label);
  const checkbox = getOverride("input", overrides?.Checkbox);
  const labelText = getOverride("span", overrides?.LabelText);
  const count = getOverride("span", overrides?.Count);

  return (
    <root.Component {...root.resolveProps({})}>
      <list.Component {...list.resolveProps({})}>
        {items.map((facetItem) => (
          <item.Component
            key={facetItem.value}
            {...item.resolveProps({
              "data-refined": facetItem.isRefined || undefined,
            } as Record<string, unknown>)}
          >
            <label.Component {...label.resolveProps({})}>
              <checkbox.Component
                {...checkbox.resolveProps({
                  type: "checkbox",
                  checked: facetItem.isRefined,
                  onChange: () => refine(facetItem.value),
                })}
              />
              <labelText.Component
                {...labelText.resolveProps({ children: facetItem.label })}
              />
              <count.Component
                {...count.resolveProps({ children: facetItem.count })}
              />
            </label.Component>
          </item.Component>
        ))}
      </list.Component>
      {canToggleShowMore && (
        <button type="button" onClick={toggleShowMore}>
          {isShowingMore ? "Show less" : "Show more"}
        </button>
      )}
    </root.Component>
  );
}

export type { RefinementListProps, RefinementListElements };
