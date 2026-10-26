import { describe, it, expect } from "vitest";
import { filtersToParams, paramsToFilters, buildSearchHref } from "../src/lib/filterParams";
import { EMPTY_FILTERS } from "../src/types";
import type { PropertyFilters } from "../src/types";

describe("filterParams round-trip", () => {
  it("round-trips a full filter set (Risk 1: single shared mapping)", () => {
    const f: PropertyFilters = {
      intent: "rent",
      location: "Koramangala",
      type: "studio",
      minPrice: 20000,
      maxPrice: 40000,
      bedrooms: 1,
      bathrooms: 1,
      minArea: 500,
      furnishing: "furnished",
      amenities: ["Gym", "Security"],
      sort: "price-asc",
    };
    const params = filtersToParams(f);
    expect(paramsToFilters(params)).toEqual(f);
  });

  it("serialises empty filters to an empty query string", () => {
    expect(filtersToParams({ ...EMPTY_FILTERS, amenities: [] }).toString()).toBe("");
  });

  it("parses an empty query back to EMPTY_FILTERS", () => {
    const f = paramsToFilters(new URLSearchParams(""));
    expect(f).toEqual({ ...EMPTY_FILTERS, amenities: [] });
  });

  it("ignores invalid values rather than throwing", () => {
    const params = new URLSearchParams(
      "intent=swim&type=yacht&minP=-5&beds=abc&furn=banana&sort=cheapest",
    );
    const f = paramsToFilters(params);
    expect(f).toEqual({ ...EMPTY_FILTERS, amenities: [] });
  });

  it("keeps repeatable amenity params", () => {
    const params = new URLSearchParams("am=Gym&am=Security");
    expect(paramsToFilters(params).amenities).toEqual(["Gym", "Security"]);
  });

  it("buildSearchHref produces the canonical URLs used across the app", () => {
    const parse = (href: string) =>
      paramsToFilters(new URLSearchParams(href.split("?")[1] ?? ""));
    expect(buildSearchHref({ intent: "buy" })).toBe("/properties?intent=buy");
    expect(parse(buildSearchHref({ type: "studio", intent: "rent" }))).toEqual(
      paramsToFilters(new URLSearchParams("type=studio&intent=rent")),
    );
    expect(buildSearchHref({})).toBe("/properties");
  });

  it("negative minPrice from a bad URL is dropped, not turned into a filter", () => {
    const f = paramsToFilters(new URLSearchParams("minP=-100&maxP=50000"));
    expect(f.minPrice).toBeNull();
    expect(f.maxPrice).toBe(50000);
  });
});
