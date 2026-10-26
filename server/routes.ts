/**
 * Route definitions for the LUXORA ESTATES API.
 *
 * Every endpoint contract here is the source of truth the frontend
 * implements against — param names, envelope shapes and status codes.
 *
 * Filter parity guarantee: GET /api/properties never re-implements
 * filtering. It hands the raw query string to the same shared
 * `paramsToFilters` + `applyFilters` the client uses, so the API and the
 * UI can never diverge on what "matching" means.
 */
import { Router, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { PROPERTIES, AGENTS, CATEGORIES, NEIGHBORHOODS } from "../src/data/properties";
import { applyFilters } from "../src/lib/filters";
import { paramsToFilters } from "../src/lib/filterParams";
import {
  type InquiryStore,
  type RateLimiter,
  type InquiryRecord,
  errorEnvelope,
  inquirySchema,
} from "./inquiries";
import { type Logger } from "./logger";

/* ------------------------------------------------------------------ */
/* Envelope helpers                                                    */
/* ------------------------------------------------------------------ */

function sendEnvelope(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: { field: string; message: string }[],
): void {
  res.status(status).json(errorEnvelope(code, message, details));
}

/* ------------------------------------------------------------------ */
/* Inquiry POST handler (rate limit + schema + persistence)            */
/* ------------------------------------------------------------------ */

interface InquiryDeps {
  store: InquiryStore;
  rateLimiter: RateLimiter;
  logger: Logger;
}

export function handleInquiryPost(
  req: Request,
  res: Response,
  deps: InquiryDeps,
): void {
  const { store, rateLimiter, logger } = deps;

  // Sliding window keyed by IP; production would move this to a shared
  // store (Redis or equivalent) so limits hold across instances.
  const ip =
    req.ip ??
    (typeof req.socket.remoteAddress === "string" ? req.socket.remoteAddress : "unknown");
  const retryAfterSeconds = rateLimiter.check(ip);
  if (retryAfterSeconds > 0) {
    res.set("Retry-After", String(retryAfterSeconds));
    sendEnvelope(
      res,
      429,
      "RATE_LIMITED",
      "Too many requests. Please wait a moment and try again.",
    );
    return;
  }

  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) {
    // Map every Zod issue to the pinned { field, message } pair.
    const details = parsed.error.issues.map((issue) => ({
      field: String(issue.path[0] ?? "unknown"),
      message: issue.message,
    }));
    sendEnvelope(
      res,
      400,
      "VALIDATION_ERROR",
      "Please check the highlighted fields.",
      details,
    );
    return;
  }

  const record: InquiryRecord = {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    ...parsed.data,
  };

  logger.info("inquiry_received", {
    kind: record.kind,
    propertySlug: record.propertySlug ?? null,
    hasPhone: record.phone !== undefined,
    requestId: res.get("X-Request-Id") ?? null,
  });

  void store
    .add(record)
    .then(() => {
      res.status(201).json({
        id: record.id,
        receivedAt: record.receivedAt,
        echo: record,
      });
    })
    .catch((err: unknown) => {
      // store.add never rejects by design; if it ever does, fail loudly
      // through the central error handler.
      next_error(err, res, logger);
    });
}

function next_error(err: unknown, res: Response, logger: Logger): void {
  logger.error("inquiry_store_failed", { message: err instanceof Error ? err.message : "unknown" });
  sendEnvelope(res, 500, "INTERNAL_ERROR", "Something went wrong. Please try again shortly.");
}

/* ------------------------------------------------------------------ */
/* Router factory                                                      */
/* ------------------------------------------------------------------ */

export function createRoutes(deps: InquiryDeps): Router {
  const router = Router();
  const postDeps: InquiryDeps = deps;

  router.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      properties: PROPERTIES.length,
    });
  });

  router.get("/properties", (req, res) => {
    const rawQuery = req.url.split("?")[1] ?? "";
    const filters = paramsToFilters(new URLSearchParams(rawQuery));
    const properties = applyFilters(PROPERTIES, filters);
    res.status(200).json(properties);
  });

  router.get("/properties/:slug", (req, res) => {
    const slug = req.params.slug ?? "";
    const property = PROPERTIES.find((p) => p.slug === slug);
    if (property === undefined) {
      sendEnvelope(res, 404, "NOT_FOUND", "Property not found.");
      return;
    }
    res.status(200).json(property);
  });

  router.get("/agents", (_req, res) => {
    res.status(200).json(AGENTS);
  });

  router.get("/categories", (_req, res) => {
    res.status(200).json(CATEGORIES);
  });

  router.get("/neighborhoods", (_req, res) => {
    res.status(200).json(NEIGHBORHOODS);
  });

  router.get("/inquiries", (_req, res) => {
    res.status(200).json({ inquiries: deps.store.list(100) });
  });

  router.post("/inquiries", (req, res) => {
    handleInquiryPost(req, res, postDeps);
  });

  return router;
}