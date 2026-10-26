import { useEffect, useRef, useState, type FormEvent } from "react";
import { submitInquiry } from "../lib/api";
import type { InquiryResult } from "../lib/api";
import { formatINRFull } from "../lib/format";
import { PROPERTY_TYPE_LABELS } from "../types";
import type { PropertyType } from "../types";
import { CheckIcon, CloseIcon, UploadIcon } from "./Icon";
import "../styles/tools.css";

/* Single-instance assumption: fixed element ids are safe because the
 * router renders at most one page (and so one form) at a time. */

interface SellFields {
  name: string;
  email: string;
  phone: string;
  type: PropertyType | "";
  location: string;
  price: string;
  bedrooms: string;
  description: string;
}

const EMPTY: SellFields = {
  name: "",
  email: "",
  phone: "",
  type: "apartment",
  location: "",
  price: "",
  bedrooms: "",
  description: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field order mirrors the visual order, so the first invalid field is
 * the one focus moves to after a failed submit. */
const ORDER: (keyof SellFields)[] = [
  "name",
  "email",
  "phone",
  "type",
  "location",
  "price",
  "bedrooms",
  "description",
];

function validate(f: SellFields): Partial<Record<keyof SellFields, string>> {
  const errors: Partial<Record<keyof SellFields, string>> = {};
  if (f.name.trim() === "") errors.name = "Please enter your name.";
  if (f.email.trim() === "") {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_RE.test(f.email.trim())) {
    errors.email = "Enter a valid email address, e.g. name@example.com.";
  }
  if (f.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Phone number needs at least 10 digits.";
  }
  if (f.location.trim() === "") {
    errors.location = "Please enter the property's location.";
  }
  const price = Number(f.price.trim());
  if (f.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
    errors.price = "Expected price must be greater than zero.";
  }
  const beds = Number(f.bedrooms.trim());
  if (f.bedrooms.trim() !== "" && (!Number.isInteger(beds) || beds < 0)) {
    errors.bedrooms = "Bedrooms must be zero or a whole number.";
  }
  return errors;
}

export default function SellPropertyForm() {
  const [values, setValues] = useState<SellFields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof SellFields, string>>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [phase, setPhase] = useState<"editing" | "submitting" | "confirmed">("editing");
  const [snapshot, setSnapshot] = useState<SellFields>(EMPTY);
  /** Outcome of the POST, so the confirmation can say truthfully
   * whether the demo API received the valuation request. */
  const [result, setResult] = useState<InquiryResult | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  function set<K extends keyof SellFields>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    // Names only — nothing is read, stored or uploaded.
    setPhotos((prev) => [...prev, ...Array.from(list).map((f) => f.name)]);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    // Client-side first-pass validation is unchanged and runs first.
    const found = validate(values);
    setErrors(found);
    const firstInvalid = ORDER.find((k) => found[k]);
    if (firstInvalid) {
      const el = document.getElementById(`sell-${firstInvalid}`);
      if (el instanceof HTMLElement) el.focus();
      return;
    }
    setSnapshot(values);
    setPhase("submitting");
    const startedAt = Date.now();
    const finish = (res: InquiryResult) => {
      const wait = Math.max(0, 600 - (Date.now() - startedAt));
      const show = () => {
        setResult(res);
        setPhase("confirmed");
      };
      if (wait === 0) show();
      else timerRef.current = window.setTimeout(show, wait);
    };
    submitInquiry({
      kind: "sell-valuation",
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() === "" ? undefined : values.phone.trim(),
      location: values.location.trim(),
      expectedPrice: Number(values.price.trim()),
      propertyType: values.type === "" ? undefined : values.type,
      message: values.description.trim() === "" ? undefined : values.description.trim(),
    }).then(finish);
  }

  function reset() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setValues(EMPTY);
    setErrors({});
    setPhotos([]);
    setSnapshot(EMPTY);
    setResult(null);
    setPhase("editing");
  }

  if (phase === "confirmed") {
    return (
      <div className="confirm" role="status" aria-live="polite">
        <div className="confirm__head">
          <span className="confirm__icon" aria-hidden="true">
            <CheckIcon size={22} />
          </span>
          <div>
            <h3>Thank you, {snapshot.name.trim()}.</h3>
            {result?.ok === true ? (
              <p>
                <strong>
                  Your valuation request reached the demo API
                  {result?.id !== undefined ? <> — reference {result.id}</> : null}.
                </strong>{" "}
                This is a demonstration — your property has NOT been published
                and no specialist was contacted.
              </p>
            ) : result?.rateLimited === true ? (
              <p>
                <strong>
                  Too many submissions — please wait a moment and try again.
                </strong>{" "}
                Nothing was recorded this time.
              </p>
            ) : (
              <p>
                <strong>
                  The demo API is unreachable right now, so your submission was
                  recorded locally for demonstration only — your property has
                  NOT been published.
                </strong>{" "}
                No specialist has been contacted.
              </p>
            )}
          </div>
        </div>
        <dl className="confirm__list">
          <div className="confirm__row">
            <dt>Owner</dt>
            <dd>{snapshot.name.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Email</dt>
            <dd>{snapshot.email.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Phone</dt>
            <dd>{snapshot.phone.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Property type</dt>
            <dd>
              {snapshot.type === "" ? "Not specified" : PROPERTY_TYPE_LABELS[snapshot.type]}
            </dd>
          </div>
          <div className="confirm__row">
            <dt>Location</dt>
            <dd>{snapshot.location.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Expected price</dt>
            <dd>{formatINRFull(Number(snapshot.price))}</dd>
          </div>
          <div className="confirm__row">
            <dt>Bedrooms</dt>
            <dd>{snapshot.bedrooms.trim() === "" ? "—" : snapshot.bedrooms.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Description</dt>
            <dd>{snapshot.description.trim() === "" ? "—" : snapshot.description.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Photos</dt>
            <dd>
              {photos.length === 0
                ? "None selected"
                : `${photos.length} file name(s) recorded: ${photos.join(", ")}`}
            </dd>
          </div>
        </dl>
        <p className="demo-note">
          <span className="spinner" aria-hidden="true" />
          <span>
            Demonstration only: this platform stores nothing and publishes
            nothing.
          </span>
        </p>
        <div className="confirm__actions">
          <button type="button" className="btn btn--navy" onClick={reset}>
            List another property
          </button>
        </div>
      </div>
    );
  }

  const busy = phase === "submitting";

  return (
    <form className="sell-form" noValidate onSubmit={submit} aria-busy={busy}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="sell-name">
            Owner name <span className="req" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            id="sell-name"
            className="input"
            type="text"
            autoComplete="name"
            placeholder="Ananya Sharma"
            value={values.name}
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "sell-name-error" : undefined}
            onChange={(e) => set("name", e.target.value)}
          />
          {errors.name && (
            <p className="error" id="sell-name-error" data-testid="sell-name-error" role="alert">{errors.name}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="sell-email">
            Email <span className="req" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            id="sell-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "sell-email-error" : undefined}
            onChange={(e) => set("email", e.target.value)}
          />
          {errors.email && (
            <p className="error" id="sell-email-error" role="alert">{errors.email}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="sell-phone">
            Phone <span className="req" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            id="sell-phone"
            className="input"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={values.phone}
            aria-required="true"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "sell-phone-error" : undefined}
            onChange={(e) => set("phone", e.target.value)}
          />
          {errors.phone && (
            <p className="error" id="sell-phone-error" role="alert">{errors.phone}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="sell-type">Property type</label>
          <select
            id="sell-type"
            className="select"
            value={values.type}
            onChange={(e) => set("type", e.target.value)}
          >
            <option value="">Select a type…</option>
            {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
              <option key={t} value={t}>
                {PROPERTY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="field field--full">
          <label htmlFor="sell-location">
            Location <span className="req" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            id="sell-location"
            className="input"
            type="text"
            placeholder="Locality, city — e.g. Indiranagar, Bengaluru"
            value={values.location}
            aria-required="true"
            aria-invalid={errors.location ? true : undefined}
            aria-describedby={errors.location ? "sell-location-error" : undefined}
            onChange={(e) => set("location", e.target.value)}
          />
          {errors.location && (
            <p className="error" id="sell-location-error" role="alert">{errors.location}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="sell-price">
            Expected price <span className="req" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            id="sell-price"
            className="input"
            type="number"
            min={0}
            step="1000"
            placeholder="8500000"
            value={values.price}
            aria-required="true"
            aria-invalid={errors.price ? true : undefined}
            aria-describedby={errors.price ? "sell-price-error" : undefined}
            onChange={(e) => set("price", e.target.value)}
          />
          {errors.price && (
            <p className="error" id="sell-price-error" role="alert">{errors.price}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="sell-bedrooms">Bedrooms</label>
          <input
            id="sell-bedrooms"
            className="input"
            type="number"
            min={0}
            step="1"
            placeholder="3"
            value={values.bedrooms}
            aria-describedby={errors.bedrooms ? "sell-bedrooms-error" : undefined}
            onChange={(e) => set("bedrooms", e.target.value)}
          />
          {errors.bedrooms && (
            <p className="error" id="sell-bedrooms-error" role="alert">{errors.bedrooms}</p>
          )}
        </div>

        <div className="field field--full">
          <label htmlFor="sell-description">Description</label>
          <textarea
            id="sell-description"
            className="textarea"
            placeholder="Tell buyers about the property — layout, light, amenities…"
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="field field--full">
          <label id="sell-photos-label" htmlFor="sell-photos">
            Property photographs
          </label>
          <input
            ref={fileRef}
            id="sell-photos"
            className="file-input"
            type="file"
            accept="image/*"
            multiple
            aria-describedby="sell-photos-note"
            onChange={(e) => {
              onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="file-drop"
            aria-describedby="sell-photos-note"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon size={20} />
            <span>
              Choose images
              <span className="file-drop__sub">
                File names are listed below - nothing is uploaded.
              </span>
            </span>
          </button>
          {photos.length > 0 && (
            <ul className="file-list">
              {photos.map((name, i) => (
                <li className="filechip" key={`${name}-${i}`}>
                  <span>{name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${name} from the selection`}
                    onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  >
                    <CloseIcon size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="form-note" id="sell-photos-note">
            Demonstration form: photographs are never uploaded or stored.
          </p>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--gold" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" /> Submitting…
            </>
          ) : (
            "Request a valuation"
          )}
        </button>
        <p className="form-note">
          Validated locally, then sent to the demo API — nothing is forwarded
          from this browser to an inbox.
        </p>
      </div>
    </form>
  );
}
