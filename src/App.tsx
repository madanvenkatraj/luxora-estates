import { useEffect } from "react";
import {
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import AgentsPage from "./pages/AgentsPage";
import SellPage from "./pages/SellPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ToolsPage from "./pages/ToolsPage";
import NotFoundPage from "./pages/NotFoundPage";
import SandboxPage from "./pages/SandboxPage";

/** Scrolls to top on navigation; restores anchor positions. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <ScrollToTop />
      <Navbar />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/property/:slug" element={<PropertyDetailsPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
