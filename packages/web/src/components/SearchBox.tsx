import { SearchBox as AlgoliaSearchBox } from "react-instantsearch";
import type { ComponentProps } from "react";

type SearchBoxProps = ComponentProps<typeof AlgoliaSearchBox>;

export function SearchBox(props: SearchBoxProps) {
  return (
    <AlgoliaSearchBox
      placeholder="Search..."
      autoFocus={false}
      {...props}
    />
  );
}
