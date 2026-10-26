import PageHero from "../components/PageHero";
import MortgageCalculator from "../components/MortgageCalculator";
import "../styles/tools.css";

/** Explainer cards under the calculator. */
const NOTES = [
  {
    id: "how",
    title: "How the estimate is calculated",
    body: "A standard reducing-balance EMI: interest accrues monthly on the outstanding principal, so early payments are interest-heavy and later ones retire more of the loan.",
  },
  {
    id: "what-if",
    title: "What changes the payment most",
    body: "Duration and rate dominate. A shorter tenure raises the monthly payment but cuts total interest sharply; every 0.5% on the rate compounds across the whole tenure.",
  },
  {
    id: "before-you-apply",
    title: "Before you apply",
    body: "Lenders also weigh your income stability, credit history and existing obligations. Keep the estimated EMI comfortably inside your monthly budget.",
  },
];

export default function ToolsPage() {
  return (
    <>
      <PageHero
        eyebrow="Tools"
        title="Plan Your Home Investment"
        intro="Estimate a home loan's monthly payment and total interest. Illustrative figures only — not financial advice or a bank-approved quotation."
      />
      <MortgageCalculator />
      <section className="section section--ivory" aria-label="About this tool">
        <div className="container">
          <div className="cards-grid">
            {NOTES.map((n) => (
              <div className="tool-note" key={n.id}>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
