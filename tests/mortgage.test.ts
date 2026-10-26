import { describe, it, expect } from "vitest";
import { calculateMortgage, verifyByAmortisation } from "../src/lib/mortgage";

describe("calculateMortgage", () => {
  it("computes the classic EMI: 50L, 8.5%, 20y", () => {
    const r = calculateMortgage({
      propertyPrice: 5_000_000,
      downPayment: 1_000_000,
      annualRatePct: 8.5,
      years: 20,
    });
    if ("error" in r) throw new Error("unexpected error");
    // Hand-computed: P=40,00,000, r=0.0070833..., n=240 → EMI = 34,712.93
    expect(r.loanPrincipal).toBe(4_000_000);
    expect(r.monthlyPayment).toBeCloseTo(34712.93, 0);
    expect(r.totalPayable).toBeCloseTo(r.monthlyPayment * 240, 0);
    expect(r.totalInterest).toBeCloseTo(r.totalPayable - 4_000_000, 0);
  });

  it("handles the 0% rate edge case without NaN (Risk 2)", () => {
    const r = calculateMortgage({
      propertyPrice: 6_000_000,
      downPayment: 1_000_000,
      annualRatePct: 0,
      years: 10,
    });
    if ("error" in r) throw new Error("unexpected error");
    expect(r.loanPrincipal).toBe(5_000_000);
    expect(r.monthlyPayment).toBeCloseTo(5_000_000 / 120, 2);
    expect(r.totalInterest).toBe(0);
  });

  it("rejects non-positive price", () => {
    const r = calculateMortgage({ propertyPrice: 0, downPayment: 0, annualRatePct: 8, years: 10 });
    expect("error" in r).toBe(true);
  });

  it("rejects down payment >= price", () => {
    const r = calculateMortgage({ propertyPrice: 100, downPayment: 100, annualRatePct: 8, years: 10 });
    expect("error" in r).toBe(true);
  });

  it("rejects duration under 1 year", () => {
    const r = calculateMortgage({ propertyPrice: 100, downPayment: 10, annualRatePct: 8, years: 0 });
    expect("error" in r).toBe(true);
  });

  it("closed-form EMI amortises the loan to ~zero (brute-force check)", () => {
    const price = 8_500_000;
    const down = 1_700_000;
    const rate = 9.25;
    const years = 15;
    const r = calculateMortgage({ propertyPrice: price, downPayment: down, annualRatePct: rate, years });
    if ("error" in r) throw new Error("unexpected error");
    const remaining = verifyByAmortisation(price - down, rate, years, r.monthlyPayment);
    // The EMI is rounded to 2 decimals, so allow 1 paisa of drift per month.
    const tolerance = Math.round(years * 12) * 0.01;
    expect(Math.abs(remaining)).toBeLessThan(tolerance);
  });
});
