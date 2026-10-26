import PageHero from "../components/PageHero";
import SellSection from "../components/SellSection";

export default function SellPage() {
  return (
    <>
      <PageHero
        eyebrow="Sell with us"
        title="Ready To Sell Your Property?"
        intro="Tell us about your property and a specialist will be in touch. Demonstration platform: submissions are validated and confirmed locally, not published."
      />
      <SellSection />
    </>
  );
}
