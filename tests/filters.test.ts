import { describe, it, expect } from "vitest";
import { applyFilters, sortProperties, countActiveFilters } from "../src/lib/filters";
import { PROPERTIES } from "../src/data/properties";
import { EMPTY_FILTERS } from "../src/types";
import type { PropertyFilters } from "../src/types";

const base: PropertyFilters = { ...EMPTY_FILTERS, amenities: [] };

describe("applyFilters", () => {
  it("returns everything with empty filters", () => {
    expect(applyFilters(PROPERTIES, base)).toHaveLength(PROPERTIES.length);
  });

  it("filters by intent", () => {
    const rent = applyFilters(PROPERTIES, { ...base, intent: "rent" });
    expect(rent.length).toBeGreaterThan(0);
    expect(rent.every((p) => p.intent === "rent")).toBe(true);
  });

  it("filters by property type", () => {
    const villas = applyFilters(PROPERTIES, { ...base, type: "villa" });
    expect(villas.length).toBeGreaterThan(0);
    expect(villas.every((p) => p.type === "villa")).toBe(true);
  });

  it("filters by location substring (locality or city)", () => {
    const mumbai = applyFilters(PROPERTIES, { ...base, location: "Mumbai" });
    expect(mumbai.length).toBeGreaterThan(0);
    expect(mumbai.every((p) => p.location.city === "Mumbai")).toBe(true);
  });

  it("applies budget bounds", () => {
    const mid = applyFilters(PROPERTIES, { ...base, minPrice: 10_000_000, maxPrice: 50_000_000, intent: "buy" });
    expect(mid.every((p) => p.price >= 10_000_000 && p.price <= 50_000_000)).toBe(true);
  });

  it("applies minimum bedrooms", () => {
    const big = applyFilters(PROPERTIES, { ...base, bedrooms: 4 });
    expect(big.every((p) => p.bedrooms >= 4)).toBe(true);
  });

  it("applies minimum area", () => {
    const large = applyFilters(PROPERTIES, { ...base, minArea: 3000 });
    expect(large.every((p) => p.areaSqft >= 3000)).toBe(true);
  });

  it("applies furnishing", () => {
    const furnished = applyFilters(PROPERTIES, { ...base, furnishing: "furnished" });
    expect(furnished.every((p) => p.furnishing === "furnished")).toBe(true);
  });

  it("requires ALL selected amenities", () => {
    const poolGym = applyFilters(PROPERTIES, {
      ...base,
      amenities: ["Swimming Pool", "Gym"],
    });
    expect(poolGym.length).toBeGreaterThan(0);
    expect(
      poolGym.every((p) =>
        ["Swimming Pool", "Gym"].every((a) => p.amenities.includes(a)),
      ),
    ).toBe(true);
  });

  it("combined filters narrow together", () => {
    const combo = applyFilters(PROPERTIES, {
      ...base,
      intent: "rent",
      bedrooms: 2,
      maxPrice: 60_000,
      furnishing: "furnished",
    });
    expect(
      combo.every(
        (p) =>
          p.intent === "rent" &&
          p.bedrooms >= 2 &&
          p.price <= 60_000 &&
          p.furnishing === "furnished",
      ),
    ).toBe(true);
  });

  it("can produce an empty result (empty-state path)", () => {
    const none = applyFilters(PROPERTIES, {
      ...base,
      intent: "buy",
      maxPrice: 1000,
    });
    expect(none).toHaveLength(0);
  });
});

describe("sortProperties", () => {
  it("sorts price ascending", () => {
    const s = sortProperties(PROPERTIES, "price-asc");
    for (let i = 1; i < s.length; i += 1) {
      expect(s[i]!.price).toBeGreaterThanOrEqual(s[i - 1]!.price);
    }
  });

  it("sorts price descending", () => {
    const s = sortProperties(PROPERTIES, "price-desc");
    for (let i = 1; i < s.length; i += 1) {
      expect(s[i]!.price).toBeLessThanOrEqual(s[i - 1]!.price);
    }
  });

  it("sorts newest first", () => {
    const s = sortProperties(PROPERTIES, "newest");
    for (let i = 1; i < s.length; i += 1) {
      expect(new Date(s[i]!.listedAt).getTime())
        .toBeLessThanOrEqual(new Date(s[i - 1]!.listedAt).getTime());
    }
  });

  it("sorts area descending", () => {
    const s = sortProperties(PROPERTIES, "area-desc");
    for (let i = 1; i < s.length; i += 1) {
      expect(s[i]!.areaSqft).toBeLessThanOrEqual(s[i - 1]!.areaSqft);
    }
  });
});

describe("countActiveFilters", () => {
  it("counts zero for empty filters", () => {
    expect(countActiveFilters(base)).toBe(0);
  });

  it("counts each set filter including amenities", () => {
    const n = countActiveFilters({
      ...base,
      intent: "rent",
      bedrooms: 2,
      amenities: ["Gym", "Security"],
    });
    expect(n).toBe(4);
  });
});
