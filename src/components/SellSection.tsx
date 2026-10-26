import SellPropertyForm from "./SellPropertyForm";
import { ShieldIcon } from "./Icon";
import "../styles/tools.css";

/** Home-page section: READY TO SELL YOUR PROPERTY? — pitch on the left,
 * the full submission form on the right. Also reused by /sell. */
export default function SellSection() {
  return (
    <section className="section section--ivory" aria-labelledby="sell-heading">
      <div className="container">
        <div className="sell-grid">
          <div>
            <div className="section-head sell-intro">
              <p className="eyebrow">Sell with us</p>
              <h2 id="sell-heading">Ready To Sell Your Property?</h2>
              <p>
                List with a specialist who knows your neighbourhood. Share a
                few details and a valuation specialist follows up within one
                business day.
              </p>
            </div>
            <div className="sell-steps">
              <div className="sell-step">
                <span className="sell-step__num" aria-hidden="true">1</span>
                <div>
                  <h3>Share the essentials</h3>
                  <p>
                    Type, location and expected price are enough to open the
                    file.
                  </p>
                </div>
              </div>
              <div className="sell-step">
                <span className="sell-step__num" aria-hidden="true">2</span>
                <div>
                  <h3>Valuation & walkthrough</h3>
                  <p>
                    We benchmark comparable listings before photographing the
                    home.
                  </p>
                </div>
              </div>
              <div className="sell-step">
                <span className="sell-step__num" aria-hidden="true">3</span>
                <div>
                  <h3>Launch & close</h3>
                  <p>
                    Curated promotion to matched buyers, then offers negotiated
                    for you.
                  </p>
                </div>
              </div>
            </div>
            <p className="demo-note sell-trust">
              <ShieldIcon size={16} />
              <span>
                <strong>Demonstration platform.</strong> Submissions are
                validated and confirmed locally — your property is not
                published and no personal data is stored.
              </span>
            </p>
          </div>
          <div className="form-card">
            <SellPropertyForm />
          </div>
        </div>
      </div>
    </section>
  );
}
