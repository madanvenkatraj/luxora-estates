/**
 * Inquiry persistence, validation and rate limiting for LUXORA ESTATES.
 *
 * Everything here is dependency-light and deliberately boring:
 * - an in-memory array (newest first) capped at the last 100 records
 * - best-effort append-only persistence to server/data/inquiries.json
 * - one Zod schema for the POST /api/inquiries contract
 * - a sliding-window in-memory rate limiter keyed by IP
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { type Logger } from "./logger";

/* ------------------------------------------------------------------ */
/* Shared error envelope                                               */
/* ------------------------------------------------------------------ */

export interface FieldIssue {
  field: string;
  message: string;
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: FieldIssue[];
  };
}

export function errorEnvelope(
  code: string,
  message: string,
  details?: FieldIssue[],
): ErrorEnvelope {
  const envelope: ErrorEnvelope = { error: { code, message } };
  if (details && details.length > 0) envelope.error.details = details;
  return envelope;
}

/* ------------------------------------------------------------------ */
/* Zod contract for POST /api/inquiries                                */
/* ------------------------------------------------------------------ */

export const INQUIRY_KINDS = [
  "contact",
  "property-inquiry",
  "schedule-visit",
  "sell-valuation",
] as const;

export type InquiryKind = (typeof INQUIRY_KINDS)[number];

/** The messages are pinned by the E2E suite and mirror the client's own
 * validation copy — do not reword them. */
export const FIELD_MESSAGES = {
  name: "Please enter your name.",
  emailEmpty: "Please enter your email address.",
  emailInvalid: "Enter a valid email address, e.g. name@example.com.",
  phone: "Phone number needs at least 10 digits.",
  price: "Expected price must be greater than zero.",
  kind: "Please choose a valid inquiry type.",
} as const;

/** Exactly the fields the contract allows — Zod's default strip() drops
 * anything else, so unknown keys never reach the store. */
export const inquirySchema = z
  .object({
    kind: z.enum(INQUIRY_KINDS, {
      errorMap: () => ({ message: FIELD_MESSAGES.kind }),
    }),
    name: z
      .string({
        required_error: FIELD_MESSAGES.name,
        invalid_type_error: FIELD_MESSAGES.name,
      })
      .trim()
      .min(1, { message: FIELD_MESSAGES.name }),
    email: z
      .string({
        required_error: FIELD_MESSAGES.emailEmpty,
        invalid_type_error: FIELD_MESSAGES.emailEmpty,
      })
      .trim()
      .min(1, { message: FIELD_MESSAGES.emailEmpty })
      .email({ message: FIELD_MESSAGES.emailInvalid }),
    phone: z
      .string({
        invalid_type_error: FIELD_MESSAGES.phone,
      })
      .trim()
      .refine(
        (value) => (value === "" ? true : (value.match(/\d/g) ?? []).length >= 10),
        { message: FIELD_MESSAGES.phone },
      )
      .optional(),
    message: z.string().trim().optional(),
    topic: z.string().trim().optional(),
    propertySlug: z.string().trim().optional(),
    propertyRef: z.string().trim().optional(),
    location: z.string().trim().optional(),
    expectedPrice: z
      .number()
      .positive({ message: FIELD_MESSAGES.price })
      .optional(),
    propertyType: z.string().trim().optional(),
  })
  .strip();

export type InquiryInput = z.infer<typeof inquirySchema>;

/* ------------------------------------------------------------------ */
/* Stored record                                                       */
/* ------------------------------------------------------------------ */

/** The normalized shape handed to the store (and echoed to the client). */
export type InquiryRecord = InquiryInput & {
  id: string;
  receivedAt: string;
};

/* ------------------------------------------------------------------ */
/* Store: memory + best-effort file persistence                        */
/* ------------------------------------------------------------------ */

const MAX_LISTED_INQUIRIES = 100;

export interface InquiryStore {
  add(record: InquiryRecord): Promise<void>;
  list(limit?: number): InquiryRecord[];
}

export interface InquiryStoreOptions {
  filePath?: string;
  logger?: Logger;
}

export function createInquiryStore(
  options: InquiryStoreOptions = {},
): InquiryStore {
  const filePath = options.filePath;
  const logger = options.logger;
  /** Newest first: newest records at index 0. */
  const records: InquiryRecord[] = [];

  const add = async (record: InquiryRecord): Promise<void> => {
    records.unshift(record);
    if (!filePath) return;
    // Best-effort persistence: a failure must never fail the request.
    try {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, `${JSON.stringify(record)}\n`, { flag: "a" });
    } catch (err) {
      logger?.warn("inquiry_persist_failed", {
        message:
          err instanceof Error ? err.message : "unknown persistence error",
      });
    }
  };

  const list = (limit = MAX_LISTED_INQUIRIES): InquiryRecord[] =>
    records.slice(0, Math.max(0, limit));

  return { add, list };
}

/* ------------------------------------------------------------------ */
/* Rate limiter: sliding window, keyed by IP, in-memory                */
/* ------------------------------------------------------------------ */

export interface RateLimiter {
  /** Returns the seconds until the IP may retry, or 0 if allowed. */
  check(key: string): number;
}

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
}

export function createRateLimiter(
  options: RateLimiterOptions = {},
): RateLimiter {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 10;
  /** key -> timestamps of accepted attempts inside the window. */
  const hits = new Map<string, number[]>();

  const check = (key: string): number => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const previous = hits.get(key) ?? [];
    const inWindow = previous.filter((ts) => ts > windowStart);
    if (inWindow.length >= max) {
      const oldest = inWindow[0] ?? now;
      return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    }
    inWindow.push(now);
    hits.set(key, inWindow);
    return 0;
  };

  return { check };
}

