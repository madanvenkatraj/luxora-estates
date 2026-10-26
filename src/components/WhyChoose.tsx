import Reveal from "./Reveal";
import { CompassIcon, DocsIcon, HandshakeIcon, ShieldIcon } from "./Icon";

const REASONS: {
  title: string;
  description: string;
  icon: typeof CompassIcon;
}[] = [
  {
    title: "Curated Property Listings",
    description:
      "A focused, well-organised catalogue across flats, villas, offices and plots — each entry structured consistently so comparing homes takes minutes, not hours.",
    icon: CompassIcon,
  },
  {
    title: "Transparent Property Information",
    description:
      "Price, area, furnishing, amenities, age and location details are spelled out on every card, with an honest note wherever the platform is still demonstration content.",
    icon: DocsIcon,
  },
  {
    title: "Personalized Assistance",
    description:
      "Browse freely on your own — then, when you want a human, reach the specialist whose expertise matches the property you are looking at.",
    icon: HandshakeIcon,
  },
  {
    title: "Simplified Property Discovery",
    description:
      "One shared set of filters drives search everywhere on the site, so a shortlist you build from a neighbourhood card behaves exactly the same on the listings page.",
    icon: ShieldIcon,
  },
];

/** Why-choose section (used on Home and About). Describes what the
 * platform offers — no claims about verification, security or returns. */
export default function WhyChoose() {
  return (
    <section className="section section--white" aria-labelledby="why-choose-title">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Why choose us</span>
          <h2 id="why-choose-title">Built Around the Way People Actually Search</h2>
          <p>
            Property hunting fails quietly: scattered listings, missing details,
            agents who appear only at the end. LUXORA is organised to fix that,
            one plain decision at a time.
          </p>
        </Reveal>
        <div className="cards-grid cards-grid--4">
          {REASONS.map((r, i) => (
            <Reveal key={r.title} delay={i * 60}>
              <article className="why-card" style={{ height: "100%" }}>
                <span className="why-card__icon" aria-hidden="true">
                  <r.icon size={24} />
                </span>
                <h3>{r.title}</h3>
                <p>{r.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
