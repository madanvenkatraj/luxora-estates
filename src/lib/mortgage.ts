/** Mortgage math for the "PLAN YOUR HOME INVESTMENT" calculator.
 *
 * Uses the standard reducing-balance EMI formula:
 *   EMI = P·r·(1+r)^n / ((1+r)^n − 1)
 * with r the MONTHLY rate and n the number of months.
 * Special case r = 0: EMI = P / n (division by zero otherwise).
 *
 * All results are illustrative estimates — not financial advice
 * or a bank-approved quotation. */

export interface MortgageInputs {
  /** Property price (INR). */
  propertyPrice: number;
  /** Down payment (INR). */
  downPayment: number;
  /** Annual interest rate in percent (0 allowed). */
  annualRatePct: number;
  /** Loan duration in whole years (>= 1). */
  years: number;
}

export interface MortgageResult {
  /** Monthly EMI in INR. */
  monthlyPayment: number;
  /** Loan principal = price − down payment (clamped at ≥ 0). */
  loanPrincipal: number;
  /** Total of all payments minus principal. */
  totalInterest: number;
  /** Principal + interest, what the borrower repays in total. */
  totalPayable: number;
}

export function calculateMortgage(
  raw: MortgageInputs,
): MortgageResult | { error: string } {
  const price = raw.propertyPrice;
  const down = raw.downPayment;
  const years = raw.years;

  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Enter a property price greater than zero." };
  }
  if (!Number.isFinite(down) || down < 0) {
    return { error: "Down payment cannot be negative." };
  }
  if (down >= price) {
    return {
      error:
        "Down payment covers the full price — no loan is needed. Reduce it below the property price to see a loan.",
    };
  }
  if (!Number.isFinite(years) || years < 1) {
    return { error: "Loan duration must be at least 1 year." };
  }
  if (!Number.isFinite(raw.annualRatePct) || raw.annualRatePct < 0) {
    return { error: "Interest rate cannot be negative." };
  }

  const loanPrincipal = price - down;
  const months = Math.round(years * 12);
  const r = raw.annualRatePct / 12 / 100;

  let monthlyPayment: number;
  if (r === 0) {
    // Special case: no interest — simple division avoids NaN.
    monthlyPayment = loanPrincipal / months;
  } else {
    const growth = Math.pow(1 + r, months);
    monthlyPayment = (loanPrincipal * r * growth) / (growth - 1);
  }

  const totalPayable = monthlyPayment * months;
  const totalInterest = totalPayable - loanPrincipal;

  return {
    monthlyPayment: round2(monthlyPayment),
    loanPrincipal: round2(loanPrincipal),
    totalInterest: round2(totalInterest),
    totalPayable: round2(totalPayable),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Sanity: EMI computed by brute-force amortisation should pay the loan
 * off exactly. Exported for the test-suite to prove the closed form. */
export function verifyByAmortisation(
  principal: number,
  annualRatePct: number,
  years: number,
  emi: number,
): number {
  // Returns the remaining balance after all EMIs; ~0 means the EMI is right.
  const months = Math.round(years * 12);
  const r = annualRatePct / 12 / 100;
  let balance = principal;
  for (let i = 0; i < months; i += 1) {
    if (r === 0) {
      balance -= emi;
    } else {
      balance = balance * (1 + r) - emi;
    }
  }
  return balance;
}
