/**
 * API contract tests for the LUXORA ESTATES Express backend.
 * Written TDD-first: these were the failing suite the server was
 * implemented against. Every test builds a fresh app instance so the
 * in-memory inquiry store and the rate limiter never leak between tests.
 */
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { AGENTS, CATEGORIES, NEIGHBORHOODS, PROPERTIES } from "../../src/data/properties";
import { applyFilters } from "../../src/lib/filters";
import { paramsToFilters } from "../../src/lib/filterParams";
import { EMPTY_FILTERS } from "../../src/types";
import { createApp } from "../../server/app";
import { createInquiryStore, createRateLimiter } from "../../server/inquiries";

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

let tmpDir = "";

beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), "luxora-inquiries-"));
});

/** A fresh app per test: own inquiry store (tmp file) and own rate limiter. */
function makeApp() {
  const store = createInquiryStore({
    filePath: path.join(tmpDir, `inquiries-${Math.random().toString(36).slice(2)}.json`),
  });
  const rateLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });
  return createApp({ store, rateLimiter });
}

const validInquiry = {
  kind: "schedule-visit",
  name: "  Priya Tester  ",
  email: "  priya@example.com  ",
  phone: "+91 98765 43210",
  message: "  Interested in a Saturday viewing.  ",
  topic: "Viewing availability",
  propertySlug: "palatial-5bhk-villa-with-private-pool-1",
  location: "Whitefield, Bengaluru",
  expectedPrice: 12500000,
  propertyType: "villa",
};

function postInquiry(
  app: ReturnType<typeof createApp>,
  body: Record<string, unknown>,
) {
  return request(app).post("/api/inquiries").send(body);
}

describe("GET /api/health", () => {
  it("returns ok with uptime and the dataset size", async () => {
    const res = await request(makeApp()).get("/api/health").expect(200);
    const body: { status: string; uptimeSeconds: number; properties: number } = res.body;
    expect(body.status).toBe("ok");
    expect(typeof body.uptimeSeconds).toBe("number");
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(body.properties).toBe(PROPERTIES.length);
    expect(body.properties).toBe(26);
  });
});

describe("GET /api/properties", () => {
  it("unfiltered returns the full 26-property dataset with zero filter divergence", async () => {
    const res = await request(makeApp()).get("/api/properties").expect(200);
    const body: unknown[] = res.body;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(26);
    expect(body).toEqual(applyFilters(PROPERTIES, EMPTY_FILTERS));
    const first = body[0] as { id: string; slug: string; title: string } | undefined;
    expect(first).toBeDefined();
    expect(typeof first?.slug).toBe("string");
    expect(typeof first?.title).toBe("string");
  });

  it("intent=rent filters to rentals only, exactly like the shared filter engine", async () => {
    const res = await request(makeApp())
      .get("/api/properties?intent=rent")
      .expect(200);
    const body = res.body as { intent: string }[];
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((p) => p.intent === "rent")).toBe(true);
    expect(body).toEqual(
      applyFilters(PROPERTIES, paramsToFilters(new URLSearchParams("intent=rent"))),
    );
  });

  it("beds=4&sort=price-asc returns at-least-4-bedroom listings in ascending price order", async () => {
    const res = await request(makeApp())
      .get("/api/properties?beds=4&sort=price-asc")
      .expect(200);
    const body = res.body as { price: number; bedrooms: number }[];
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((p) => p.bedrooms >= 4)).toBe(true);
    for (let i = 1; i < body.length; i += 1) {
      expect(body[i]?.price).toBeGreaterThanOrEqual(body[i - 1]?.price ?? 0);
    }
    expect(body).toEqual(
      applyFilters(
        PROPERTIES,
        paramsToFilters(new URLSearchParams("beds=4&sort=price-asc")),
      ),
    );
  });

  it("handles location, price bounds, repeatable amenities and sort with parity", async () => {
    const qs = "location=Whitefield&minP=10000000&maxP=90000000&am=Gym&am=Swimming%20Pool&sort=price-desc";
    const res = await request(makeApp()).get(`/api/properties?${qs}`).expect(200);
    expect(res.body).toEqual(
      applyFilters(PROPERTIES, paramsToFilters(new URLSearchParams(qs))),
    );
  });

  it("degrades unknown param values to safe defaults instead of throwing", async () => {
    const qs = "intent=bananas&type=castle&minP=abc&beds=lots";
    const res = await request(makeApp()).get(`/api/properties?${qs}`).expect(200);
    const body: unknown[] = res.body;
    expect(body).toHaveLength(26);
    expect(body).toEqual(
      applyFilters(PROPERTIES, paramsToFilters(new URLSearchParams(qs))),
    );
  });
});

