import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { countActiveFilters } from "../lib/filters";
import {
  ALL_AMENITIES,
  FURNISHING_LABELS,
  PROPERTY_TYPE_LABELS,
} from "../types";
import type {
  Furnishing,
  PropertyFilters,
  PropertyType,
  SortKey,
} from "../types";
import { ChevronDownIcon, MenuIcon } from "./Icon";

/* ------------------------------------------------------------------ */
/* Closed option lists                                                 */
/* ------------------------------------------------------------------ */

/** Union members declared literally, so a new type added to the domain
 * union surfaces as a compile error here instead of silently missing
 * from the filter UI. */
const PROPERTY_TYPE_KEYS: readonly PropertyType[] = [
  "apartment",
  "house",
  "villa",
  "studio",
  "plot",
  "commercial",
  "office",
];

const FURNISHING_KEYS: readonly Furnishing[] = [
  "furnished",
  "semi-furnished",
  "unfurnished",
];

const TYPE_OPTIONS: ReadonlyArray<{
  value: PropertyType | "any";
  label: string;
}> = [
  { value: "any", label: "Any property type" },
  ...PROPERTY_TYPE_KEYS.map((key) => ({
    value: key,
    label: PROPERTY_TYPE_LABELS[key],
  })),
];

const FURNISHING_OPTIONS: ReadonlyArray<{
  value: Furnishing | "any";
  label: string;
}> = [
  { value: "any", label: "Any furnishing" },
  ...FURNISHING_KEYS.map((key) => ({
    value: key,
    label: FURNISHING_LABELS[key],
  })),
];

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
  { value: "newest", label: "Newest" },
  { value: "area-desc", label: "Largest first" },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Maps a raw select value back to its typed option value without type
 * assertions: a select can only ever hold a value from its own options. */
function pickOption<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  raw: string,
): T | null {
  return options.find((option) => option.value === raw)?.value ?? null;
}

/** Mirrors the URL-side number parsing: empty or invalid input means
 * "no constraint", never zero. */
function toNumOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * A controlled text/number field whose value commits to the URL debounced,
 * so typing stays responsive and doesn't flood browser history.
 *
 * The URL always wins when it changes externally (browser back/forward,
 * chip removal, preset links): a pending commit is cancelled and the
 * local value resyncs, which is what keeps the input and the URL in step.
 */
function useDebouncedField(
  external: string,
  commit: (value: string) => void,
  delay = 350,
): [string, (next: string) => void] {
  const [value, setValue] = useState(external);
  const valueRef = useRef(value);
  valueRef.current = value;
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (external === valueRef.current) return;
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setValue(external);
  }, [external]);

  const handleChange = (next: string) => {
    setValue(next);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      commitRef.current(valueRef.current);
    }, delay);
  };

  // Flush a pending edit on unmount so the last keystrokes reach the URL.
  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        commitRef.current(valueRef.current);
      }
    },
    [],
  );

  return [value, handleChange];
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export interface PropertyFiltersProps {
  filters: PropertyFilters;
  /** Commit a new filter set; the page writes it to the URL. */
  onChange: (next: PropertyFilters, opts?: { replace?: boolean }) => void;
  /** Reset to the empty filter set. */
  onClearAll: () => void;
}

/** The listings filter sidebar. Fully controlled by the URL: every
 * control change flows through `onChange` into `filtersToParams`, and
 * the grid re-renders from the parsed params. Sidebar on desktop,
 * collapsible panel on mobile. */
