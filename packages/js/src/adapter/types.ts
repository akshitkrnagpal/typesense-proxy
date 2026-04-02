/**
 * Re-export the SearchClient type from instantsearch.js for Algolia compatibility.
 * Our createSearchClient() returns this type so it can be passed directly to <InstantSearch>.
 */
export type { SearchClient } from "instantsearch.js";

export interface SearchRequest {
  indexName: string;
  params?: Record<string, unknown>;
}

export interface Hit {
  objectID: string;
  [key: string]: unknown;
}

export interface FacetValue {
  value: string;
  count: number;
  highlighted: string;
  isRefined: boolean;
}

export interface SearchResponseResult {
  hits: Hit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  exhaustiveNbHits: boolean;
  query: string;
  params: string;
  index: string;
  processingTimeMS: number;
  facets?: Record<string, Record<string, number>>;
}

export interface SearchResponse {
  results: SearchResponseResult[];
}
