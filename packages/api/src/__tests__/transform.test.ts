import { describe, it, expect } from "vitest";
import {
  transformAlgoliaRequestToTypesense,
  transformTypesenseResponseToAlgolia,
  transformMultiSearchResponse,
  type TypesenseSearchResponse,
  type TypesenseMultiSearchResponse,
  type AlgoliaSearchRequest,
} from "../lib/transform.js";

describe("transformAlgoliaRequestToTypesense", () => {
  it("should transform a basic search request", () => {
    const request: AlgoliaSearchRequest = {
      indexName: "products",
      params: "query=shoes&hitsPerPage=10",
    };

    const result = transformAlgoliaRequestToTypesense(request, "products");

    expect(result.collection).toBe("products");
    expect(result.q).toBe("shoes");
    expect(result.per_page).toBe(10);
    expect(result.page).toBe(1); // 0-based -> 1-based
  });

  it("should use resolved collection name", () => {
    const request: AlgoliaSearchRequest = {
      indexName: "products",
      params: "query=shoes",
    };

    const result = transformAlgoliaRequestToTypesense(request, "products_fr");
    expect(result.collection).toBe("products_fr");
  });

  it("should handle empty query as wildcard", () => {
    const request: AlgoliaSearchRequest = {
      indexName: "products",
      params: "",
    };

    const result = transformAlgoliaRequestToTypesense(request, "products");
    expect(result.q).toBe("*");
  });

  it("should convert page from 0-based to 1-based", () => {
    const request: AlgoliaSearchRequest = {
      indexName: "products",
      params: "query=test&page=3",
    };

    const result = transformAlgoliaRequestToTypesense(request, "products");
    expect(result.page).toBe(4);
  });

  it("should parse facets", () => {
    const request: AlgoliaSearchRequest = {
      indexName: "products",
      params: 'query=test&facets=%5B%22category%22%2C%22brand%22%5D',
    };

    const result = transformAlgoliaRequestToTypesense(request, "products");
    expect(result.facet_by).toBe("category,brand");
  });

  it("should transform facet filters", () => {
    const facetFilters = JSON.stringify(["category:Electronics", ["brand:Nike", "brand:Adidas"]]);
    const params = `query=test&facetFilters=${encodeURIComponent(facetFilters)}`;
    const request: AlgoliaSearchRequest = { indexName: "products", params };

    const result = transformAlgoliaRequestToTypesense(request, "products");
    expect(result.filter_by).toContain("category:=Electronics");
    expect(result.filter_by).toContain("brand:=Nike");
    expect(result.filter_by).toContain("brand:=Adidas");
    expect(result.filter_by).toContain("||");
  });

  it("should handle maxValuesPerFacet", () => {
    const request: AlgoliaSearchRequest = {
      indexName: "products",
      params: "query=test&maxValuesPerFacet=50",
    };

    const result = transformAlgoliaRequestToTypesense(request, "products");
    expect(result.max_facet_values).toBe(50);
  });

  it("should set highlight tags", () => {
    const request: AlgoliaSearchRequest = {
      indexName: "products",
      params: "query=test",
    };

    const result = transformAlgoliaRequestToTypesense(request, "products");
    expect(result.highlight_start_tag).toBe("<mark>");
    expect(result.highlight_end_tag).toBe("</mark>");
  });
});

