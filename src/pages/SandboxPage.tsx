import { PROPERTIES } from "../data/properties";
import PropertyCard from "../components/PropertyCard";

/** Internal harness page (/sandbox) used while building sections in
 * parallel. Shows every property card on one page to exercise the
 * shared card + favourites store. Safe to leave in the built app. */
export default function SandboxPage() {
  return (
    <section className="section section--ivory">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Internal</span>
          <h2>Component Sandbox</h2>
          <p>
            Harness page for development. Every sample property rendered
            through the shared PropertyCard, exercising favourites.
          </p>
        </div>
        <div className="cards-grid">
          {PROPERTIES.map((p, i) => (
            <PropertyCard key={p.id} property={p} eager={i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}
