import { Link } from "react-router-dom";
import { NEIGHBORHOODS } from "../data/properties";
import { buildSearchHref } from "../lib/filterParams";
import SmartImage from "./SmartImage";
import Reveal from "./Reveal";
import { ArrowRightIcon, PinIcon } from "./Icon";

const CATEGORY_LABELS: Record<string, string> = {
  family: "Family",
  business: "Business",
  premium: "Premium",
  emerging: "Emerging",
};

/** Neighbourhood guide. Cards are demonstration profiles — the caption
 * below the grid says so, and "Browse homes" links to the listings page
 * with the area pre-filled in the shared location filter. */
export default function NeighborhoodGuide() {
  return (
    <section className="section section--white" aria-labelledby="neighborhoods-title">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Neighbourhoods</span>
          <h2 id="neighborhoods-title">Find the Area That Fits Your Life</h2>
          <p>
            A short profile of each area we cover — its pace, its streets, its
            weekend. Every card links straight into the listings with that
            area pre-filled in the search.
          </p>
        </Reveal>
        <div className="cards-grid">
          {NEIGHBORHOODS.map((hood, i) => (
            <Reveal key={hood.id} delay={(i % 3) * 70}>
              <article className="hood-card" style={{ height: "100%" }}>
                <SmartImage
                  src={hood.image}
                  alt={`${hood.name}, ${hood.city} — demonstration neighbourhood image`}
                  className="hood-card__img"
                  eager={i < 3}
                />
                <div className="hood-card__scrim" aria-hidden="true" />
                <span className={`badge badge--gold hood-card__cat`}>
                  {CATEGORY_LABELS[hood.category] ?? hood.category}
                </span>
                <div className="hood-card__body">
                  <h3>{hood.name}</h3>
                  <p className="hood-card__city">
                    <PinIcon size={13} />
                    {hood.city}
                  </p>
                  <p className="hood-card__desc">{hood.description}</p>
                  <Link
                    className="hood-card__link"
                    to={buildSearchHref({ location: hood.name })}
                  >
                    Browse homes
                    <ArrowRightIcon size={15} />
                    <span className="sr-only">
                      {" "}in {hood.name}, {hood.city}
                    </span>
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="demo-note section-note">
          <strong>Demonstration data.</strong> These are demonstration
          neighbourhood profiles, not verified local data.
        </p>
      </div>
    </section>
  );
}
