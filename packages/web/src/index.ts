// Re-export adapter from @tsproxy/js for convenience
export { createSearchClient } from "@tsproxy/js";
export type {
  SearchClient,
  SearchRequest,
  SearchResponse,
  SearchResponseResult,
  Hit,
  FacetValue,
} from "@tsproxy/js";

// Context
export { LocaleContext, LocaleProvider, useLocale } from "./context/LocaleContext.js";

// Components
export { SearchProvider } from "./components/SearchProvider.js";
export { SearchBox } from "./components/SearchBox.js";
export { Hits } from "./components/Hits.js";
export { RefinementList } from "./components/RefinementList.js";
export { Pagination } from "./components/Pagination.js";
export { Stats } from "./components/Stats.js";
export { SortBy } from "./components/SortBy.js";
export { LocaleSelector } from "./components/LocaleSelector.js";
