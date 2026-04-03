import { getOverride } from "../overrides/getOverride";
import type { Overrides } from "../overrides/types";

type HitsSkeletonElements = {
  Root: "div";
  List: "div";
  Item: "div";
};

interface HitsSkeletonProps {
  count?: number;
  overrides?: Overrides<HitsSkeletonElements>;
}

export function HitsSkeleton({ count = 8, overrides }: HitsSkeletonProps) {
  const root = getOverride("div", overrides?.Root);
  const list = getOverride("div", overrides?.List);
  const item = getOverride("div", overrides?.Item);

  return (
    <root.Component {...root.resolveProps({ role: "status", "aria-label": "Loading" } as Record<string, unknown>)}>
      <list.Component {...list.resolveProps({})}>
        {Array.from({ length: count }, (_, i) => (
          <item.Component key={i} {...item.resolveProps({})}>
            <div className="animate-pulse">
              <div className="aspect-square rounded-lg bg-gray-200" />
              <div className="mt-2 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
                <div className="h-5 w-1/3 rounded bg-gray-200" />
              </div>
            </div>
          </item.Component>
        ))}
      </list.Component>
    </root.Component>
  );
}

export type { HitsSkeletonProps, HitsSkeletonElements };
