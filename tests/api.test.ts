import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import config from "../vite.config";
import {
  fetchAgents,
  fetchCategories,
  fetchNeighborhoods,
  fetchProperties,
  fetchPropertyBySlug,
  submitInquiry,
} from "../src/lib/api";
import type { InquiryPayload } from "../src/lib/api";
import type {
  Agent,
  Category,
  Neighborhood,
  Property,
} from "../src/types";

/* ------------------------------------------------------------------ */
/* Fixtures — minimal but type-complete samples                        */
/* ------------------------------------------------------------------ */

const PROPERTY: Property = {
  id: "lx-001",
  slug: "palatial-5bhk-villa-with-private-pool-1",
  referenceId: "LX-1000",
  title: "Palatial 5BHK Villa with Private Pool",
  type: "villa",
  intent: "buy",
  price: 85000000,
  status: "featured",
  bedrooms: 5,
  bathrooms: 6,
  areaSqft: 6800,
  furnishing: "furnished",
  amenities: ["Swimming Pool", "Garden"],
  description: "A statement residence behind the gates of Palm Meadows.",
  location: { city: "Bengaluru", locality: "Whitefield", address: "Villa 12" },
  coordinates: { lat: 12.9698, lng: 77.75 },
  yearBuilt: 2023,
  ageYears: 3,
  parking: 3,
  facing: "East",
  floor: "G+2",
  listedAt: "2026-09-28",
  images: ["https://example.com/villa.jpg"],
  agentId: "agent-1",
  nearby: [
    { category: "school", name: "Inventure Academy", distanceKm: 2.4 },
  ],
};

const AGENT: Agent = {
  id: "agent-1",
  name: "Ananya Sharma",
  title: "Head of Residential Sales",
  specialty: "Premium villas & gated communities",
  bio: "Fifteen years guiding families through the villa market.",
  phone: "+91 98XXX XXX01",
  email: "ananya.s@luxora.example",
  experienceYears: 15,
  languages: ["English", "Hindi"],
  listingsCount: 42,
  photo: "https://example.com/agent.jpg",
};

const CATEGORY: Category = {
  id: "premium-villas",
  label: "Premium Villas",
  description: "Gated-community villas with pools.",
  image: "https://example.com/villas.jpg",
  type: "villa",
  intent: "any",
};

const NEIGHBORHOOD: Neighborhood = {
  id: "indiranagar",
  name: "Indiranagar",
  city: "Bengaluru",
  category: "premium",
  description: "Leafy avenues and boutique cafés.",
  image: "https://example.com/indiranagar.jpg",
};

/* ------------------------------------------------------------------ */
/* fetch stubbing — no real network in this suite                      */
/* ------------------------------------------------------------------ */

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/* fetchProperties                                                     */
/* ------------------------------------------------------------------ */

describe("fetchProperties", () => {
  it("parses a 200 array body into Property[]", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([PROPERTY]));
    await expect(fetchProperties()).resolves.toEqual([PROPERTY]);
  });

  it("requests the relative /api/properties path with a timeout signal", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([PROPERTY]));
    await fetchProperties();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/properties");
    expect(init?.method).toBeUndefined();
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns [] when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchProperties()).resolves.toEqual([]);
  });

  it("returns [] on a non-200 status", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
    await expect(fetchProperties()).resolves.toEqual([]);
  });

  it("returns [] on malformed JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>not json</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );
    await expect(fetchProperties()).resolves.toEqual([]);
  });

  it("returns [] when the body is not an array", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [PROPERTY] }));
    await expect(fetchProperties()).resolves.toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* fetchPropertyBySlug                                                 */
/* ------------------------------------------------------------------ */

