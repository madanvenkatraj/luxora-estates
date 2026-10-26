import type { Property } from "../types";

/** Compact Indian-rupee formatting: ₹85,00,000 → "₹8.5 Cr" style for
 * large values, full grouping for smaller ones. */
export function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) {
    const cr = value / 1_00_00_000;
    return `₹${trimZeros(cr)} Cr`;
  }
  if (abs >= 1_00_000) {
    const lakh = value / 1_00_000;
    return `₹${trimZeros(lakh)} L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

function trimZeros(n: number): string {
  return n.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

/** Full grouped format: 85000000 → "₹8,50,00,000" (Indian digit groups). */
export function formatINRFull(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

/** Price display per listing intent: rent shows per-month. */
export function formatPrice(p: Property): string {
  return p.intent === "rent"
    ? `${formatINRFull(p.price)}/mo`
    : formatINR(p.price);
}

export function formatArea(sqft: number): string {
  return `${sqft.toLocaleString("en-IN")} sq ft`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
