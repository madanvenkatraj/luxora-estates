import { Link } from "react-router-dom";
import { PROPERTIES } from "../data/properties";
import SearchPanel from "./SearchPanel";
import "../styles/home.css";

/** Cinematic home hero: dimmed modern-villa photography over the deep
 * navy gradient, headline, supporting copy, gold CTA to #featured, and
 * the full search panel. */
export default function Hero() {
  const heroImage = PROPERTIES[0]?.images[0] ?? "";

  return (
    <section className="hero" aria-labelledby="hero-title">
      <img
        className="hero__img"
        src={heroImage}
        alt=""
        aria-hidden="true"
        loading="eager"
      />
      <div className="hero__veil" aria-hidden="true" />
      <div className="container hero__inner">
        <div>
          <p className="hero__eyebrow">LUXORA ESTATES</p>
          <h1 className="hero__title" id="hero-title">
            FIND YOUR PLACE IN THE WORLD.
          </h1>
          <p className="hero__lede">
            Discover exceptional homes, inspiring spaces, and investment
            opportunities tailored to your lifestyle.
          </p>
          <div className="hero__actions">
            <Link to="#featured" className="btn btn--gold">
              Explore Featured Homes
            </Link>
          </div>
          <p className="hero__cities">
            Bengaluru · Mumbai · Pune · Hyderabad · Chennai
          </p>
        </div>
        <SearchPanel />
      </div>
    </section>
  );
}
