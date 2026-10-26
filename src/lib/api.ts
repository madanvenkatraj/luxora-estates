/**
 * Typed client for the LUXORA ESTATES demonstration Express API.
 *
 * Backend contract (the Express server on port 4000, reached through
 * the Vite dev proxy in development and same-origin in production):
 *   GET  /api/properties        -> Property[] (raw array)
 *   GET  /api/properties/:slug  -> Property | 404 { error: { code, message } }
 *   GET  /api/agents            -> Agent[]
 *   GET  /api/categories        -> Category[]
 *   GET  /api/neighborhoods     -> Neighborhood[]
 *   POST /api/inquiries         -> 201 { id, receivedAt, echo }
 *                                  400 { error: { code, message, details[] } }
 *                                  429 { error: { code: "RATE_LIMITED", message } }
 *
 * Design rules:
 *   - Relative paths only ("/api/..."), so the Vite proxy serves the dev
 *     server and any same-origin deployment alike.
 *   - Every fetcher NEVER throws: a network failure, a non-2xx status,
 *     malformed JSON or an unexpected body resolves to the empty fallback
 *     ([] for lists, null for a single object). Callers treat the empty
 *     result as "API unavailable — keep the static dataset", so the site
 *     stays pixel-identical when the API is down.
 *   - A 4s abort timeout keeps the UI responsive when the API hangs.
 *   - Failures are silent by design: this demo client has no logger and
 *     must never break the page rendering around it.
 */

import type { Agent, Category, Neighborhood, Property } from "../types";

/** The four inquiry kinds the demo API distinguishes. */
export type InquiryKind =
  | "contact"
  | "property-inquiry"
  | "schedule-visit"
  | "sell-valuation";

/** Body of POST /api/inquiries. Optional fields are omitted entirely,
 * never sent as empty strings. */
export interface InquiryPayload {
  kind: InquiryKind;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  topic?: string;
  /** Details-page form: the property the inquiry is about. */
  propertySlug?: string;
  /** Details-page form: the display reference, e.g. "LX-1000". */
  propertyRef?: string;
  /** Sell-valuation form: owner's locality/city text. */
  location?: string;
  /** Sell-valuation form: expected price in INR. */
  expectedPrice?: number;
  /** Sell-valuation form: property type key. */
  propertyType?: string;
}

/** Result of POST /api/inquiries — always resolved, never thrown. */
export interface InquiryResult {
  ok: boolean;
  id?: string;
  receivedAt?: string;
  /** Server-side field messages, keyed by field name. */
  fieldErrors?: Record<string, string>;
  rateLimited?: boolean;
}

/** One timeout for every call: short enough to keep forms responsive. */
const REQUEST_TIMEOUT_MS = 4000;

/* ------------------------------------------------------------------ */
/* Runtime guards — no `any`, no assertions                            */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Minimal shape guards: the demo API returns full objects, but a
 * partial or wrong-shaped payload must never reach typed UI code. */
function isProperty(value: unknown): value is Property {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["slug"] === "string" &&
    typeof value["title"] === "string"
  );
}

function isAgent(value: unknown): value is Agent {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["name"] === "string"
  );
}

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["label"] === "string"
  );
}

function isNeighborhood(value: unknown): value is Neighborhood {
  return (
    isRecord(value) &&
    typeof value["id"] === "string" &&
    typeof value["name"] === "string"
  );
}

/* ------------------------------------------------------------------ */
/* Shared request plumbing                                             */
/* ------------------------------------------------------------------ */

/** GET a path and parse its JSON body. Resolves null for any non-2xx
 * status or unparseable body; rejects only on fetch/abort failure. */
async function getJson(path: string): Promise<unknown> {
  const res = await fetch(path, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  return await res.json();
}

/** GET a path expected to hold a JSON array of T; resolves [] on any
 * failure — network, status, parse or shape. */
async function getJsonArray<T>(
  path: string,
  isItem: (value: unknown) => value is T,
): Promise<T[]> {
  try {
    const body: unknown = await getJson(path);
    if (!Array.isArray(body)) return [];
    const items: unknown[] = body;
    return items.filter(isItem);
  } catch {
    return [];
  }
}

/** Read the field-to-message map out of a 400 validation body. */
function fieldErrorsFromBody(
  body: unknown,
): Record<string, string> | undefined {
  if (!isRecord(body)) return undefined;
  const error = body["error"];
  if (!isRecord(error)) return undefined;
  const details = error["details"];
  if (!Array.isArray(details)) return undefined;
  const fieldErrors: Record<string, string> = {};
  for (const detail of details) {
    if (!isRecord(detail)) continue;
    const field = detail["field"];
    const message = detail["message"];
    if (
      typeof field === "string" &&
      typeof message === "string" &&
      field.length > 0
    ) {
      fieldErrors[field] = message;
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

/* ------------------------------------------------------------------ */
/* Read API                                                            */
/* ------------------------------------------------------------------ */

/** The full listing dataset, or [] when the API is unavailable. */
export function fetchProperties(): Promise<Property[]> {
  return getJsonArray("/api/properties", isProperty);
}

/** One listing by slug, or null on any failure (including 404). */
export async function fetchPropertyBySlug(
  slug: string,
): Promise<Property | null> {
  try {
    const body: unknown = await getJson(
      `/api/properties/${encodeURIComponent(slug)}`,
    );
    return isProperty(body) ? body : null;
  } catch {
    return null;
  }
}

/** The agent roster, or [] when the API is unavailable. */
export function fetchAgents(): Promise<Agent[]> {
  return getJsonArray("/api/agents", isAgent);
}

/** The discovery categories, or [] when the API is unavailable. */
export function fetchCategories(): Promise<Category[]> {
  return getJsonArray("/api/categories", isCategory);
}

/** The neighbourhood guide data, or [] when the API is unavailable. */
export function fetchNeighborhoods(): Promise<Neighborhood[]> {
  return getJsonArray("/api/neighborhoods", isNeighborhood);
}

/* ------------------------------------------------------------------ */
/* Inquiry API                                                         */
/* ------------------------------------------------------------------ */

/** POST an inquiry. Resolves ok:true only on 201; server field errors,
 * rate limiting and every other failure resolve without throwing. */
export async function submitInquiry(
  payload: InquiryPayload,
): Promise<InquiryResult> {
  try {
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (res.status === 201) {
      // The inquiry was accepted even if its body is unreadable.
      const body: unknown = await res.json().catch(() => null);
      let id: string | undefined;
      let receivedAt: string | undefined;
      if (isRecord(body)) {
        if (typeof body["id"] === "string") id = body["id"];
        if (typeof body["receivedAt"] === "string") {
          receivedAt = body["receivedAt"];
        }
      }
      return { ok: true, id, receivedAt };
    }

    if (res.status === 400) {
      const body: unknown = await res.json().catch(() => null);
      return { ok: false, fieldErrors: fieldErrorsFromBody(body) };
    }

    if (res.status === 429) {
      return { ok: false, rateLimited: true };
    }

    return { ok: false };
  } catch {
    return { ok: false };
  }
}