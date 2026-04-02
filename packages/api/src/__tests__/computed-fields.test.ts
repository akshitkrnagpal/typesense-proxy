import { describe, it, expect } from "vitest";
import {
  applyComputedFields,
  applyComputedFieldsBatch,
  getComputedFields,
  type CollectionDefinition,
} from "../proxy-config.js";

describe("Computed Fields", () => {
  const collectionDef: CollectionDefinition = {
    fields: {
      category: { type: "string", facet: true },
      color: { type: "string", facet: true },
      price: { type: "float", sortable: true },
      category_page_slug: {
        type: "string",
        facet: true,
        compute: (doc) => {
          const color = String(doc.color || "").toLowerCase().trim();
          const category = String(doc.category || "").toLowerCase().trim();
          return `${color}-${category}`.replace(/\s+/g, "-");
        },
      },
    },
  };

  describe("getComputedFields", () => {
    it("should return only fields with compute functions", () => {
      const computed = getComputedFields(collectionDef);
      expect(computed).toHaveLength(1);
      expect(computed[0]!.name).toBe("category_page_slug");
    });

    it("should return empty array for collection without computed fields", () => {
      const def: CollectionDefinition = {
        fields: {
          name: { type: "string" },
          price: { type: "float" },
        },
      };
      expect(getComputedFields(def)).toHaveLength(0);
    });
  });

  describe("applyComputedFields", () => {
    it("should add computed field to document", () => {
      const doc = { category: "Furniture", color: "Red", price: 299 };
      const result = applyComputedFields(doc, collectionDef);
      expect(result.category_page_slug).toBe("red-furniture");
    });

    it("should not modify original document", () => {
      const doc = { category: "Furniture", color: "Red" };
      applyComputedFields(doc, collectionDef);
      expect(doc).not.toHaveProperty("category_page_slug");
    });

    it("should handle missing fields gracefully", () => {
      const doc = { price: 100 };
      const result = applyComputedFields(doc, collectionDef);
      expect(result.category_page_slug).toBe("-");
    });

    it("should handle multi-word values", () => {
      const doc = { category: "Living Room", color: "Dark Blue" };
      const result = applyComputedFields(doc, collectionDef);
      expect(result.category_page_slug).toBe("dark-blue-living-room");
    });

    it("should preserve existing fields", () => {
      const doc = { category: "Furniture", color: "Red", price: 299 };
      const result = applyComputedFields(doc, collectionDef);
      expect(result.category).toBe("Furniture");
      expect(result.color).toBe("Red");
      expect(result.price).toBe(299);
    });

    it("should skip documents when no collection def provided", () => {
      const def: CollectionDefinition = {
        fields: { name: { type: "string" } },
      };
      const doc = { name: "test" };
      const result = applyComputedFields(doc, def);
      expect(result).toEqual(doc);
    });
  });

  describe("applyComputedFieldsBatch", () => {
    it("should process all documents", () => {
      const docs = [
        { category: "Furniture", color: "Red" },
        { category: "Electronics", color: "Black" },
        { category: "Kitchen", color: "White" },
      ];
      const results = applyComputedFieldsBatch(docs, collectionDef);
      expect(results).toHaveLength(3);
      expect(results[0]!.category_page_slug).toBe("red-furniture");
      expect(results[1]!.category_page_slug).toBe("black-electronics");
      expect(results[2]!.category_page_slug).toBe("white-kitchen");
    });
  });

  describe("locale-aware computed fields", () => {
    const localizedDef: CollectionDefinition = {
      fields: {
        category: { type: "string" },
        color: { type: "string" },
        page_slug: {
          type: "string",
          facet: true,
          compute: (doc, locale) => {
            const color = String(doc.color || "").toLowerCase();
            const category = String(doc.category || "").toLowerCase();
            const slug = `${color}-${category}`.replace(/\s+/g, "-");
            return locale ? `${locale}/${slug}` : slug;
          },
        },
      },
    };

    it("should pass locale to compute function", () => {
      const doc = { category: "Meubles", color: "Rouge" };
      const result = applyComputedFields(doc, localizedDef, "fr");
      expect(result.page_slug).toBe("fr/rouge-meubles");
    });

    it("should work without locale", () => {
      const doc = { category: "Furniture", color: "Red" };
      const result = applyComputedFields(doc, localizedDef);
      expect(result.page_slug).toBe("red-furniture");
    });

    it("should pass locale to batch processing", () => {
      const docs = [
        { category: "Möbel", color: "Rot" },
        { category: "Elektronik", color: "Schwarz" },
      ];
      const results = applyComputedFieldsBatch(docs, localizedDef, "de");
      expect(results[0]!.page_slug).toBe("de/rot-möbel");
      expect(results[1]!.page_slug).toBe("de/schwarz-elektronik");
    });
  });

  describe("error handling", () => {
    it("should skip field and warn when compute throws", () => {
      const def: CollectionDefinition = {
        fields: {
          name: { type: "string" },
          broken: {
            type: "string",
            compute: () => {
              throw new Error("compute failed");
            },
          },
        },
      };
      const doc = { name: "test" };
      const result = applyComputedFields(doc, def);
      expect(result.name).toBe("test");
      expect(result.broken).toBeUndefined();
    });
  });
});
