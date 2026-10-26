import { useMemo, useState } from "react";
import { calculateMortgage } from "../lib/mortgage";
import type { MortgageInputs, MortgageResult } from "../lib/mortgage";
import { formatINRFull } from "../lib/format";
import { ShieldIcon } from "./Icon";
import "../styles/tools.css";

/* Single-instance assumption: fixed element ids are safe because the
 * router renders at most one page (and so one calculator) at a time. */

/** Field keys ordered exactly like calculateMortgage validates, so the
 * library's error string is shown under the input that caused it. */
type FieldKey = "price" | "down" | "years" | "rate";

const DEFAULTS: Record<FieldKey, string> = {
  price: "5000000",
  down: "1000000",
  rate: "8.5",
  years: "20",
};

interface FieldMeta {
  key: FieldKey;
  id: string;
  label: string;
  hint: string;
  placeholder: string;
  min?: number;
  step?: string;
}

const FIELDS: FieldMeta[] = [
  { key: "price", id: "calc-price", label: "Property price", hint: "Total price in rupees", placeholder: "5000000", min: 0 },
  { key: "down", id: "calc-down", label: "Down payment", hint: "Paid upfront, in rupees", placeholder: "1000000", min: 0 },
  { key: "rate", id: "calc-rate", label: "Interest rate", hint: "Annual rate, in percent", placeholder: "8.5", min: 0, step: "0.05" },
  { key: "years", id: "calc-years", label: "Loan duration", hint: "Whole years", placeholder: "20", min: 1, step: "1" },
];

/** Empty string must be NaN, not 0 (Number("") === 0 would hide errors). */
function toNumber(raw: string): number {
  const t = raw.trim();
  return t === "" ? Number.NaN : Number(t);
}

/** Mirrors calculateMortgage's validation order to locate the field. */
function offendingField(raw: MortgageInputs): FieldKey {
  if (!Number.isFinite(raw.propertyPrice) || raw.propertyPrice <= 0) return "price";
  if (
    !Number.isFinite(raw.downPayment) ||
    raw.downPayment < 0 ||
    raw.downPayment >= raw.propertyPrice
  ) {
    return "down";
  }
  if (!Number.isFinite(raw.years) || raw.years < 1) return "years";
  return "rate";
}

export default function MortgageCalculator() {
  const [values, setValues] = useState<Record<FieldKey, string>>(DEFAULTS);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  const inputs: MortgageInputs = useMemo(
    () => ({
      propertyPrice: toNumber(values.price),
      downPayment: toNumber(values.down),
      annualRatePct: toNumber(values.rate),
      years: toNumber(values.years),
    }),
    [values],
  );

  const outcome = useMemo(() => calculateMortgage(inputs), [inputs]);
  const data: MortgageResult | null = "error" in outcome ? null : outcome;
  const failure =
    "error" in outcome
      ? { field: offendingField(inputs), message: outcome.error }
      : null;

  function errorFor(f: FieldMeta): string | null {
    if (failure !== null && failure.field === f.key) return failure.message;
    if (values[f.key].trim() === "") {
      return touched[f.key] ? "Please fill in this field." : null;
    }
    return null;
  }

  function update(key: FieldKey, raw: string) {
    setValues((v) => ({ ...v, [key]: raw }));
    setTouched((t) => ({ ...t, [key]: true }));
  }

  function reset() {
    setValues(DEFAULTS);
    setTouched({});
  }

  const months = Math.round(inputs.years * 12);

  return (
    <section className="section section--white" aria-labelledby="calc-heading">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Financial tools</p>
          <h2 id="calc-heading">Plan Your Home Investment</h2>
          <p>
            Model a home loan before you speak to a lender. Adjust any value and
            the estimate recalculates instantly.
          </p>
        </div>

        <div className="calc-card">
          <form
            className="calc-form"
            noValidate
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="calc-fields">
              {FIELDS.map((f) => {
                const error = errorFor(f);
                return (
                  <div className="field" key={f.key}>
                    <label htmlFor={f.id}>
                      {f.label}{" "}
                      <span className="req" aria-hidden="true">
                        *
                      </span>
                      <span className="sr-only"> (required)</span>
                    </label>
                    <input
                      id={f.id}
                      className="input"
                      type="number"
                      min={f.min}
                      step={f.step}
                      placeholder={f.placeholder}
                      value={values[f.key]}
                      aria-required="true"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={
                        error ? `${f.id}-hint ${f.id}-error` : `${f.id}-hint`
                      }
                      onChange={(e) => update(f.key, e.target.value)}
                    />
                    <p className="calc-hint" id={`${f.id}-hint`}>
                      {f.hint}
                    </p>
                    {error && (
                      <p className="error" id={`${f.id}-error`} role="alert">
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="calc-actions">
              <button type="button" className="btn btn--outline" onClick={reset}>
                Reset values
              </button>
              <p className="form-note">Results update as you type.</p>
            </div>
          </form>

          <div className="calc-results">
            <p className="calc-results__label">Estimated monthly payment</p>
            <p className="calc-emi" aria-live="polite">
              {data ? formatINRFull(data.monthlyPayment) : "—"}
            </p>
            {data ? (
              <dl className="calc-rows">
                <div className="calc-row">
                  <dt>Loan principal</dt>
                  <dd>{formatINRFull(data.loanPrincipal)}</dd>
                </div>
                <div className="calc-row">
                  <dt>Total interest</dt>
                  <dd>{formatINRFull(data.totalInterest)}</dd>
                </div>
                <div className="calc-row">
                  <dt>Total payable</dt>
                  <dd>{formatINRFull(data.totalPayable)}</dd>
                </div>
              </dl>
            ) : (
              <p className="calc-error" role="status">
                Enter valid loan details to see an estimate. The problem field
                is marked on the left.
              </p>
            )}
            <p className="calc-foot">
              {data
                ? `Reducing-balance EMI across ${months} monthly payments. A 0% interest rate is supported.`
                : "Reducing-balance EMI. A 0% interest rate is supported."}
            </p>
          </div>
        </div>

        <p className="demo-note calc-note">
          <ShieldIcon size={16} />
          <span>
            <strong>Estimates are illustrative only</strong> - not financial
            advice or a bank-approved quotation.
          </span>
        </p>
      </div>
    </section>
  );
}
