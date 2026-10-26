import AgentsSection from "../components/AgentsSection";
import PageHero from "../components/PageHero";
import "../styles/content.css";

/** Agents page — PageHero wraps the agent showcase. Every profile in
 * AgentsSection is labelled as a sample agent. */
export default function AgentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our people"
        title="Meet Our Property Experts"
        intro="Sample agents for demonstration — each profile below is fictional and will be replaced when real agent accounts are connected."
      />
      <AgentsSection />
    </>
  );
}