describe("transformTypesenseResponseToAlgolia", () => {
  const baseRequest: AlgoliaSearchRequest = {
    indexName: "products",
    params: "query=shoes&hitsPerPage=10&page=0",
  };

  it("should transform a basic response", () => {
    const tsResponse: TypesenseSearchResponse = {
      found: 100,
      search_time_ms: 5,
      hits: [
        {
          document: { id: "1", name: "Running Shoes", price: 99.99 },
          highlights: [
            {
              field: "name",
              snippet: "Running <mark>Shoes</mark>",
              matched_tokens: ["Shoes"],
            },
          ],
        },
      ],
    };

    const result = transformTypesenseResponseToAlgolia(tsResponse, baseRequest);

    expect(result.nbHits).toBe(100);
    expect(result.page).toBe(0);
    expect(result.hitsPerPage).toBe(10);
    expect(result.nbPages).toBe(10);
    expect(result.processingTimeMS).toBe(5);
    expect(result.query).toBe("shoes");
    expect(result.exhaustiveNbHits).toBe(true);
  });

  it("should transform hits with objectID", () => {
    const tsResponse: TypesenseSearchResponse = {
      found: 1,
      search_time_ms: 2,
      hits: [
        {
          document: { id: "42", name: "Widget", color: "blue" },
          highlights: [],
        },
      ],
    };

    const result = transformTypesenseResponseToAlgolia(tsResponse, baseRequest);
    const hit = result.hits[0]!;

    expect(hit.objectID).toBe("42");
    expect(hit["name"]).toBe("Widget");
    expect(hit["color"]).toBe("blue");
  });

  it("should transform highlights to _highlightResult", () => {
    const tsResponse: TypesenseSearchResponse = {
      found: 1,
      search_time_ms: 1,
      hits: [
        {
          document: { id: "1", title: "Red Shoes", description: "Great shoes" },
          highlights: [
            {
              field: "title",
              snippet: "Red <mark>Shoes</mark>",
              matched_tokens: ["Shoes"],
            },
          ],
        },
      ],
    };

    const result = transformTypesenseResponseToAlgolia(tsResponse, baseRequest);
    const highlight = result.hits[0]!._highlightResult;

    expect(highlight["title"]!.value).toBe("Red <mark>Shoes</mark>");
    expect(highlight["title"]!.matchLevel).toBe("full");
    expect(highlight["title"]!.matchedWords).toEqual(["Shoes"]);

    // Non-highlighted fields should have matchLevel "none"
    expect(highlight["description"]!.matchLevel).toBe("none");
    expect(highlight["description"]!.matchedWords).toEqual([]);
  });

  it("should transform facet counts", () => {
    const tsResponse: TypesenseSearchResponse = {
      found: 100,
      search_time_ms: 3,
      hits: [],
      facet_counts: [
        {
          field_name: "category",
          counts: [
            { value: "Electronics", count: 50 },
            { value: "Books", count: 30 },
          ],
        },
        {
          field_name: "price",
          counts: [
            { value: "0-50", count: 20 },
          ],
          stats: { min: 5, max: 500, avg: 75, sum: 15000 },
        },
      ],
    };

    const result = transformTypesenseResponseToAlgolia(tsResponse, baseRequest);

    expect(result.facets["category"]).toEqual({
      Electronics: 50,
      Books: 30,
    });
    expect(result.facets["price"]).toEqual({ "0-50": 20 });
    expect(result.facets_stats["price"]).toEqual({
      min: 5,
      max: 500,
      avg: 75,
      sum: 15000,
    });
  });

  it("should handle empty hits", () => {
    const tsResponse: TypesenseSearchResponse = {
      found: 0,
      search_time_ms: 1,
      hits: [],
    };

    const result = transformTypesenseResponseToAlgolia(tsResponse, baseRequest);
    expect(result.hits).toEqual([]);
    expect(result.nbHits).toBe(0);
    expect(result.nbPages).toBe(0);
  });

  it("should handle missing highlights gracefully", () => {
    const tsResponse: TypesenseSearchResponse = {
      found: 1,
      search_time_ms: 1,
      hits: [
        {
          document: { id: "1", name: "Test" },
        },
      ],
    };

    const result = transformTypesenseResponseToAlgolia(tsResponse, baseRequest);
    const hit = result.hits[0]!;
    expect(hit._highlightResult).toBeDefined();
    expect(hit._highlightResult["name"]!.matchLevel).toBe("none");
  });

  it("should calculate nbPages correctly", () => {
    const tsResponse: TypesenseSearchResponse = {
      found: 25,
      search_time_ms: 1,
      hits: [],
    };

    const result = transformTypesenseResponseToAlgolia(tsResponse, baseRequest);
    expect(result.nbPages).toBe(3); // ceil(25/10) = 3
  });
});

describe("transformMultiSearchResponse", () => {
  it("should transform multiple search results", () => {
    const tsResponse: TypesenseMultiSearchResponse = {
      results: [
        {
          found: 10,
          search_time_ms: 2,
          hits: [{ document: { id: "1", name: "A" }, highlights: [] }],
        },
        {
          found: 5,
          search_time_ms: 3,
          hits: [{ document: { id: "2", name: "B" }, highlights: [] }],
        },
      ],
    };

    const requests: AlgoliaSearchRequest[] = [
      { indexName: "products", params: "query=test&hitsPerPage=10" },
      { indexName: "articles", params: "query=news&hitsPerPage=20" },
    ];

    const result = transformMultiSearchResponse(tsResponse, requests);

    expect(result.results).toHaveLength(2);
    expect(result.results[0]!.nbHits).toBe(10);
    expect(result.results[0]!.query).toBe("test");
    expect(result.results[1]!.nbHits).toBe(5);
    expect(result.results[1]!.query).toBe("news");
  });
});