export default function PropertyFilters({
  filters,
  onChange,
  onClearAll,
}: PropertyFiltersProps) {
  const activeCount = countActiveFilters(filters);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Latest filters, readable from debounced callbacks without stale
  // closures.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const update = (
    patch: Partial<PropertyFilters>,
    opts?: { replace?: boolean },
  ) => onChange({ ...filtersRef.current, ...patch }, opts);

  // Text and number fields commit debounced (and replace the history
  // entry, so typing doesn't flood the back stack).
  const [location, setLocation] = useDebouncedField(
    filters.location,
    (value) => update({ location: value }, { replace: true }),
  );
  const [minPrice, setMinPrice] = useDebouncedField(
    filters.minPrice === null ? "" : String(filters.minPrice),
    (value) => update({ minPrice: toNumOrNull(value) }, { replace: true }),
  );
  const [maxPrice, setMaxPrice] = useDebouncedField(
    filters.maxPrice === null ? "" : String(filters.maxPrice),
    (value) => update({ maxPrice: toNumOrNull(value) }, { replace: true }),
  );
  const [minArea, setMinArea] = useDebouncedField(
    filters.minArea === null ? "" : String(filters.minArea),
    (value) => update({ minArea: toNumOrNull(value) }, { replace: true }),
  );

  // Discrete controls commit immediately and push a history entry.
  const setIntent = (intent: "buy" | "rent") => {
    update({
      intent: filtersRef.current.intent === intent ? "any" : intent,
    });
  };

  const handleTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = pickOption(TYPE_OPTIONS, event.target.value);
    if (value) update({ type: value });
  };

  const handleFurnishingChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = pickOption(FURNISHING_OPTIONS, event.target.value);
    if (value) update({ furnishing: value });
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = pickOption(SORT_OPTIONS, event.target.value);
    if (value) update({ sort: value });
  };

  const handleBedroomsChange = (event: ChangeEvent<HTMLSelectElement>) => {
    update({ bedrooms: toNumOrNull(event.target.value) });
  };

  const handleBathroomsChange = (event: ChangeEvent<HTMLSelectElement>) => {
    update({ bathrooms: toNumOrNull(event.target.value) });
  };

  const toggleAmenity = (amenity: string) => {
    const current = filtersRef.current.amenities;
    update({
      amenities: current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity],
    });
  };

  const handleClearAll = () => {
    if (activeCount > 0) onClearAll();
  };

  const panelId = "props-filter-panel";

  return (
    <aside className="props-sidebar">
      <button
        type="button"
        className="btn btn--navy props-mobile-toggle"
        aria-expanded={mobileOpen}
        aria-controls={panelId}
        data-testid="filters-toggle"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className="props-toggle-label">
          <MenuIcon size={17} />
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </span>
        <ChevronDownIcon size={16} />
      </button>

      <form
        id={panelId}
        className={`props-panel${mobileOpen ? " is-open" : ""}`}
        aria-label="Filter properties"
        data-testid="filter-panel"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="props-field">
          <span className="props-legend">Listing type</span>
          <div className="props-seg" role="group" aria-label="Listing type">
            <button
              type="button"
              className="props-seg-btn"
              aria-pressed={filters.intent === "buy"}
              data-testid="intent-buy"
              onClick={() => setIntent("buy")}
            >
              Buy
            </button>
            <button
              type="button"
              className="props-seg-btn"
              aria-pressed={filters.intent === "rent"}
              data-testid="intent-rent"
              onClick={() => setIntent("rent")}
            >
              Rent
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="pf-location">Location</label>
          <input
            id="pf-location"
            className="input"
            type="text"
            autoComplete="off"
            placeholder="City, locality or address"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="pf-type">Property type</label>
          <select
            id="pf-type"
            className="select"
            value={filters.type}
            onChange={handleTypeChange}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="props-field-row">
          <div className="field">
            <label htmlFor="pf-min-price">Min budget (₹)</label>
            <input
              id="pf-min-price"
              className="input"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="e.g. 5000000"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="pf-max-price">Max budget (₹)</label>
            <input
              id="pf-max-price"
              className="input"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="e.g. 25000000"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </div>
        </div>

        <div className="props-field-row">
          <div className="field">
            <label htmlFor="pf-beds">Bedrooms (min)</label>
            <select
              id="pf-beds"
              className="select"
              value={filters.bedrooms ?? ""}
              onChange={handleBedroomsChange}
            >
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5+</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="pf-baths">Bathrooms (min)</label>
            <select
              id="pf-baths"
              className="select"
              value={filters.bathrooms ?? ""}
              onChange={handleBathroomsChange}
            >
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5+</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="pf-min-area">Min area (sq ft)</label>
          <input
            id="pf-min-area"
            className="input"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="e.g. 1200"
            value={minArea}
            onChange={(event) => setMinArea(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="pf-furn">Furnishing</label>
          <select
            id="pf-furn"
            className="select"
            value={filters.furnishing}
            onChange={handleFurnishingChange}
          >
            {FURNISHING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="props-fieldset">
          <legend>Amenities</legend>
          <div className="props-amenities">
            {ALL_AMENITIES.map((amenity) => (
              <label key={amenity} className="props-check">
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="pf-sort">Sort by</label>
          <select
            id="pf-sort"
            className="select"
            value={filters.sort}
            onChange={handleSortChange}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn--outline props-clearall"
          aria-disabled={activeCount === 0}
          data-testid="clear-all"
          onClick={handleClearAll}
        >
          Clear All{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </form>
    </aside>
  );
}