describe("fetchPropertyBySlug", () => {
  it("returns the property on 200", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(PROPERTY));
    await expect(
      fetchPropertyBySlug(PROPERTY.slug),
    ).resolves.toEqual(PROPERTY);
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`/api/properties/${PROPERTY.slug}`);
  });

  it("returns null on 404", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "NOT_FOUND", message: "No such property." } },
        404,
      ),
    );
    await expect(fetchPropertyBySlug("missing-slug")).resolves.toBeNull();
  });

  it("returns null when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchPropertyBySlug(PROPERTY.slug)).resolves.toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* fetchAgents / fetchCategories / fetchNeighborhoods                  */
/* ------------------------------------------------------------------ */

describe("reference-data fetchers", () => {
  it("fetchAgents parses an array", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([AGENT]));
    await expect(fetchAgents()).resolves.toEqual([AGENT]);
  });

  it("fetchAgents returns [] on failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchAgents()).resolves.toEqual([]);
  });

  it("fetchCategories parses an array and fails soft", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([CATEGORY]));
    await expect(fetchCategories()).resolves.toEqual([CATEGORY]);
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 503));
    await expect(fetchCategories()).resolves.toEqual([]);
  });

  it("fetchNeighborhoods parses an array and fails soft", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([NEIGHBORHOOD]));
    await expect(fetchNeighborhoods()).resolves.toEqual([NEIGHBORHOOD]);
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchNeighborhoods()).resolves.toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* submitInquiry                                                       */
/* ------------------------------------------------------------------ */

describe("submitInquiry", () => {
  const payload: InquiryPayload = {
    kind: "contact",
    name: "Test User",
    email: "test@example.com",
    phone: "+91 98765 43210",
    topic: "Buying",
    message: "I would like to know more.",
  };

  it("POSTs JSON to /api/inquiries and resolves ok:true with the id on 201", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { id: "inq-1", receivedAt: "2026-10-12T10:00:00.000Z", echo: payload },
        201,
      ),
    );
    await expect(submitInquiry(payload)).resolves.toEqual({
      ok: true,
      id: "inq-1",
      receivedAt: "2026-10-12T10:00:00.000Z",
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/inquiries");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(init?.body))).toEqual(payload);
  });

  it("maps 400 validation details onto fieldErrors", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed.",
            details: [
              {
                field: "email",
                message: "Enter a valid email address, e.g. name@example.com.",
              },
              {
                field: "phone",
                message: "Phone number needs at least 10 digits.",
              },
            ],
          },
        },
        400,
      ),
    );
    const result = await submitInquiry(payload);
    expect(result.ok).toBe(false);
    expect(result.fieldErrors).toEqual({
      email: "Enter a valid email address, e.g. name@example.com.",
      phone: "Phone number needs at least 10 digits.",
    });
  });

  it("flags rate limiting on 429", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "RATE_LIMITED", message: "Too many submissions." } },
        429,
      ),
    );
    await expect(submitInquiry(payload)).resolves.toEqual({
      ok: false,
      rateLimited: true,
    });
  });

  it("resolves ok:false without throwing when the network fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(submitInquiry(payload)).resolves.toEqual({ ok: false });
  });

  it("resolves ok:false on an unexpected status", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
    await expect(submitInquiry(payload)).resolves.toEqual({ ok: false });
  });
});

/* ------------------------------------------------------------------ */
/* Timeout path — fetch never settles, the abort signal does the work  */
/* ------------------------------------------------------------------ */

describe("request timeout", () => {
  it("creates a 4s abort signal and resolves [] without an unhandled rejection", async () => {
    const controller = new AbortController();
    const timeoutSpy = vi.fn(() => controller.signal);
    vi.stubGlobal("AbortSignal", { timeout: timeoutSpy });

    // Simulates a real fetch: never settles on its own, only rejects
    // when the abort signal the client passed in fires.
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("The operation was aborted")),
          );
        }),
    );

    const pending = fetchProperties();
    controller.abort();
    await expect(pending).resolves.toEqual([]);
    expect(timeoutSpy).toHaveBeenCalledWith(4000);
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });
});

/* ------------------------------------------------------------------ */
/* Vite proxy seam — /api must reach the Express server                */
/* ------------------------------------------------------------------ */

describe("vite dev proxy", () => {
  it("forwards /api to the Express API on localhost:4000", () => {
    const proxy = config.server?.proxy;
    expect(proxy).toBeDefined();
    expect(proxy?.["/api"]).toBe("http://localhost:4000");
  });
});