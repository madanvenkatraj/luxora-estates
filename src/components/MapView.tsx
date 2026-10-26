import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROPERTIES } from "../data/properties";
import { buildSearchHref } from "../lib/filterParams";
import { formatPrice } from "../lib/format";
import type { Property } from "../types";
import { PinIcon, CloseIcon, InfoIcon, MapIcon, ArrowRightIcon } from "./Icon";
import SmartImage from "./SmartImage";
import "../styles/details.css";

/* Coordinate window the placeholder normalises into percentage space.
 * The sample set spans India, so this window covers every demo listing:
 * x = (lng − 66) / (98 − 66), y = (36 − lat) / (36 − 6), clamped 4–96%. */
const LNG_MIN = 66;
const LNG_SPAN = 98 - LNG_MIN;
const LAT_MAX = 36;
const LAT_SPAN = 36 - 6;
const CLAMP_MIN = 4;
const CLAMP_MAX = 96;

/** Normalise lng→x, lat→y into 4–96% of the canvas. */
function toPercent(lat: number, lng: number): { x: number; y: number } {
  const clamp = (n: number) => Math.min(CLAMP_MAX, Math.max(CLAMP_MIN, n));
  const x = clamp(((lng - LNG_MIN) / LNG_SPAN) * 100);
  const y = clamp(((LAT_MAX - lat) / LAT_SPAN) * 100);
  return { x, y };
}

/**
 * Interactive-styled PLACEHOLDER map. Not a live map service: pins are
 * plotted from each property's rough demo coordinates onto a normalised
 * navy canvas, so relative positions are illustrative only.
 * Exported signature stays `MapView({ properties })`.
 */
export default function MapView({
  properties = PROPERTIES,
}: {
  properties?: Property[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openedByKeyboard = useRef(false);
  const previewCloseRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const open = properties.find((p) => p.id === openId) ?? null;

  const close = useCallback(() => {
    setOpenId(null);
    openedByKeyboard.current = false;
  }, []);

  const toggle = useCallback(
    (p: Property, viaKeyboard: boolean) => {
      setOpenId((current) => {
        if (current === p.id) {
          openedByKeyboard.current = false;
          return null;
        }
        openedByKeyboard.current = viaKeyboard;
        return p.id;
      });
    },
    [],
  );

  /* Escape closes; a click anywhere outside the panel closes. */
  useEffect(() => {
    if (openId === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openId, close]);

  /* Keyboard-opened previews move focus to the preview's close button. */
  useEffect(() => {
    if (openId !== null && openedByKeyboard.current) {
      previewCloseRef.current?.focus();
    }
  }, [openId]);

  return (
    <div className="mv-placeholder" ref={rootRef} data-testid="map-view">
      <div className="mv-head">
        <strong>
          <MapIcon size={16} /> Interactive Map Placeholder
        </strong>
        <Link className="mv-link-btn" to={buildSearchHref({})}>
          Browse as grid instead
        </Link>
      </div>

      <div
        className="mv-canvas"
        role="group"
        aria-label="Sample property locations"
      >
        {properties.map((p) => {
          const { x, y } = toPercent(p.coordinates.lat, p.coordinates.lng);
          const isOpen = openId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`mv-pin${isOpen ? " is-active" : ""}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              tabIndex={0}
              aria-label={`Show preview for ${p.title}`}
              aria-expanded={isOpen}
              aria-haspopup="dialog"
              onClick={() => toggle(p, false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(p, true);
                }
              }}
            >
              <PinIcon size={17} />
            </button>
          );
        })}

        {open && (
          <MapPreview
            property={open}
            closeRef={previewCloseRef}
            onClose={close}
          />
        )}
      </div>

      <p className="mv-caption">
        <InfoIcon size={15} />
        Interactive map placeholder — sample locations, not geographically
        accurate.
      </p>
    </div>
  );
}

/** Preview card pinned near its map pin; opens one at a time. */
function MapPreview({
  property,
  closeRef,
  onClose,
}: {
  property: Property;
  closeRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
}) {
  const { x, y } = toPercent(property.coordinates.lat, property.coordinates.lng);
  const openLeft = x > 55;
  return (
    <div
      className="mv-preview"
      role="dialog"
      aria-label={`${property.title} preview`}
      style={{
        left: `clamp(10px, ${x}%, calc(100% - 292px))`,
        top: `clamp(10px, ${y}%, calc(100% - 256px))`,
        transform: openLeft ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
      }}
    >
      <div className="mv-preview__media">
        <SmartImage
          src={property.images[0] ?? ""}
          alt={`${property.title} — sample photo`}
          eager
        />
        <button
          ref={closeRef}
          type="button"
          className="mv-preview__close"
          aria-label={`Close preview for ${property.title}`}
          onClick={onClose}
        >
          <CloseIcon size={14} />
        </button>
      </div>
      <div className="mv-preview__body">
        <p className="mv-preview__price">{formatPrice(property)}</p>
        <p className="mv-preview__title">{property.title}</p>
        <Link
          className="mv-preview__link"
          to={`/property/${property.slug}`}
          onClick={onClose}
        >
          View Details <ArrowRightIcon size={14} />
        </Link>
      </div>
    </div>
  );
}
