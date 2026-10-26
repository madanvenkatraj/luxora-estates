import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/properties";
import { fetchCategories } from "../lib/api";
import { buildSearchHref } from "../lib/filterParams";
import type { Category, ListingIntent, PropertyType } from "../types";
import SmartImage from "./SmartImage";
import { ArrowRightIcon } from "./Icon";
import "../styles/home.css";

/** Type filters carried by a Category. The dataset always provides a
 * concrete type or the "any" key, and intent "any" or a concrete one. */
interface CategoryFilter {
  type?: PropertyType;
  intent?: ListingIntent;
}

function categoryHref(category: Category): string {
  const filter: CategoryFilter = {};
  if (category.type !== "any") filter.type = category.type;
  if (category.intent !== "any") filter.intent = category.intent;
  return buildSearchHref(filter);
}

/** "EXPLORE PROPERTIES" — the eight discovery categories as image
 * cards, each linking through the shared buildSearchHref contract.
 * Renders static categories first and swaps in the API list only when
 * it resolves non-empty, so a down API changes nothing visually. */
export default function PropertyDiscovery() {
  const [remote, setRemote] = useState<Category[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCategories().then((list) => {
      if (alive && list.length > 0) setRemote(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const categories = remote ?? CATEGORIES;
  return (
    <section className="section section--white" aria-labelledby="discovery-title">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Property types</span>
          <h2 id="discovery-title">EXPLORE PROPERTIES</h2>
        </div>
        <div className="cat-grid">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={categoryHref(category)}
              className="cat-card"
              aria-label={`Explore ${category.label}`}
            >
              <SmartImage
                src={category.image}
                alt={`${category.label} — sample photography`}
                className="cat-card__img"
                eager={index < 4}
              />
              <div className="cat-card__veil" aria-hidden="true" />
              <div className="cat-card__body">
                <h3 className="cat-card__label">{category.label}</h3>
                <p className="cat-card__desc">{category.description}</p>
                <span className="cat-card__cta">
                  Explore <ArrowRightIcon size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
