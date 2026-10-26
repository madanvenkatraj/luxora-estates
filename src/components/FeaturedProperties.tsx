import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PROPERTIES } from "../data/properties";
import PropertyCard from "./PropertyCard";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icon";
import "../styles/home.css";

/** Featured listings strip: hand-picked properties in a mobile-friendly
 * scroll-snap carousel with prev/next controls and a "View All
 * Properties" CTA. Section id "featured" is the hero CTA's anchor. */
export default function FeaturedProperties() {
  const track = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const featured = PROPERTIES.filter((p) => p.status === "featured");

  const updateArrows = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = track.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>(".fp-slide");
    const step = slide
      ? slide.getBoundingClientRect().width + 24
      : el.clientWidth * 0.8;
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  return (
    <section
      className="section section--ivory"
      id="featured"
      aria-labelledby="featured-title"
    >
      <div className="container">
        <div className="section-head section-head--row">
          <div>
            <span className="eyebrow">Handpicked</span>
            <h2 id="featured-title">FEATURED PROPERTIES</h2>
          </div>
          <div className="fp-nav">
            <button
              type="button"
              className="fp-nav__btn"
              aria-label="Previous featured properties"
              onClick={() => scrollByCard(-1)}
              disabled={!canPrev}
            >
              <ChevronLeftIcon size={20} />
            </button>
            <button
              type="button"
              className="fp-nav__btn"
              aria-label="Next featured properties"
              onClick={() => scrollByCard(1)}
              disabled={!canNext}
            >
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </div>

        <div
          className="fp-track"
          ref={track}
          tabIndex={0}
          role="group"
          aria-label="Featured properties carousel"
        >
          {featured.map((p, i) => (
            <div className="fp-slide" key={p.id}>
              <PropertyCard property={p} eager={i < 3} />
            </div>
          ))}
        </div>

        <div className="fp-footer">
          <Link to="/properties" className="btn btn--navy">
            View All Properties
          </Link>
        </div>
      </div>
    </section>
  );
}
