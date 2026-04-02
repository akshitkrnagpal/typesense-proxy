import { useHits } from "react-instantsearch";
import type { Hit as AlgoliaHit } from "instantsearch.js";
import type { ReactNode } from "react";

interface HitsProps<THit extends AlgoliaHit> {
  hitComponent: (props: { hit: THit }) => ReactNode;
  classNames?: {
    root?: string;
    list?: string;
    item?: string;
  };
}

export function Hits<THit extends AlgoliaHit>({
  hitComponent: HitComponent,
  classNames,
}: HitsProps<THit>) {
  const { items } = useHits<THit>();

  return (
    <div className={classNames?.root}>
      <ol className={classNames?.list}>
        {items.map((hit) => (
          <li key={hit.objectID} className={classNames?.item}>
            <HitComponent hit={hit} />
          </li>
        ))}
      </ol>
    </div>
  );
}
