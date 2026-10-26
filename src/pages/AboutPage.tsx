import PageHero from "../components/PageHero";
import WhyChoose from "../components/WhyChoose";
import GuidesSection from "../components/GuidesSection";
import FaqSection from "../components/FaqSection";
import "../styles/content.css";

/** About page. The footer deep-links to /about#guides and /about#faq,
 * so GuidesSection and FaqSection are wrapped in anchor divs here —
 * the components themselves stay id-free and reusable. */
export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Property Discovery, Done Properly"
        intro="LUXORA ESTATES is a demonstration platform: every listing, agent and review is sample content."
      />
      <WhyChoose />
      <div id="guides" className="anchor-target">
        <GuidesSection />
      </div>
      <div id="faq" className="anchor-target">
        <FaqSection />
      </div>
    </>
  );
}
