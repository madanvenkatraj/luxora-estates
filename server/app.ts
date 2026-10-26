/**
 * Express app factory for the LUXORA ESTATES API.
 *
 * createApp() builds a fully wired app without binding a port, so
 * supertest can drive it in tests and index.ts can listen on it.
 */
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import fs from "node:fs";
import { type Server } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  createInquiryStore,
  createRateLimiter,
  type InquiryStore,
  type RateLimiter,
} from "./inquiries";
import { logger, type Logger } from "./logger";
import { createRoutes } from "./routes";

/** Explicit allowlist, no credentials, never "*". Localhost dev origins
 * plus any comma-separated origins provided via CORS_ORIGINS, so a
 * deployed frontend can POST inquiries without widening to "*". */
const ALLOWED_ORIGINS = new Set<string>([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);
for (const raw of (process.env.CORS_ORIGINS ?? "").split(",")) {
  const origin = raw.trim();
  if (origin.length > 0) ALLOWED_ORIGINS.add(origin);
}

/** JSON body cap. */
const JSON_LIMIT = "16kb";

/** Best-effort persistence target for inquiries (relative to this file). */
const DEFAULT_INQUIRIES_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "data",
  "inquiries.json",
);

export interface AppOptions {
  store?: InquiryStore;
  rateLimiter?: RateLimiter;
  logger?: Logger;
}

function errorStatus(err: unknown): number {
  if (typeof err === "object" && err !== null) {
    const candidate = (err as { status?: unknown }).status;
    if (typeof candidate === "number" && candidate >= 400 && candidate < 600) {
      return candidate;
    }
    const alt = (err as { statusCode?: unknown }).statusCode;
    if (typeof alt === "number" && alt >= 400 && alt < 600) {
      return alt;
    }
  }
  return 500;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}

export function createApp(options: AppOptions = {}): Express {
  const store =
    options.store ??
    createInquiryStore({
      filePath: DEFAULT_INQUIRIES_PATH,
      logger: options.logger ?? logger,
    });
  const rateLimiter =
    options.rateLimiter ?? createRateLimiter({ windowMs: 60_000, max: 10 });
  const log = options.logger ?? logger;

  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser tools (curl, tests) send no Origin header — allow.
        if (origin === null || origin === undefined || ALLOWED_ORIGINS.has(origin)) {
          callback(null, true);
          return;
        }
        // Unknown origins get no CORS headers; the browser blocks the read.
        callback(null, false);
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept"],
      credentials: false,
      maxAge: 86400,
    }),
  );

  // Structured JSON-line request logging (method, path, status, durationMs).
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      log.info("http_request", {
        method: req.method,
        path: req.originalUrl ?? req.url,
        status: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
      });
    });
    next();
  });

  app.use(express.json({ limit: JSON_LIMIT }));

  app.use("/api", createRoutes({ store, rateLimiter, logger: log }));

  /* Production serving: when dist/ exists and NODE_ENV is production,
   * serve the built SPA. Mounted AFTER /api so the API keeps priority;
   * the SPA fallback is express.static's own index rewriter, not a
   * wildcard catch-all, so /api paths that miss still hit the central
   * 404 JSON envelope below instead of returning HTML. */
  const staticDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "dist",
  );
  if (process.env.NODE_ENV === "production" && fs.existsSync(staticDir)) {
    app.use(express.static(staticDir, { index: "index.html" }));
    app.use((req, res, next) => {
      // GETs that accept HTML get the SPA shell; API misses stay JSON 404.
      const wantsHtml = (req.headers.accept ?? "").includes("text/html");
      if (req.method !== "GET" || !wantsHtml) {
        next();
        return;
      }
      res.sendFile(path.join(staticDir, "index.html"), (err) => {
        if (err && !res.headersSent) {
          next(err);
        }
      });
    });
  }

  // Central 404 — one envelope shape everywhere.
  app.use((_req: Request, res: Response) => {
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Route not found." } });
  });

  // Central error handler — Express 4 needs the four-arg signature.
  // Never leaks stack traces: 500s get a fixed, user-safe message.
  app.use(
    (err: unknown, req: Request, res: Response, _next: NextFunction) => {
      const status = errorStatus(err);
      if (status >= 500) {
        log.error("request_failed", { message: errorMessage(err) });
      }
      const code =
        status === 413
          ? "PAYLOAD_TOO_LARGE"
          : status === 400
            ? "VALIDATION_ERROR"
            : status >= 500
              ? "INTERNAL_ERROR"
              : "REQUEST_ERROR";
      const message =
        status >= 500
          ? "Something went wrong. Please try again shortly."
          : status === 413
            ? "Request body is too large."
            : "The request could not be processed.";
      log.info("request_failed_handled", {
        method: req.method,
        path: req.originalUrl ?? req.url,
        status,
        code,
      });
      res.status(status).json({ error: { code, message } });
    },
  );

  return app;
}

/** Boot helper used by index.ts (kept here so tests can exercise it too). */
export function startServer(app: Express, port: number): Server {
  return app.listen(port, () => {
    logger.info("server_started", { port });
  });
}

export { ALLOWED_ORIGINS };