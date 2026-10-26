import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import { Link, useParams } from "react-router-dom";
import { PROPERTIES, AGENTS } from "../data/properties";
import { fetchAgents, fetchPropertyBySlug, submitInquiry } from "../lib/api";
import type { InquiryResult } from "../lib/api";
import { formatINR, formatINRFull, formatArea } from "../lib/format";
import {
  AMENITY_ICONS,
  PROPERTY_TYPE_LABELS,
  FURNISHING_LABELS,
} from "../types";
import type { Agent, ListingStatus, NearbyPlace, Property } from "../types";
import SmartImage from "../components/SmartImage";
import MapView from "../components/MapView";
import {
  BedIcon,
  BathIcon,
  AreaIcon,
  PinIcon,
  PhoneIcon,
  MailIcon,
  ShareIcon,
  CalendarIcon,
  InfoIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../components/Icon";
import "../styles/details.css";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Form field element ids in visual order, so a server-side field
 * error moves focus to the first offending field. */
const INQ_FIELD_IDS = ["inq-name", "inq-email", "inq-phone", "inq-message"] as const;
type InqFieldKey = "name" | "email" | "phone" | "message";

/** The minimum time the "Sending…" state stays visible, whatever the
 * demo API's latency (or absence of it) — the beat the demo always had. */
const MIN_SEND_MS = 900;

const STATUS_BADGE: Record<ListingStatus, { cls: string; label: string } | null> = {
  featured: { cls: "badge--gold", label: "Featured" },
  new: { cls: "badge--new", label: "New" },
  reduced: { cls: "badge--reduced", label: "Reduced" },
  standard: null,
};

const NEARBY_GROUP_LABELS: Record<NearbyPlace["category"], string> = {
  school: "Schools",
  hospital: "Hospitals & Clinics",
  shopping: "Shopping",
  transport: "Transport",
};
const NEARBY_ORDER: NearbyPlace["category"][] = [
  "school",
  "hospital",
  "shopping",
  "transport",
];

function telHref(raw: string): string {
  return `tel:${raw.replace(/\s+/g, "")}`;
}

/** The listing agent's dataset phone; never invented. */
function getAgentPhone(property: Property, agents: Agent[]): string {
  const agent = agents.find((a) => a.id === property.agentId);
  return agent?.phone ?? "+91 98XXX XXX00";
}

/** Which trigger produced the current draft: the Schedule a Visit
 * button marks its prefill so the submitted inquiry is recorded with
 * the matching kind. Everything else submits as a property inquiry. */
type InquiryTrigger = "schedule-visit" | "property-inquiry";

interface InquiryDraft {
  text: string;
  nonce: number;
  /** Schedule-a-Visit / More-Info clicks validate the empty form
   * immediately, so the required-field errors surface up front. */
  validateNow: boolean;
  /** Kind marker set by the trigger that prefilled the draft. */
  kind: InquiryTrigger;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PropertyDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [remoteProperty, setRemoteProperty] = useState<Property | null>(null);
  const [remoteAgents, setRemoteAgents] = useState<Agent[] | null>(null);
  const [inquiryDraft, setInquiryDraft] = useState<InquiryDraft>({
    text: "",
    nonce: 0,
    validateNow: false,
    kind: "property-inquiry",
  });

  // Hydrate from the demo API when it answers with real data; the
  // static dataset renders first and keeps the page complete when the
  // API is unreachable. State resets on slug change so a listing from
  // a previously viewed property can never leak into this render.
  useEffect(() => {
    let alive = true;
    setRemoteProperty(null);
    setRemoteAgents(null);
    if (slug !== undefined && slug !== "") {
      fetchPropertyBySlug(slug).then((p) => {
        if (alive && p !== null) setRemoteProperty(p);
      });
    }
    fetchAgents().then((list) => {
      if (alive && list.length > 0) setRemoteAgents(list);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  /* Schedule a Visit / Request More Information: prefill the inquiry
   * message, scroll the form into view and focus its first field.
   * The trigger also marks the draft's kind, so the submitted inquiry
   * is recorded with the matching type instead of guessing from text. */
  const requestInquiry = useCallback(
    (text: string, kind: InquiryTrigger) => {
      setInquiryDraft((d) => ({
        text,
        nonce: d.nonce + 1,
        validateNow: true,
        kind,
      }));
      window.setTimeout(() => {
        document
          .getElementById("pd-inquiry")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        const name = document.getElementById("inq-name") as HTMLInputElement | null;
        name?.focus({ preventScroll: true });
      }, 80);
    },
    [],
  );

  const staticProperty = PROPERTIES.find((p) => p.slug === slug);
  // Prefer the API copy for THIS slug; a stale remote listing from a
  // previous slug is never shown.
  const property =
    remoteProperty !== null && remoteProperty.slug === slug
      ? remoteProperty
      : staticProperty;

  if (!property) {
    return <PropertyNotFound />;
  }

  const agents = remoteAgents ?? AGENTS;
  const agent =
    agents.find((a) => a.id === property.agentId) ??
    AGENTS.find((a) => a.id === property.agentId);

  return (
    <>
      <PropertyHero property={property} />
      <div className="pd-main">
        <div className="container">
          <div className="pd-grid">
            <div>
              <Gallery key={property.id} property={property} />
              <Specs property={property} />
              <section className="pd-section" aria-labelledby="pd-desc-h">
                <h2 id="pd-desc-h">About this property</h2>
                <p className="pd-description">{property.description}</p>
              </section>
              <Amenities amenities={property.amenities} />
              <FloorPlanPlaceholder />
              <Nearby nearby={property.nearby} />
              <section
                className="pd-section pd-location"
                aria-labelledby="pd-loc-h"
              >
                <h2 id="pd-loc-h">Location</h2>
                <p className="pd-description">
                  {property.location.locality}, {property.location.city} — the
                  sample map below shows every demo listing's rough position.
                </p>
                <MapView key={property.id} properties={PROPERTIES} />
              </section>
            </div>

            <aside className="pd-side" aria-label="Agent and inquiry">
              <AgentCard key={`agent-${property.id}`} agent={agent} />
              <div className="pd-card">
                <h3>Interested in this home?</h3>
                <p className="pd-side__note">
                  Reach the listing agent directly, or leave an inquiry below.
                  Demonstration site — inquiries go to the demo API and no
                  agent receives them.
                </p>
                <Actions
                  key={`actions-${property.id}`}
                  property={property}
                  agents={agents}
                  onInquiry={requestInquiry}
                />
              </div>
              <InquiryForm
                key={`form-${property.id}`}
                property={property}
                draft={inquiryDraft}
              />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Not found                                                           */
/* ------------------------------------------------------------------ */

function PropertyNotFound() {
  return (
    <section className="pd-notfound">
      <div className="container">
        <div className="pd-notfound__inner">
          <div className="pd-notfound__icon">
            <PinIcon size={26} />
          </div>
          <h1>Property not found</h1>
          <p>
            We couldn't find a listing at this address. It may have been
            removed from our sample set, or the link may be mistyped.
          </p>
          <div className="pd-notfound__actions">
            <Link to="/properties" className="btn btn--gold">
              Browse Properties
            </Link>
            <Link to="/" className="btn btn--outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function PropertyHero({ property }: { property: Property }) {
  const status = STATUS_BADGE[property.status];
  const isRent = property.intent === "rent";
  return (
    <section className="pd-hero">
      <div className="container">
        <div>
          <nav className="pd-crumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="pd-crumb__sep" aria-hidden="true">/</span>
            <Link to="/properties">Properties</Link>
            <span className="pd-crumb__sep" aria-hidden="true">/</span>
            <span aria-current="page">{property.title}</span>
          </nav>
          <p className="pd-crumb" style={{ marginBottom: 0 }}>
            {PROPERTY_TYPE_LABELS[property.type]} · Ref {property.referenceId}
          </p>
          <h1>{property.title}</h1>
          <p className="pd-addr">
            <PinIcon size={14} />
            <span>
              {property.location.address}, {property.location.locality},{" "}
              {property.location.city}
            </span>
          </p>
          <div className="pd-hero__badges">
            <span className={`badge ${isRent ? "badge--rent" : "badge--navy"}`}>
              {isRent ? "For Rent" : "For Sale"}
            </span>
            {status && (
              <span className={`badge ${status.cls}`}>{status.label}</span>
            )}
          </div>
        </div>
        <div className="pd-hero__price">
          <span className="pd-price">
            {isRent ? formatINRFull(property.price) : formatINR(property.price)}
          </span>
          <span className="pd-price-note">
            {isRent ? "per month" : "asking price"}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery                                                             */
/* ------------------------------------------------------------------ */

function Gallery({ property }: { property: Property }) {
  const [index, setIndex] = useState(0);
  const count = property.images.length;

  const next = useCallback(() => {
    setIndex((i) => (count === 0 ? 0 : (i + 1) % count));
  }, [count]);
  const prev = useCallback(() => {
    setIndex((i) => (count === 0 ? 0 : (i - 1 + count) % count));
  }, [count]);

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (count === 0) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  };

  const current = property.images[index] ?? property.images[0] ?? "";
  const alt =
    count > 0
      ? `${property.title} — photo ${index + 1} of ${count}`
      : property.title;

  return (
    <div className="pd-gallery" data-testid="pd-gallery">
      <div
        className="pd-gallery__stage"
        role="group"
        aria-label={`Photo gallery: ${property.title}. Use the left and right arrow keys to change photo.`}
        tabIndex={0}
        onKeyDown={onKey}
      >
        <SmartImage src={current} alt={alt} eager key={current} />
        {count > 1 && (
          <>
            <button
              type="button"
              className="pd-gallery__nav pd-gallery__nav--prev"
              aria-label="Previous photo"
              onClick={prev}
            >
              <ChevronLeftIcon size={20} />
            </button>
            <button
              type="button"
              className="pd-gallery__nav pd-gallery__nav--next"
              aria-label="Next photo"
              onClick={next}
            >
              <ChevronRightIcon size={20} />
            </button>
            <span className="pd-gallery__count" aria-live="polite">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="pd-gallery__thumbs" aria-label="Photo thumbnails">
          {property.images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={`pd-thumb${i === index ? " is-active" : ""}`}
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              <SmartImage src={src} alt="" />
            </button>
          ))}
        </div>
      )}
      <p className="pd-gallery__hint">
        Tip: focus the photo and use the ← → arrow keys, or pick a thumbnail.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Specs                                                               */
/* ------------------------------------------------------------------ */

function Specs({ property }: { property: Property }) {
  const items: Array<{ label: string; value: string; icon?: ReactNode }> = [
    {
      label: "Bedrooms",
      value: property.bedrooms > 0 ? String(property.bedrooms) : "—",
      icon: <BedIcon size={14} />,
    },
    {
      label: "Bathrooms",
      value: property.bathrooms > 0 ? String(property.bathrooms) : "—",
      icon: <BathIcon size={14} />,
    },
    {
      label: "Area",
      value: formatArea(property.areaSqft),
      icon: <AreaIcon size={14} />,
    },
    { label: "Parking", value: String(property.parking) },
    { label: "Facing", value: property.facing },
    { label: "Floor", value: property.floor },
    { label: "Year built", value: String(property.yearBuilt) },
    { label: "Furnishing", value: FURNISHING_LABELS[property.furnishing] },
  ];
  return (
    <dl className="pd-specs" data-testid="pd-specs">
      {items.map((it) => (
        <div className="pd-spec" key={it.label}>
          <dt>
            {it.icon}
            {it.label}
          </dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* Amenities                                                           */
/* ------------------------------------------------------------------ */

function Amenities({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) return null;
  return (
    <section
      className="pd-section"
      aria-labelledby="pd-am-h"
      data-testid="pd-amenities"
    >
      <h2 id="pd-am-h">Amenities</h2>
      <ul className="pd-amenities">
        {amenities.map((a) => (
          <li className="pd-amenity" key={a}>
            <span className="pd-amenity__icon" aria-hidden="true">
              {AMENITY_ICONS[a] ?? "✦"}
            </span>
            {a}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Floor plan placeholder                                              */
/* ------------------------------------------------------------------ */

function FloorPlanPlaceholder() {
  return (
    <section className="pd-section" aria-labelledby="pd-fp-h">
      <h2 id="pd-fp-h">Floor plan</h2>
      <div className="pd-floorplan">
        <svg width="150" height="110" viewBox="0 0 150 110" aria-hidden="true">
          <rect
            x="8"
            y="8"
            width="134"
            height="94"
            rx="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M8 56h58M66 8v48M66 56h76M112 56v46"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M20 22h30M20 30h18"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
        <strong>Illustration placeholder — not an actual floor plan</strong>
        <p>
          A dimensioned floor plan for this residence would appear here. This
          sample build ships with a placeholder drawing instead of pretending
          to show real measurements.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Nearby places                                                       */
/* ------------------------------------------------------------------ */

function Nearby({ nearby }: { nearby: NearbyPlace[] }) {
  const groups = NEARBY_ORDER.filter((c) =>
    nearby.some((n) => n.category === c),
  );
  return (
    <section
      className="pd-section"
      aria-labelledby="pd-nb-h"
      data-testid="pd-nearby"
    >
      <h2 id="pd-nb-h">Nearby places</h2>
      <p className="pd-description" style={{ marginBottom: 16 }}>
        Sample information — distances are illustrative figures from the
        demonstration dataset, not surveyed measurements.
      </p>
      <div className="pd-nearby">
        {groups.map((c) => (
          <div className="pd-nearby__group" key={c}>
            <h3>{NEARBY_GROUP_LABELS[c]}</h3>
            <ul className="pd-nearby__list">
              {nearby
                .filter((n) => n.category === c)
                .map((n) => (
                  <li className="pd-nearby__item" key={n.name}>
                    <strong>{n.name}</strong>
                    <span className="pd-nearby__dist">{n.distanceKm} km</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Agent card                                                          */
/* ------------------------------------------------------------------ */

function AgentCard({ agent }: { agent: Agent | undefined }) {
  if (!agent) return null;
  return (
    <div className="pd-card" data-testid="pd-agent">
      <h3>Listed by</h3>
      <div className="pd-agent">
        <div className="pd-agent__photo">
          <SmartImage
            src={agent.photo}
            alt={`Portrait of ${agent.name} (sample agent)`}
            eager
          />
        </div>
        <div>
          <p className="pd-agent__name">{agent.name}</p>
          <p className="pd-agent__title">{agent.title}</p>
          <p className="pd-agent__spec">{agent.specialty}</p>
        </div>
      </div>
      <div className="pd-agent__meta">
        <span>
          {agent.experienceYears} years experience · {agent.listingsCount}{" "}
          active sample listings
        </span>
        <a href={telHref(agent.phone)}>
          <PhoneIcon size={15} /> {agent.phone}
        </a>
        <a href={`mailto:${agent.email}`}>
          <MailIcon size={15} /> {agent.email}
        </a>
      </div>
      <div className="pd-agent__badge">
        <span className="demo-note" style={{ display: "inline-flex" }}>
          <InfoIcon size={14} />
          <span>
            <strong>Sample agent</strong> — fictional profile with placeholder
            contact details from the dataset.
          </span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function Actions({
  property,
  agents,
  onInquiry,
}: {
  property: Property;
  agents: Agent[];
  onInquiry: (message: string, kind: InquiryTrigger) => void;
}) {
  const [shareState, setShareState] = useState<"copied" | "shared" | null>(null);
  const shareTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(shareTimer.current);
  }, []);

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: property.title, url });
        setShareState("shared");
      } else {
        throw new Error("no native share");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const ok = await copyToClipboard(url);
      setShareState(ok ? "copied" : null);
    }
    window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => setShareState(null), 2600);
  }, [property.title]);

  return (
    <div className="pd-actions" data-testid="pd-actions">
      <button
        type="button"
        className="btn btn--gold"
        onClick={() =>
          onInquiry(
            `I would like to book a viewing of ${property.title} (Ref ${property.referenceId}).`,
            "schedule-visit",
          )
        }
      >
        <CalendarIcon size={16} /> Schedule a Visit
      </button>
      <button
        type="button"
        className="btn btn--outline"
        onClick={() =>
          onInquiry(
            `Please send me more information about ${property.title} (Ref ${property.referenceId}).`,
            "property-inquiry",
          )
        }
      >
        <InfoIcon size={16} /> Request More Information
      </button>
      <a className="btn btn--navy" href={telHref(getAgentPhone(property, agents))}>
        <PhoneIcon size={16} /> Call Agent
      </a>
      <button type="button" className="btn btn--outline" onClick={share}>
        <ShareIcon size={16} /> Share Property
      </button>
      <p className="pd-share-confirm" aria-live="polite">
        {shareState === "copied" && (
          <>
            <CheckIcon size={14} /> Link copied to clipboard.
          </>
        )}
        {shareState === "shared" && (
          <>
            <CheckIcon size={14} /> Share sheet opened.
          </>
        )}
      </p>
    </div>
  );
}

/** Clipboard write with a legacy fallback for non-secure contexts. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Inquiry form                                                        */
/* ------------------------------------------------------------------ */

function InquiryForm({
  property,
  draft,
}: {
  property: Property;
  draft: InquiryDraft;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: `I'm interested in ${property.title} (Ref ${property.referenceId}).`,
  });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  /** Outcome of the POST, kept so the confirmation copy can be
   * truthful about what actually happened. */
  const [result, setResult] = useState<InquiryResult | null>(null);
  /** Field messages returned by the demo API's 400 validation. */
  const [serverErrors, setServerErrors] = useState<
    Record<string, string> | undefined
  >(undefined);
  /** Set when the demo API answers 429. */
  const [rateLimited, setRateLimited] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  /* A Schedule-a-Visit / More-Info request arrives here: reset the form
   * (also from the "sent" state) and prefill the message. Validation
   * errors are derived below, so they surface in the same render pass. */
  const formRef = useRef(form);
  formRef.current = form;
  useEffect(() => {
    if (draft.nonce === 0) return;
    setStatus("idle");
    setResult(null);
    setServerErrors(undefined);
    setRateLimited(false);
    setForm((f) => ({ ...f, message: draft.text }));
  }, [draft]);

  const validate = (s: { name: string; email: string }) => {
    const errs: Partial<Record<"name" | "email", string>> = {};
    if (s.name.trim().length === 0) {
      errs.name = "Please enter your name.";
    }
    if (!EMAIL_RE.test(s.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    return errs;
  };

  /* Derived validation: a Schedule-a-Visit / More-Info click raises
   * draft.validateNow in the parent's state batch, so the required-field
   * errors show in the SAME commit as the click — no effect timing. A
   * failed submit raises the flag permanently via submittedOnce. */
  const errors = draft.validateNow || submitted ? validate(form) : {};

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Client-side first-pass validation is unchanged and still runs
    // first; the demo API is only called once it passes.
    const errs = validate(form);
    setSubmitted(true);
    setServerErrors(undefined);
    setRateLimited(false);
    if (errs.name || errs.email) {
      const first = errs.name ? "inq-name" : "inq-email";
      document.getElementById(first)?.focus();
      return;
    }
    setStatus("sending");
    const startedAt = Date.now();
    const apply = (res: InquiryResult) => {
      setResult(res);
      if (res.ok !== true && res.fieldErrors !== undefined) {
        // The demo API rejected specific fields: keep the form open and
        // map its messages onto the existing inline error elements.
        // The client-side first-pass validation above is unchanged.
        setServerErrors(res.fieldErrors);
        setStatus("idle");
        const first = INQ_FIELD_IDS.find(
          (id) => res.fieldErrors?.[id.replace("inq-", "")] !== undefined,
        );
        if (first !== undefined) document.getElementById(first)?.focus();
        return;
      }
      if (res.rateLimited === true) setRateLimited(true);
      setStatus("sent");
      window.setTimeout(() => successRef.current?.focus(), 30);
    };
    submitInquiry({
      kind: draft.kind,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() === "" ? undefined : form.phone.trim(),
      message: form.message.trim() === "" ? undefined : form.message.trim(),
      propertySlug: property.slug,
      propertyRef: property.referenceId,
    }).then((res) => {
      const wait = Math.max(0, MIN_SEND_MS - (Date.now() - startedAt));
      if (wait === 0) apply(res);
      else timer.current = window.setTimeout(() => apply(res), wait);
    });
  };

  const update = (key: InqFieldKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Editing a field clears the server's message for it.
    setServerErrors((s) => {
      if (s === undefined || s[key] === undefined) return s;
      const next = { ...s };
      delete next[key];
      return Object.keys(next).length > 0 ? next : undefined;
    });
  };

  /** The message an inline error element should show: the server's
   * field message when the API rejected the field, otherwise the
   * client's own validation message. Client-side first-pass
   * validation is never replaced — this only adds server detail.
   * Only name and email carry client-side messages; phone and
   * message are validated by the demo API alone. */
  const errorFor = (key: InqFieldKey): string | undefined =>
    serverErrors?.[key] ??
    (key === "name" || key === "email" ? errors[key] : undefined);

  if (status === "sent") {
    const ok = result?.ok === true;
    return (
      <div className="pd-card" data-testid="pd-inquiry-success">
        <div className="pd-form__success" ref={successRef} tabIndex={-1}>
          <CheckIcon size={28} />
          <h3>Inquiry recorded</h3>
          <p>
            Thank you, {form.name.trim()}. Your inquiry about{" "}
            <strong>{property.title}</strong> (Ref {property.referenceId}) was
            {ok
              ? <> received by the demo API{result?.id !== undefined ? <> — reference {result.id}</> : null}.</>
              : rateLimited
                ? <> not submitted.</>
                : <> recorded locally only.</>}
          </p>
          {rateLimited && (
            <p className="error" role="alert">
              Too many submissions — please wait a moment and try again.
            </p>
          )}
          {ok ? (
            <p className="demo-note">
              <InfoIcon size={14} />
              <span>
                <strong>Demo only:</strong> the demo API records it for this
                demonstration; no agent received it and no email left your
                browser.
              </span>
            </p>
          ) : rateLimited ? (
            <p className="demo-note">
              <InfoIcon size={14} />
              <span>
                <strong>Demo only:</strong> the demo API limited this
                submission, so nothing was recorded — please wait a moment
                and try again.
              </span>
            </p>
          ) : (
            <p className="demo-note">
              <InfoIcon size={14} />
              <span>
                <strong>Demo only:</strong> the demo API is unreachable right
                now, so the inquiry was recorded locally in the page session —
                no agent received it and no email left your browser.
              </span>
            </p>
          )}
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => {
              setStatus("idle");
              setSubmitted(false);
              setResult(null);
              setServerErrors(undefined);
              setRateLimited(false);
              setForm({
                name: "",
                email: "",
                phone: "",
                message: `I'm interested in ${property.title} (Ref ${property.referenceId}).`,
              });
            }}
          >
            Send another inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-card" data-testid="pd-inquiry">
      <h3>Ask a question or book a viewing</h3>
      <p className="demo-note" style={{ marginBottom: 4 }}>
        <InfoIcon size={14} />
        <span>
          <strong>Demonstration form</strong> — a valid submission is sent to
          the demo API; if it is unreachable the inquiry is recorded locally
          instead. No agent receives it either way.
        </span>
      </p>
      <form id="pd-inquiry" className="pd-form" noValidate onSubmit={onSubmit}>
        <div className="pd-form__row">
          <div className="field">
            <label htmlFor="inq-name">
              Name <span className="req" aria-hidden="true">*</span>
            </label>
            <input
              id="inq-name"
              className="input"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={errorFor("name") ? true : undefined}
              aria-describedby={errorFor("name") ? "inq-name-err" : undefined}
            />
            {errorFor("name") && (
              <p className="error" id="inq-name-err" data-testid="inq-name-err" role="alert">
                {errorFor("name")}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="inq-email">
              Email <span className="req" aria-hidden="true">*</span>
            </label>
            <input
              id="inq-email"
              className="input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={errorFor("email") ? true : undefined}
              aria-describedby={errorFor("email") ? "inq-email-err" : undefined}
            />
            {errorFor("email") && (
              <p className="error" id="inq-email-err">
                {errorFor("email")}
              </p>
            )}
          </div>
        </div>
        <div className="field">
          <label htmlFor="inq-phone">Phone (optional)</label>
          <input
            id="inq-phone"
            className="input"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={errorFor("phone") ? true : undefined}
            aria-describedby={errorFor("phone") ? "inq-phone-err" : undefined}
          />
          {errorFor("phone") && (
            <p className="error" id="inq-phone-err">
              {errorFor("phone")}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="inq-message">Message</label>
          <textarea
            id="inq-message"
            className="textarea"
            rows={4}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            aria-invalid={errorFor("message") ? true : undefined}
            aria-describedby={errorFor("message") ? "inq-message-err" : undefined}
          />
          {errorFor("message") && (
            <p className="error" id="inq-message-err">
              {errorFor("message")}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="btn btn--gold"
          disabled={status === "sending"}
          aria-busy={status === "sending"}
        >
          {status === "sending" ? (
            <>
              <span className="spinner" aria-hidden="true" /> Sending…
            </>
          ) : (
            "Send Inquiry"
          )}
        </button>
      </form>
    </div>
  );
}
