import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFavorites } from "../context/FavoritesContext";
import { SearchIcon, HeartIcon, MenuIcon, CloseIcon } from "./Icon";

interface NavItem {
  to: string;
  label: string;
  /** Path used for active-state matching (query part stripped). */
  match: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", match: "/" },
  { to: "/properties?intent=buy", label: "Buy Property", match: "/properties" },
  { to: "/properties?intent=rent", label: "Rent Property", match: "/properties" },
  { to: "/sell", label: "Sell Property", match: "/sell" },
  { to: "/properties?type=commercial", label: "Commercial", match: "/properties" },
  { to: "/agents", label: "Agents", match: "/agents" },
  { to: "/about", label: "About Us", match: "/about" },
  { to: "/contact", label: "Contact", match: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useFavorites();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [open]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    navigate(q ? `/properties?location=${encodeURIComponent(q)}` : "/properties");
  };

  return (
    <>
      <div className="announce" role="note">
        FIND A PLACE THAT FEELS LIKE HOME.
      </div>
      <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="container navbar__inner">
          <Link to="/" className="navbar__logo" aria-label="LUXORA ESTATES home">
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="var(--navy)" />
              <path d="M9 23V9h2.4v11.6H23V23H9z" fill="var(--gold)" />
            </svg>
            <span className="navbar__logo-text">
              LUXORA <em>ESTATES</em>
            </span>
          </Link>

          <nav className="navbar__nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item, location);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`navbar__link ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="navbar__actions">
            <form role="search" onSubmit={submitSearch} className="navbar__searchform">
              <label className="sr-only" htmlFor="nav-search">
                Search properties by locality or city
              </label>
              <input
                id="nav-search"
                name="q"
                type="search"
                placeholder="Search locality, city…"
                className="input navbar__searchinput"
              />
            </form>
            <Link to="/properties" className="iconbtn" aria-label="Open property search">
              <SearchIcon />
            </Link>
            <Link
              to="/properties?fav=1"
              className="iconbtn"
              aria-label={`Favourites, ${count} saved`}
            >
              <HeartIcon />
              {count > 0 && (
                <span className="iconbtn__badge" aria-hidden="true">
                  {count}
                </span>
              )}
            </Link>
            <Link to="/sell" className="btn btn--gold btn--sm navbar__cta">
              List Your Property
            </Link>
            <button
              type="button"
              className="iconbtn navbar__burger"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-drawer"
              onClick={() => setOpen(true)}
            >
              <MenuIcon size={22} />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`drawer-backdrop ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="mobile-drawer"
        className={`drawer ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        aria-label="Mobile menu"
      >
        <div className="drawer__head">
          <span className="navbar__logo-text">
            LUXORA <em>ESTATES</em>
          </span>
          <button
            type="button"
            className="drawer__close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <nav aria-label="Mobile primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="drawer__link"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="drawer__foot">
          <Link
            to="/sell"
            className="btn btn--gold"
            onClick={() => setOpen(false)}
          >
            List Your Property
          </Link>
          <p className="demo-note">
            <strong>Note:</strong> LUXORA ESTATES is a demonstration platform with
            sample listings only.
          </p>
        </div>
      </aside>
    </>
  );
}

function isActive(item: NavItem, location: { pathname: string; search: string }): boolean {
  if (item.match !== location.pathname) return false;
  if (item.match !== "/properties") return item.to === location.pathname;
  // Query-linked entries (Buy/Rent/Commercial) match on exact search string.
  const query = item.to.includes("?") ? item.to.slice(item.to.indexOf("?")) : "";
  return location.search === query;
}