describe("GET /api/properties/:slug", () => {
  it("returns the matching property for a known slug", async () => {
    const known = PROPERTIES[0];
    expect(known).toBeDefined();
    const res = await request(makeApp())
      .get(`/api/properties/${known?.slug ?? ""}`)
      .expect(200);
    const body = res.body as { id: string; slug: string };
    expect(body.id).toBe(known?.id);
    expect(body.slug).toBe(known?.slug);
  });

  it("returns a 404 envelope for an unknown slug", async () => {
    const res = await request(makeApp()).get("/api/properties/nope-404").expect(404);
    const body: ErrorEnvelope = res.body;
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Property not found.");
    expect(body.error.details).toBeUndefined();
  });
});

describe("dataset endpoints", () => {
  it("GET /api/agents returns the full agent list", async () => {
    const res = await request(makeApp()).get("/api/agents").expect(200);
    expect(res.body).toEqual(AGENTS);
    expect(res.body).toHaveLength(4);
  });

  it("GET /api/categories returns the full category list", async () => {
    const res = await request(makeApp()).get("/api/categories").expect(200);
    expect(res.body).toEqual(CATEGORIES);
    expect(res.body).toHaveLength(8);
  });

  it("GET /api/neighborhoods returns the full neighborhood list", async () => {
    const res = await request(makeApp()).get("/api/neighborhoods").expect(200);
    expect(res.body).toEqual(NEIGHBORHOODS);
    expect(res.body).toHaveLength(6);
  });
});

describe("POST /api/inquiries — happy path", () => {
  it("stores a normalized record and echoes it with id and receivedAt", async () => {
    const app = makeApp();
    const res = await postInquiry(app, validInquiry).expect(201);
    const body: { id: string; receivedAt: string; echo: Record<string, unknown> } =
      res.body;
    expect(typeof body.id).toBe("string");
    expect(body.id.length).toBeGreaterThan(0);
    expect(new Date(body.receivedAt).toISOString()).toBe(body.receivedAt);
    expect(body.echo.id).toBe(body.id);
    expect(body.echo.kind).toBe("schedule-visit");
    expect(body.echo.name).toBe("Priya Tester");
    expect(body.echo.email).toBe("priya@example.com");
    expect(body.echo.phone).toBe("+91 98765 43210");
    expect(body.echo.message).toBe("Interested in a Saturday viewing.");
    expect(body.echo.propertySlug).toBe("palatial-5bhk-villa-with-private-pool-1");
    expect(body.echo.expectedPrice).toBe(12500000);
  });

  it("accepts a phone-less contact inquiry (phone is optional)", async () => {
    // The contact form has no phone field: regression test for the
    // required-phone bug the integration smoke test caught.
    const { phone: _omit, ...withoutPhone } = validInquiry;
    const res = await postInquiry(makeApp(), withoutPhone).expect(201);
    const body: { echo: Record<string, unknown> } = res.body;
    expect(body.echo.phone).toBeUndefined();
    expect(body.echo.kind).toBe("schedule-visit");
  });

  it("keeps the propertyRef the details page sends instead of stripping it", async () => {
    const res = await postInquiry(makeApp(), {
      ...validInquiry,
      propertyRef: "LX-1000",
    }).expect(201);
    const body: { echo: Record<string, unknown> } = res.body;
    expect(body.echo.propertyRef).toBe("LX-1000");
  });

  it("GET /api/inquiries lists the newest records first", async () => {
    const app = makeApp();
    const first = await postInquiry(app, { ...validInquiry, name: "First Person" }).expect(201);
    const second = await postInquiry(app, { ...validInquiry, name: "Second Person" }).expect(201);
    const firstBody: { id: string } = first.body;
    const secondBody: { id: string } = second.body;

    const list = await request(app).get("/api/inquiries").expect(200);
    const body: { inquiries: { id: string }[] } = list.body;
    expect(body.inquiries.length).toBeGreaterThanOrEqual(2);
    expect(body.inquiries[0]?.id).toBe(secondBody.id);
    expect(body.inquiries[1]?.id).toBe(firstBody.id);
  });
});

