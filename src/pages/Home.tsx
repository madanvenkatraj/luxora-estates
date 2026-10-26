import Hero from "../components/Hero";
import PropertyDiscovery from "../components/PropertyDiscovery";
import FeaturedProperties from "../components/FeaturedProperties";

/** Home page — composed in the integration task. Sections currently
 * show foundation placeholders where the parallel builds haven't
 * landed yet. */
export default function Home() {
  return (
    <>
      <Hero />
      <PropertyDiscovery />
      <FeaturedProperties />
    </>
  );
}
