import type { Property, PropertyFilters } from "../types";

/** The single filtering engine used by the listings page, the hero
 * search panel and the map view — so URL params and UI can never
 * diverge on what "matching" means. */

export function applyFilters(
  properties: Property[],
  f: PropertyFilters,
): Property[] {
  const out = properties.filter((p) => {
    if (f.intent !== "any" && p.intent !== f.intent) return false;
    if (f.type !== "any" && p.type !== f.type) return false;

    if (f.location.trim()) {
      const q = f.location.trim().toLowerCase();
      const hay = `${p.location.locality} ${p.location.city} ${p.location.address}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (f.minPrice !== null && p.price < f.minPrice) return false;
    if (f.maxPrice !== null && p.price > f.maxPrice) return false;

    // "At least N bedrooms" — plots (0 bedrooms) only match when N is 0.
    if (f.bedrooms !== null && f.bedrooms > 0 && p.bedrooms < f.bedrooms) {
      return false;
    }
    if (f.bathrooms !== null && f.bathrooms > 0 && p.bathrooms < f.bathrooms) {
      return false;
    }
    if (f.minArea !== null && p.areaSqft < f.minArea) return false;

    if (f.furnishing !== "any" && p.furnishing !== f.furnishing) return false;

    if (f.amenities.length > 0) {
      const set = new Set(p.amenities);
      for (const a of f.amenities) {
        if (!set.has(a)) return false;
      }
    }
    return true;
  });

  return sortProperties(out, f.sort);
}

export function sortProperties<T extends Property>(
  list: T[],
  sort: PropertyFilters["sort"],
): T[] {
  const copy = [...list];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime(),
      );
    case "area-desc":
      return copy.sort((a, b) => b.areaSqft - a.areaSqft);
    case "relevance":
    default: {
      // Featured first, then newest.
      const rank: Record<string, number> = { featured: 0, new: 1, reduced: 2, standard: 3 };
      return copy.sort((a, b) => {
        const d = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
        if (d !== 0) return d;
        return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
      });
    }
  }
}

export function countActiveFilters(f: PropertyFilters): number {
  let n = 0;
  if (f.intent !== "any") n += 1;
  if (f.location.trim()) n += 1;
  if (f.type !== "any") n += 1;
  if (f.minPrice !== null) n += 1;
  if (f.maxPrice !== null) n += 1;
  if (f.bedrooms !== null) n += 1;
  if (f.bathrooms !== null) n += 1;
  if (f.minArea !== null) n += 1;
  if (f.furnishing !== "any") n += 1;
  n += f.amenities.length;
  return n;
}
