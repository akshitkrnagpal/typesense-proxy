import { usePagination } from "react-instantsearch";
import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";

type PaginationElements = {
  Root: "nav";
  List: "ul";
  Item: "li";
  Link: "a";
};

interface PaginationProps {
  padding?: number;
  overrides?: Overrides<PaginationElements>;
}

export function Pagination({ padding = 3, overrides }: PaginationProps) {
  const {
    pages,
    currentRefinement,
    nbPages,
    refine,
    isFirstPage,
    isLastPage,
  } = usePagination({ padding });

  const root = getOverride("nav", overrides?.Root);
  const list = getOverride("ul", overrides?.List);
  const item = getOverride("li", overrides?.Item);
  const link = getOverride("a", overrides?.Link);

  if (nbPages <= 1) return null;

  function renderItem(
    label: string,
    page: number,
    disabled: boolean,
    isCurrent = false,
  ) {
    return (
      <item.Component
        key={label}
        {...item.resolveProps({
          "data-current": isCurrent || undefined,
          "data-disabled": disabled || undefined,
        } as Record<string, unknown>)}
      >
        <link.Component
          {...link.resolveProps({
            href: "#",
            "aria-label": label,
            "aria-current": isCurrent ? "page" : undefined,
            onClick: (e: React.MouseEvent) => {
              e.preventDefault();
              if (!disabled) refine(page);
            },
            children: label,
          } as Record<string, unknown>)}
        />
      </item.Component>
    );
  }

  return (
    <root.Component {...root.resolveProps({ "aria-label": "Pagination" } as Record<string, unknown>)}>
      <list.Component {...list.resolveProps({})}>
        {renderItem("«", 0, isFirstPage)}
        {renderItem("‹", currentRefinement - 1, isFirstPage)}
        {pages.map((page) =>
          renderItem(
            String(page + 1),
            page,
            false,
            page === currentRefinement,
          ),
        )}
        {renderItem("›", currentRefinement + 1, isLastPage)}
        {renderItem("»", nbPages - 1, isLastPage)}
      </list.Component>
    </root.Component>
  );
}

export type { PaginationProps, PaginationElements };
