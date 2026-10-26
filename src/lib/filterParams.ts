import type {
  Furnishing,
  ListingIntent,
  PropertyFilters,
  PropertyType,
  SortKey,
} from "../types";
import { EMPTY_FILTERS } from "../types";

/**
 * The ONE mapping between PropertyFilters and URL query params.
 * Used by the hero search panel, category cards, quick-links and the
 * listings page itself, so every entry point shares identical param
 * names and the funnel can never break between components.
 *
 * Param names (stable contract):
 *   intent    buy | rent          (absent = any)
 *   location  free text
 *   type      property type key   (absent = any)
 *   minP      minimum price       (INR)
 *   maxP      maximum price       (INR)
 *   beds      minimum bedrooms
 *   baths     minimum bathrooms
 *   minA      minimum area (sq ft)
 *   furn      furnished | semi-furnished | unfurnished
 *   am        amenity (repeatable)
 *   sort      price-asc | price-desc | newest | area-desc | relevance
 */

export function filtersToParams(f: PropertyFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.intent !== "any") p.set("intent", f.intent);
  if (f.location.trim()) p.set("location", f.location.trim());
  if (f.type !== "any") p.set("type", f.type);
  if (f.minPrice !== null) p.set("minP", String(f.minPrice));
  if (f.maxPrice !== null) p.set("maxP", String(f.maxPrice));
  if (f.bedrooms !== null) p.set("beds", String(f.bedrooms));
  if (f.bathrooms !== null) p.set("baths", String(f.bathrooms));
  if (f.minArea !== null) p.set("minA", String(f.minArea));
  if (f.furnishing !== "any") p.set("furn", f.furnishing);
  for (const a of f.amenities) p.append("am", a);
  if (f.sort !== "relevance") p.set("sort", f.sort);
  return p;
}

export function paramsToFilters(params: URLSearchParams): PropertyFilters {
  const f: PropertyFilters = { ...EMPTY_FILTERS, amenities: [] };

  const intent = params.get("intent");
  if (intent === "buy" || intent === "rent") f.intent = intent as ListingIntent;

  f.location = params.get("location")?.trim() ?? "";

  const type = params.get("type");
  if (
    type === "apartment" ||
    type === "house" ||
    type === "villa" ||
    type === "studio" ||
    type === "plot" ||
    type === "commercial" ||
    type === "office"
  ) {
    f.type = type as PropertyType;
  }

  f.minPrice = numParam(params.get("minP"));
  f.maxPrice = numParam(params.get("maxP"));
  f.bedrooms = numParam(params.get("beds"));
  f.bathrooms = numParam(params.get("baths"));
  f.minArea = numParam(params.get("minA"));

  const furn = params.get("furn");
  if (furn === "furnished" || furn === "semi-furnished" || furn === "unfurnished") {
    f.furnishing = furn as Furnishing;
  }

  f.amenities = params.getAll("am").filter(Boolean);

  const sort = params.get("sort");
  if (
    sort === "price-asc" ||
    sort === "price-desc" ||
    sort === "newest" ||
    sort === "area-desc" ||
    sort === "relevance"
  ) {
    f.sort = sort as SortKey;
  }

  return f;
}

function numParam(raw: string | null): number | null {
  if (raw !== null && raw !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

/** Convenience: build a /properties href from a partial filter set
 * (e.g. a category card: { type: "villa" }). */
export function buildSearchHref(
  partial: Partial<PropertyFilters>,
  pathname = "/properties",
): string {
  const params = filtersToParams({ ...EMPTY_FILTERS, ...partial });
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
