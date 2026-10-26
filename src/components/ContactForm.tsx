import { useEffect, useRef, useState, type FormEvent } from "react";
import { submitInquiry } from "../lib/api";
import type { InquiryResult } from "../lib/api";
import { CheckIcon } from "./Icon";
import "../styles/tools.css";

/* Single-instance assumption: fixed element ids are safe because the
 * router renders at most one page (and so one form) at a time. */

const TOPICS = ["Buying", "Renting", "Selling", "Other"] as const;

interface ContactFields {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}

const EMPTY: ContactFields = {
  name: "",
  email: "",
  phone: "",
  topic: "Buying",
  message: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field order mirrors the visual order, so the first invalid field is
 * the one focus moves to after a failed submit. */
const ORDER: (keyof ContactFields)[] = [
  "name",
  "email",
  "phone",
  "topic",
  "message",
];

function validate(
  f: ContactFields,
): Partial<Record<keyof ContactFields, string>> {
  const errors: Partial<Record<keyof ContactFields, string>> = {};
  if (f.name.trim() === "") errors.name = "Please enter your name.";
  if (f.email.trim() === "") {
    errors.email = "Please enter your email address.";
  } else if (!EMAIL_RE.test(f.email.trim())) {
    errors.email = "Enter a valid email address, e.g. name@example.com.";
  }
  if (f.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "Phone number needs at least 10 digits.";
  }
  if (f.message.trim() === "") {
    errors.message = "Please include a short message.";
  }
  return errors;
}

export default function ContactForm() {
  const [values, setValues] = useState<ContactFields>(EMPTY);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFields, string>>
  >({});
  const [phase, setPhase] = useState<"editing" | "submitting" | "confirmed">(
    "editing",
  );
  const [snapshot, setSnapshot] = useState<ContactFields>(EMPTY);
  /** Outcome of the POST, so the confirmation can say truthfully
   * whether the demo API received the message. */
  const [result, setResult] = useState<InquiryResult | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function set<K extends keyof ContactFields>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    // Client-side first-pass validation is unchanged and runs first.
    const found = validate(values);
    setErrors(found);
    const firstInvalid = ORDER.find((k) => found[k]);
    if (firstInvalid) {
      const el = document.getElementById(`contact-${firstInvalid}`);
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
      kind: "contact",
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() === "" ? undefined : values.phone.trim(),
      topic: values.topic,
      message: values.message.trim(),
    }).then(finish);
  }

  function reset() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setValues(EMPTY);
    setErrors({});
    setSnapshot(EMPTY);
    setResult(null);
    setPhase("editing");
  }

  if (phase === "confirmed") {
    const ok = result?.ok === true;
    return (
      <div className="confirm" role="status" aria-live="polite">
        <div className="confirm__head">
          <span className="confirm__icon" aria-hidden="true">
            <CheckIcon size={22} />
          </span>
          <div>
            <h3>Thank you, {snapshot.name.trim()}.</h3>
            {ok ? (
              <p>
                <strong>
                  Your message reached the demo API
                  {result?.id !== undefined ? <> — reference {result.id}</> : null}.
                </strong>{" "}
                This is a demonstration — no team inbox received it.
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
                  The demo API is unreachable right now, so your message was
                  recorded locally for demonstration only.
                </strong>{" "}
                It did not reach any server or team inbox.
              </p>
            )}
          </div>
        </div>
        <dl className="confirm__list">
          <div className="confirm__row">
            <dt>Name</dt>
            <dd>{snapshot.name.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Email</dt>
            <dd>{snapshot.email.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Phone</dt>
            <dd>{snapshot.phone.trim() === "" ? "—" : snapshot.phone.trim()}</dd>
          </div>
          <div className="confirm__row">
            <dt>Topic</dt>
            <dd>{snapshot.topic}</dd>
          </div>
          <div className="confirm__row">
            <dt>Message</dt>
            <dd>{snapshot.message.trim()}</dd>
          </div>
        </dl>
        <p className="demo-note">
          <span className="spinner" aria-hidden="true" />
          <span>
            Demonstration only: this form is not connected to an inbox, and
            nothing you typed was forwarded to anyone.
          </span>
        </p>
        <div className="confirm__actions">
          <button type="button" className="btn btn--navy" onClick={reset}>
            Write another message
          </button>
        </div>
      </div>
    );
  }

  const busy = phase === "submitting";

  return (
    <form
      className="contact-form"
      noValidate
      onSubmit={submit}
      aria-busy={busy}
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="contact-name">
            Name <span className="req" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            id="contact-name"
            className="input"
            type="text"
            autoComplete="name"
            placeholder="Ananya Sharma"
            value={values.name}
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            onChange={(e) => set("name", e.target.value)}
          />
          {errors.name && (
            <p className="error" id="contact-name-error" data-testid="contact-name-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="contact-email">
            Email <span className="req" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <input
            id="contact-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            onChange={(e) => set("email", e.target.value)}
          />
          {errors.email && (
            <p className="error" id="contact-email-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="contact-phone">Phone</label>
          <input
            id="contact-phone"
            className="input"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={values.phone}
            aria-describedby={
              errors.phone ? "contact-phone-error" : "contact-phone-hint"
            }
            onChange={(e) => set("phone", e.target.value)}
          />
          {errors.phone ? (
            <p className="error" id="contact-phone-error" role="alert">
              {errors.phone}
            </p>
          ) : (
            <p className="form-note" id="contact-phone-hint">
              Optional — include it if you prefer a call back.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="contact-topic">Topic</label>
          <select
            id="contact-topic"
            className="select"
            value={values.topic}
            onChange={(e) => set("topic", e.target.value)}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field field--full">
          <label htmlFor="contact-message">
            Message <span className="req" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </label>
          <textarea
            id="contact-message"
            className="textarea"
            placeholder="How can we help? A line or two is enough."
            value={values.message}
            aria-required="true"
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            onChange={(e) => set("message", e.target.value)}
          />
          {errors.message && (
            <p className="error" id="contact-message-error" role="alert">
              {errors.message}
            </p>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--gold" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" /> Sending…
            </>
          ) : (
            "Send message"
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
