import { Link } from "react-router-dom";
import { GUIDES } from "../data/properties";
import SmartImage from "./SmartImage";
import Reveal from "./Reveal";
import { ArrowRightIcon } from "./Icon";

/** Editorial guide cards. There is no guide-detail route in this build,
 * so "Read More" routes to the contact page and the section's note says
 * the articles are demonstration summaries. */
export default function GuidesSection() {
  return (
    <section className="section section--white" aria-labelledby="guides-title">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Property guides</span>
          <h2 id="guides-title">Guides for Every Stage of the Journey</h2>
          <p>
            Plain-language articles on buying, financing and choosing an area,
            free to read and free of form gates.
          </p>
        </Reveal>
        <div className="cards-grid guides-grid">
          {GUIDES.map((guide, i) => (
            <Reveal key={guide.id} delay={(i % 3) * 70}>
              <article className="guide-card" style={{ height: "100%" }}>
                <div className="guide-card__media">
                  <SmartImage
                    src={guide.image}
                    alt={`Cover image for the guide: ${guide.title}`}
                    className="guide-card__img"
                    eager={i < 3}
                  />
                </div>
                <div className="guide-card__body">
                  <span className="guide-card__cat">{guide.category}</span>
                  <h3>{guide.title}</h3>
                  <p className="guide-card__excerpt">{guide.excerpt}</p>
                  <div className="guide-card__foot">
                    <span className="guide-card__time">
                      {guide.readTimeMinutes} min read
                    </span>
                    <Link
                      className="guide-card__more"
                      to="/contact"
                      aria-label={`Read more about ${guide.title} — opens the contact page`}
                    >
                      Read More
                      <ArrowRightIcon size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="demo-note section-note">
          <strong>Demonstration content.</strong> The guide cards above are
          demonstration summaries — full articles are not published on this
          build, and Read More opens the contact page.
        </p>
      </div>
    </section>
  );
}
