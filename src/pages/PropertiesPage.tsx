import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PROPERTIES } from "../data/properties";
import { fetchProperties } from "../lib/api";
import { applyFilters } from "../lib/filters";
import { filtersToParams, paramsToFilters } from "../lib/filterParams";
import { formatINR } from "../lib/format";
import PropertyCard from "../components/PropertyCard";
import PropertyFilters from "../components/PropertyFilters";
import MapView from "../components/MapView";
import { CloseIcon, GridIcon, MapIcon } from "../components/Icon";
import { FURNISHING_LABELS, PROPERTY_TYPE_LABELS } from "../types";
// Aliased: the filter UI component owns the plain name in this file.
import type { Property, PropertyFilters as FiltersModel } from "../types";
import "../styles/properties.css";

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 9;

/* ------------------------------------------------------------------ */
/* Chip model — one entry per removable filter control                 */
/* ------------------------------------------------------------------ */

interface Chip {
  /** Stable key, unique within a render: "intent", "am:Gym", … */
  key: string;
  label: string;
  /** The filter set that remains after this chip is removed. */
  next: FiltersModel;
}

/** Chip labels are derived from the live filter object, so the chip row
 * can never disagree with the URL. Every branch is explicit — no clever
 * spreading that could drop a field. */
function chipsFor(f: FiltersModel): Chip[] {
  const chips: Chip[] = [];
  const push = (key: string, label: string, next: FiltersModel): void => {
    chips.push({ key, label, next });
  };

  if (f.intent !== "any") {
    push("intent", f.intent === "buy" ? "For sale" : "For rent", {
      ...f,
      intent: "any",
    });
  }
  if (f.location.trim()) {
    push("location", `Location: ${f.location.trim()}`, { ...f, location: "" });
  }
  if (f.type !== "any") {
    push("type", `Type: ${PROPERTY_TYPE_LABELS[f.type]}`, { ...f, type: "any" });
  }
  if (f.minPrice !== null) {
    push("minPrice", `Min: ${formatINR(f.minPrice)}`, { ...f, minPrice: null });
  }
  if (f.maxPrice !== null) {
    push("maxPrice", `Max: ${formatINR(f.maxPrice)}`, { ...f, maxPrice: null });
  }
  if (f.bedrooms !== null && f.bedrooms > 0) {
    push("bedrooms", `${f.bedrooms}+ Beds`, { ...f, bedrooms: null });
  }
  if (f.bathrooms !== null && f.bathrooms > 0) {
    push("bathrooms", `${f.bathrooms}+ Baths`, { ...f, bathrooms: null });
  }
  if (f.minArea !== null) {
    push("minArea", `Min area: ${f.minArea.toLocaleString("en-IN")} sq ft`, {
      ...f,
      minArea: null,
    });
  }
  if (f.furnishing !== "any") {
    push("furnishing", FURNISHING_LABELS[f.furnishing], {
      ...f,
      furnishing: "any",
    });
  }
  for (const amenity of f.amenities) {
    push(`am:${amenity}`, amenity, {
      ...f,
      amenities: f.amenities.filter((a) => a !== amenity),
    });
  }
  return chips;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/** The listings engine. The URL query string is the single source of
 * truth: every control change commits through `filtersToParams`, and
 * the grid re-renders from the re-parsed params, so browser back and
 * forward restore results exactly. */
export default function PropertiesPage() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<"grid" | "map">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [remote, setRemote] = useState<Property[] | null>(null);

  // Hydrate from the demo API when it answers with a non-empty list;
  // otherwise the static dataset keeps the page fully functional.
  useEffect(() => {
    let alive = true;
    fetchProperties().then((list) => {
      if (alive && list.length > 0) setRemote(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const source = remote ?? PROPERTIES;

  const filters: FiltersModel = useMemo(
    () => paramsToFilters(params),
    [params],
  );

  const results = useMemo(() => applyFilters(source, filters), [source, filters]);
  const visible = results.slice(0, visibleCount);
  const hasMore = results.length > visibleCount;

  /** Commit a filter set to the URL and reset pagination. */
  const apply = useCallback(
    (next: FiltersModel, opts?: { replace?: boolean }) => {
      setParams(filtersToParams(next), { replace: opts?.replace ?? false });
      setVisibleCount(PAGE_SIZE);
    },
    [setParams],
  );

  const clearAll = useCallback(() => {
    setParams(new URLSearchParams());
    setVisibleCount(PAGE_SIZE);
  }, [setParams]);

  // Back/forward navigation changes `params` without going through
  // `apply`, so pagination resets here too.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [params]);

  const chips = useMemo(() => chipsFor(filters), [filters]);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            {filters.intent === "rent"
              ? "Rent"
              : filters.intent === "buy"
                ? "Buy"
                : "Buy & Rent"}
          </p>
          <h1>Property Listings</h1>
          <p>
            {results.length} sample {results.length === 1 ? "home" : "homes"} match
            your filters. Rent prices are per month. Every result here is
            demonstration data.
          </p>
        </div>
      </section>

      <section className="section section--ivory">
        <div className="container">
          <div className="props-layout">
            <PropertyFilters
              filters={filters}
              onChange={apply}
              onClearAll={clearAll}
            />

            <div className="props-results">
              <div className="props-resultbar">
                <p className="props-count" aria-live="polite">
                  <strong>{results.length}</strong>{" "}
                  {results.length === 1 ? "property" : "properties"} match your
                  filters
                </p>
                <div
                  className="props-view-toggle"
                  role="group"
                  aria-label="Result view"
                >
                  <button
                    type="button"
                    className="props-view-btn"
                    aria-pressed={view === "grid"}
                    data-testid="view-grid"
                    onClick={() => setView("grid")}
                  >
                    <GridIcon size={16} /> Grid
                  </button>
                  <button
                    type="button"
                    className="props-view-btn"
                    aria-pressed={view === "map"}
                    data-testid="view-map"
                    onClick={() => setView("map")}
                  >
                    <MapIcon size={16} /> Map
                  </button>
                </div>
              </div>

              {chips.length > 0 && (
                <div className="props-chipbar" data-testid="chip-row">
                  <span className="props-chips-label">Active filters:</span>
                  {chips.map((chip) => (
                    <span className="props-chip" key={chip.key}>
                      <span className="props-chip-label">{chip.label}</span>
                      <button
                        type="button"
                        className="props-chip-x"
                        aria-label={`Remove filter: ${chip.label}`}
                        onClick={() => apply(chip.next)}
                      >
                        <CloseIcon size={13} />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    className="props-chips-clear"
                    onClick={clearAll}
                  >
                    Clear all
                  </button>
                </div>
              )}

              {results.length === 0 ? (
                <div className="props-empty">
                  <div className="empty-state">
                    <h3>No properties match these filters</h3>
                    <p>
                      Try widening the budget, removing an amenity, or clearing
                      the location.
                    </p>
                    <button
                      type="button"
                      className="btn btn--gold"
                      data-testid="empty-clear"
                      onClick={clearAll}
                    >
                      Clear all filters
                    </button>
                    <p className="props-empty-hint">
                      Filters live in the page address, so the back button always
                      returns you to the previous results.
                    </p>
                  </div>
                </div>
              ) : view === "grid" ? (
                <>
                  <div className="props-grid">
                    {visible.map((p, i) => (
                      <PropertyCard key={p.id} property={p} eager={i < 4} />
                    ))}
                  </div>
                  {results.length > 0 && (
                    <div className="props-more">
                      <p className="props-more-count">
                        Showing {visible.length} of {results.length}
                      </p>
                      {hasMore && (
                        <button
                          type="button"
                          className="btn btn--navy"
                          data-testid="load-more"
                          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                        >
                          Load More
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="props-mapwrap">
                  <MapView properties={results} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
