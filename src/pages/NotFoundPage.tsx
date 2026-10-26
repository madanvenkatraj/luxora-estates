import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-hero" style={{ textAlign: "center" }}>
      <div className="container">
        <p style={{ letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", fontSize: "0.8rem" }}>
          404 — Page not found
        </p>
        <h1>This address isn't on our books.</h1>
        <p style={{ margin: "14px auto 24px" }}>
          The page you're after may have moved or never existed. Head back to
          the listings and find a place that feels like home.
        </p>
        <Link to="/properties" className="btn btn--gold">Browse Properties</Link>
      </div>
    </section>
  );
}
