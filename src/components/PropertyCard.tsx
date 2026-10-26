import { Link } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import { formatINR, formatINRFull, formatArea } from "../lib/format";
import { PROPERTY_TYPE_LABELS } from "../types";
import type { Property } from "../types";
import SmartImage from "./SmartImage";
import {
  BedIcon,
  BathIcon,
  AreaIcon,
  PinIcon,
  HeartIcon,
} from "./Icon";

const STATUS_BADGE: Record<Property["status"], { label: string; cls: string } | null> = {
  featured: { label: "Featured", cls: "badge--gold" },
  new: { label: "New Listing", cls: "badge--new" },
  reduced: { label: "Price Reduced", cls: "badge--reduced" },
  standard: null,
};

export default function PropertyCard({
  property,
  eager = false,
}: {
  property: Property;
  eager?: boolean;
}) {
  const { has, toggle } = useFavorites();
  const fav = has(property.id);
  const badge = STATUS_BADGE[property.status];

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Link
          to={`/property/${property.slug}`}
          aria-label={`View details of ${property.title}`}
          className="pcard__imglink"
        >
          <SmartImage
            src={property.images[0] ?? ""}
            alt={property.title}
            className="pcard__img"
            eager={eager}
          />
        </Link>

        <div className="pcard__badges">
          {property.intent === "rent" ? (
            <span className="badge badge--rent">For Rent</span>
          ) : (
            <span className="badge badge--navy">For Sale</span>
          )}
          {badge && <span className={`badge ${badge.cls}`}>{badge.label}</span>}
        </div>

        <button
          type="button"
          className={`pcard__fav ${fav ? "is-active" : ""}`}
          aria-pressed={fav}
          aria-label={
            fav
              ? `Remove ${property.title} from favourites`
              : `Add ${property.title} to favourites`
          }
          onClick={() => toggle(property.id)}
        >
          <HeartIcon size={17} filled={fav} />
        </button>
      </div>

      <div className="pcard__body">
        <div className="pcard__price">
          {property.intent === "rent"
            ? `${formatINRFull(property.price)}/mo`
            : formatINR(property.price)}
        </div>
        <h3 className="pcard__title">
          <Link to={`/property/${property.slug}`}>{property.title}</Link>
        </h3>
        <p className="pcard__loc">
          <PinIcon size={14} /> {property.location.locality},{" "}
          {property.location.city}
        </p>
        <p className="pcard__meta">
          <span><BedIcon size={15} /> {property.bedrooms > 0 ? property.bedrooms : "—"} Beds</span>
          <span><BathIcon size={15} /> {property.bathrooms > 0 ? property.bathrooms : "—"} Baths</span>
          <span><AreaIcon size={15} /> {formatArea(property.areaSqft)}</span>
        </p>
        <div className="pcard__foot">
          <span className="pcard__type">
            {PROPERTY_TYPE_LABELS[property.type]}
          </span>
          <Link className="btn btn--ghost btn--sm" to={`/property/${property.slug}`}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
