import { describe, it, expect } from "vitest";
import { PROPERTIES, AGENTS, CATEGORIES, NEIGHBORHOODS, TESTIMONIALS, GUIDES, FAQS } from "../src/data/properties";
import { PROPERTY_TYPE_LABELS } from "../src/types";

describe("dataset integrity", () => {
  it("has 26 unique ids and slugs", () => {
    expect(PROPERTIES).toHaveLength(26);
    expect(new Set(PROPERTIES.map((p) => p.id)).size).toBe(26);
    expect(new Set(PROPERTIES.map((p) => p.slug)).size).toBe(26);
  });

  it("covers all seven property types", () => {
    const types = new Set(PROPERTIES.map((p) => p.type));
    for (const t of Object.keys(PROPERTY_TYPE_LABELS)) {
      expect(types.has(t as keyof typeof PROPERTY_TYPE_LABELS)).toBe(true);
    }
  });

  it("covers both intents", () => {
    expect(PROPERTIES.some((p) => p.intent === "buy")).toBe(true);
    expect(PROPERTIES.some((p) => p.intent === "rent")).toBe(true);
  });

  it("uses the three status badges on supported listings", () => {
    expect(PROPERTIES.some((p) => p.status === "featured")).toBe(true);
    expect(PROPERTIES.some((p) => p.status === "new")).toBe(true);
    expect(PROPERTIES.some((p) => p.status === "reduced")).toBe(true);
  });

  it("every property links to a real agent", () => {
    const ids = new Set(AGENTS.map((a) => a.id));
    expect(PROPERTIES.every((p) => ids.has(p.agentId))).toBe(true);
  });

  it("every property has images, nearby places and a description", () => {
    expect(PROPERTIES.every((p) => p.images.length >= 2)).toBe(true);
    expect(PROPERTIES.every((p) => p.nearby.length >= 3)).toBe(true);
    expect(PROPERTIES.every((p) => p.description.length > 80)).toBe(true);
    expect(PROPERTIES.every((p) => p.slug.length > 0)).toBe(true);
  });

  it("prices are positive INR numbers", () => {
    expect(PROPERTIES.every((p) => Number.isFinite(p.price) && p.price > 0)).toBe(true);
  });

  it("supplies the eight discovery categories", () => {
    expect(CATEGORIES).toHaveLength(8);
  });

  it("supplies supporting content for every content section", () => {
    expect(NEIGHBORHOODS.length).toBeGreaterThanOrEqual(4);
    expect(TESTIMONIALS.length).toBeGreaterThanOrEqual(4);
    expect(GUIDES).toHaveLength(5);
    expect(FAQS).toHaveLength(6);
    expect(TESTIMONIALS.every((t) => t.rating >= 1 && t.rating <= 5)).toBe(true);
  });

  it("coordinates are plausible for the map placeholder", () => {
    expect(PROPERTIES.every((p) => p.coordinates.lat > 6 && p.coordinates.lat < 36)).toBe(true);
    expect(PROPERTIES.every((p) => p.coordinates.lng > 66 && p.coordinates.lng < 98)).toBe(true);
  });
});

describe("format helpers", () => {
  it("formats crores and lakhs in compact INR", async () => {
    const { formatINR, formatINRFull, formatArea } = await import("../src/lib/format");
    expect(formatINR(85_000_000)).toBe("₹8.5 Cr");
    expect(formatINR(3_600_000)).toBe("₹36 L");
    expect(formatINRFull(38_000)).toBe("₹38,000");
    expect(formatArea(6800)).toBe("6,800 sq ft");
  });
});
