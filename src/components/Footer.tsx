import { Link } from "react-router-dom";
import { PhoneIcon, MailIcon, PinIcon } from "./Icon";

const BUY_LINKS = [
  { label: "All Properties", to: "/properties" },
  { label: "Villas", to: "/properties?type=villa" },
  { label: "Apartments", to: "/properties?type=apartment" },
  { label: "Independent Houses", to: "/properties?type=house" },
  { label: "Residential Plots", to: "/properties?type=plot" },
];

const RENT_LINKS = [
  { label: "All Rentals", to: "/properties?intent=rent" },
  { label: "Studio Apartments", to: "/properties?type=studio&intent=rent" },
  { label: "Furnished Homes", to: "/properties?intent=rent&furn=furnished" },
  { label: "Family Homes", to: "/properties?intent=rent&beds=3" },
];

const CATEGORY_LINKS = [
  { label: "Luxury Apartments", to: "/properties?type=apartment" },
  { label: "Premium Villas", to: "/properties?type=villa" },
  { label: "Independent Houses", to: "/properties?type=house" },
  { label: "Commercial Properties", to: "/properties?type=commercial" },
  { label: "Office Spaces", to: "/properties?type=office" },
  { label: "Rental Homes", to: "/properties?intent=rent" },
];

const RESOURCE_LINKS = [
  { label: "Meet the Agents", to: "/agents" },
  { label: "List Your Property", to: "/sell" },
  { label: "Mortgage Calculator", to: "/tools" },
  { label: "Property Guides", to: "/about#guides" },
  { label: "FAQs", to: "/about#faq" },
  { label: "Contact Us", to: "/contact" },
];

const SOCIALS = [
  {
    label: "Facebook",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.6v3H11v7h2.5Z"/></svg>
    ),
  },
  {
    label: "Instagram",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 4.3c2.5 0 2.8 0 3.8.1 2.5.1 3.7 1.3 3.8 3.8.1 1 .1 1.3.1 3.8s0 2.8-.1 3.8c-.1 2.5-1.3 3.7-3.8 3.8-1 .1-1.3.1-3.8.1s-2.8 0-3.8-.1c-2.5-.1-3.7-1.3-3.8-3.8-.1-1-.1-1.3-.1-3.8s0-2.8.1-3.8C4.5 5.7 5.7 4.5 8.2 4.4c1-.1 1.3-.1 3.8-.1ZM12 2.5c-2.6 0-2.9 0-3.9.1-3.4.2-5.3 2-5.5 5.5-.1 1-.1 1.3-.1 3.9s0 2.9.1 3.9c.2 3.4 2 5.3 5.5 5.5 1 .1 1.3.1 3.9.1s2.9 0 3.9-.1c3.4-.2 5.3-2 5.5-5.5.1-1 .1-1.3.1-3.9s0-2.9-.1-3.9c-.2-3.4-2-5.3-5.5-5.5-1-.1-1.3-.1-3.9-.1Zm0 4.6a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Zm0 8a3.2 3.2 0 1 1 0-6.3 3.2 3.2 0 0 1 0 6.3Zm5.1-9.4a1.1 1.1 0 1 0 0-2.3 1.1 1.1 0 0 0 0 2.3Z"/></svg>
    ),
  },
  {
    label: "X",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 4h2.7l-6 6.9L21.5 20h-5.6l-4.4-5.8L6.4 20H3.7l6.4-7.4L3 4h5.7l4 5.3L17.8 4Zm-1 14.4h1.5L8.4 5.5H6.8l10 12.9Z"/></svg>
    ),
  },
  {
    label: "LinkedIn",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.9 8.6H4.2V20h2.7V8.6ZM5.5 7.3a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2Zm13.6 6.1c0-3-1.6-4.4-3.8-4.4-1.8 0-2.6 1-3 1.7V8.6H9.6V20h2.7v-6c0-1.6.6-2.6 2-2.6s1.9 1 1.9 2.6v6h2.9v-4.6Z"/></svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="navbar__logo" aria-label="LUXORA ESTATES home">
              <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="7" fill="rgba(248,246,240,0.08)" />
                <path d="M9 23V9h2.4v11.6H23V23H9z" fill="var(--gold)" />
              </svg>
              <span className="navbar__logo-text">
                LUXORA <em>ESTATES</em>
              </span>
            </Link>
            <p>
              Exceptional homes, inspiring spaces and considered investment
              opportunities across India's most liveable cities.
            </p>
            <div className="footer__social">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={`LUXORA on ${s.label} (placeholder link)`}
                  onClick={(e) => e.preventDefault()}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3>Buy & Rent</h3>
            <div className="footer__links">
              {BUY_LINKS.map((l) => (
                <Link key={l.label} to={l.to}>{l.label}</Link>
              ))}
            </div>
            <h3 style={{ marginTop: 24 }}>Rentals</h3>
            <div className="footer__links">
              {RENT_LINKS.map((l) => (
                <Link key={l.label} to={l.to}>{l.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h3>Categories</h3>
            <div className="footer__links">
              {CATEGORY_LINKS.map((l) => (
                <Link key={l.label} to={l.to}>{l.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h3>Resources</h3>
            <div className="footer__links">
              {RESOURCE_LINKS.map((l) => (
                <Link key={l.label} to={l.to}>{l.label}</Link>
              ))}
            </div>
            <h3 style={{ marginTop: 24 }}>Contact</h3>
            <div className="footer__contact">
              <div><PhoneIcon size={15} /> <span>+91 80 4000 XXXX</span></div>
              <div><MailIcon size={15} /> <a href="mailto:hello@luxoraestates.example">hello@luxoraestates.example</a></div>
              <div><PinIcon size={15} /> <span>Level 8, Prestige Towers, MG Road, Bengaluru 560001 (placeholder)</span></div>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>
            © {new Date().getFullYear()} LUXORA ESTATES. Demonstration platform —
            all listings, agents and reviews are sample content.
          </span>
          <span className="footer__legal">
            <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Terms of Use</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
