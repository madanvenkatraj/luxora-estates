import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { buildSearchHref } from "../lib/filterParams";
import { PROPERTY_TYPE_LABELS } from "../types";
import type { ListingIntent, PropertyType } from "../types";
import { SearchIcon } from "./Icon";
import "../styles/home.css";

const TYPE_KEYS = new Set(Object.keys(PROPERTY_TYPE_LABELS));

function isTypeKey(value: string): value is PropertyType {
  return TYPE_KEYS.has(value);
}

const BED_OPTIONS = ["1", "2", "3", "4", "5"] as const;

/** Hero search panel. Buy/Rent toggle + type, location, min/max price
 * and bedrooms; submits to /properties through the shared
 * buildSearchHref contract (intent, type, location, minP, maxP, beds). */
export default function SearchPanel() {
  const navigate = useNavigate();
  const [intent, setIntent] = useState<ListingIntent>("buy");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [beds, setBeds] = useState("");

  const parsePrice = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const bedsNum = beds === "" ? null : Number(beds);
    navigate(
      buildSearchHref({
        intent,
        type: type !== "" && isTypeKey(type) ? type : "any",
        location,
        minPrice: parsePrice(minPrice),
        maxPrice: parsePrice(maxPrice),
        bedrooms:
          bedsNum !== null && Number.isInteger(bedsNum) && bedsNum > 0
            ? bedsNum
            : null,
      }),
    );
    window.scrollTo(0, 0);
  };

  return (
    <form
      className="search-panel"
      role="search"
      aria-label="Property search"
      onSubmit={handleSubmit}
    >
      <div className="sp-toggle-row">
        <div className="sp-toggle" role="group" aria-label="Buy or rent">
          <button
            type="button"
            className={`sp-toggle__btn${intent === "buy" ? " is-active" : ""}`}
            aria-pressed={intent === "buy"}
            onClick={() => setIntent("buy")}
          >
            Buy
          </button>
          <button
            type="button"
            className={`sp-toggle__btn${intent === "rent" ? " is-active" : ""}`}
            aria-pressed={intent === "rent"}
            onClick={() => setIntent("rent")}
          >
            Rent
          </button>
        </div>
      </div>

      <div className="sp-grid">
        <div className="field">
          <label htmlFor="sp-type">Property type</label>
          <select
            id="sp-type"
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All types</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="sp-location">Location</label>
          <input
            id="sp-location"
            className="input"
            type="text"
            autoComplete="off"
            placeholder="City, locality or address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="sp-min-price">Min price (₹)</label>
          <input
            id="sp-min-price"
            className="input"
            type="number"
            min="0"
            step="any"
            inputMode="numeric"
            placeholder="No minimum"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="sp-max-price">Max price (₹)</label>
          <input
            id="sp-max-price"
            className="input"
            type="number"
            min="0"
            step="any"
            inputMode="numeric"
            placeholder="No maximum"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="sp-beds">Bedrooms</label>
          <select
            id="sp-beds"
            className="select"
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
          >
            <option value="">Any</option>
            {BED_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n === "5" ? "5+" : n}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn--gold search-panel__submit">
          <SearchIcon size={17} /> Search Properties
        </button>
      </div>
    </form>
  );
}