describe("POST /api/inquiries — validation", () => {
  it("rejects an empty name with the pinned message", async () => {
    const res = await postInquiry(makeApp(), { ...validInquiry, name: "   " }).expect(400);
    const body: ErrorEnvelope = res.body;
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Please check the highlighted fields.");
    expect(body.error.details).toContainEqual({
      field: "name",
      message: "Please enter your name.",
    });
  });

  it("rejects an empty email with the pinned message", async () => {
    const res = await postInquiry(makeApp(), { ...validInquiry, email: "" }).expect(400);
    const body: ErrorEnvelope = res.body;
    expect(body.error.details).toContainEqual({
      field: "email",
      message: "Please enter your email address.",
    });
  });

  it("rejects a malformed email with the pinned message", async () => {
    const res = await postInquiry(makeApp(), { ...validInquiry, email: "not-an-email" }).expect(400);
    const body: ErrorEnvelope = res.body;
    expect(body.error.details).toContainEqual({
      field: "email",
      message: "Enter a valid email address, e.g. name@example.com.",
    });
  });

  it("rejects a phone with fewer than 10 digits with the pinned message", async () => {
    const res = await postInquiry(makeApp(), { ...validInquiry, phone: "12345" }).expect(400);
    const body: ErrorEnvelope = res.body;
    expect(body.error.details).toContainEqual({
      field: "phone",
      message: "Phone number needs at least 10 digits.",
    });
  });

  it("accepts a 10-digit-count phone with formatting", async () => {
    await postInquiry(makeApp(), { ...validInquiry, phone: "98765-43210" }).expect(201);
  });

  it("rejects an unknown kind with the pinned message", async () => {
    const res = await postInquiry(makeApp(), { ...validInquiry, kind: "newsletter" }).expect(400);
    const body: ErrorEnvelope = res.body;
    expect(body.error.details).toContainEqual({
      field: "kind",
      message: "Please choose a valid inquiry type.",
    });
  });

  it("rejects a missing kind with the same pinned message", async () => {
    const { kind: _omit, ...rest } = validInquiry;
    const res = await postInquiry(makeApp(), rest).expect(400);
    const body: ErrorEnvelope = res.body;
    expect(body.error.details).toContainEqual({
      field: "kind",
      message: "Please choose a valid inquiry type.",
    });
  });

  it("rejects a non-positive expected price with the pinned message", async () => {
    for (const expectedPrice of [0, -5]) {
      const res = await postInquiry(makeApp(), { ...validInquiry, expectedPrice }).expect(400);
      const body: ErrorEnvelope = res.body;
      expect(body.error.details).toContainEqual({
        field: "expectedPrice",
        message: "Expected price must be greater than zero.",
      });
    }
  });

  it("reports every bad field in one response", async () => {
    const res = await postInquiry(makeApp(), { kind: "contact", name: "", email: "nope" }).expect(400);
    const body: ErrorEnvelope = res.body;
    const fields = (body.error.details ?? []).map((d) => d.field);
    expect(fields).toContain("name");
    expect(fields).toContain("email");
  });

  it("strips unknown fields from the stored record", async () => {
    const app = makeApp();
    const res = await postInquiry(app, {
      ...validInquiry,
      admin: true,
      role: "root",
      isLoggedIn: "yes",
    }).expect(201);
    const body: { echo: Record<string, unknown> } = res.body;
    expect(body.echo).not.toHaveProperty("admin");
    expect(body.echo).not.toHaveProperty("role");
    expect(body.echo).not.toHaveProperty("isLoggedIn");

    const list = await request(app).get("/api/inquiries").expect(200);
    const stored = (list.body as { inquiries: Record<string, unknown>[] }).inquiries[0];
    expect(stored).toBeDefined();
    expect(stored).not.toHaveProperty("admin");
    expect(stored).not.toHaveProperty("role");
    expect(stored).not.toHaveProperty("isLoggedIn");
  });
});

describe("POST /api/inquiries — rate limiting", () => {
  it("allows 10 posts per window from one IP and trips with 429 + Retry-After on the 11th", async () => {
    const app = makeApp();
    for (let i = 0; i < 10; i += 1) {
      await postInquiry(app, validInquiry).expect(201);
    }
    const res = await postInquiry(app, validInquiry).expect(429);
    const body: ErrorEnvelope = res.body;
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.error.message).toBe("Too many requests. Please wait a moment and try again.");
    const retryAfter = Number(res.get("Retry-After"));
    expect(Number.isFinite(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });
});

describe("malformed and oversized request bodies", () => {
  it("returns a 400 envelope for invalid JSON", async () => {
    const res = await request(makeApp())
      .post("/api/inquiries")
      .set("Content-Type", "application/json")
      .send('{"name":')
      .expect(400);
    const body: ErrorEnvelope = res.body;
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(typeof body.error.message).toBe("string");
    expect(body.error.message.length).toBeGreaterThan(0);
  });

  it("returns a 413 envelope for a body over the 16kb limit", async () => {
    const res = await request(makeApp())
      .post("/api/inquiries")
      .set("Content-Type", "application/json")
      .send(`{"message":"${"x".repeat(20_000)}"}`)
      .expect(413);
    const body: ErrorEnvelope = res.body;
    expect(body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });
});

describe("routing", () => {
  it("returns a 404 envelope for unknown routes", async () => {
    const res = await request(makeApp()).get("/api/definitely-not-a-route").expect(404);
    const body: ErrorEnvelope = res.body;
    expect(body.error.code).toBe("NOT_FOUND");
    expect(typeof body.error.message).toBe("string");
  });
});

describe("CORS", () => {
  it("allows the localhost dev origins explicitly", async () => {
    const res = await request(makeApp())
      .get("/api/health")
      .set("Origin", "http://localhost:3000")
      .expect(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("does not emit CORS headers for unknown origins", async () => {
    const res = await request(makeApp())
      .get("/api/health")
      .set("Origin", "http://evil.example")
      .expect(200);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("answers preflight requests for allowed origins", async () => {
    const res = await request(makeApp())
      .options("/api/properties")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET")
      .expect(204);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });
});

export {};