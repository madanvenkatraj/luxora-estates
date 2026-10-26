import { useId, useState } from "react";
import { FAQS } from "../data/properties";
import Reveal from "./Reveal";
import { ChevronDownIcon } from "./Icon";

/** FAQ accordion (mounted with id="faq" by the page, not the component).
 * One item open at a time; real buttons so it is keyboard operable;
 * smooth expand/collapse via the grid-rows technique. */
export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const headingId = useId();

  return (
    <section className="section section--ivory" aria-labelledby={headingId}>
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">FAQ</span>
          <h2 id={headingId}>Frequently Asked Questions</h2>
          <p>
            The questions buyers, renters and sellers ask most — answered
            plainly, including where this build is still a demonstration.
          </p>
        </Reveal>
        <div className="faq-list">
          {FAQS.map((faq) => {
            const expanded = openId === faq.id;
            return (
              <div className={`faq-item${expanded ? " is-open" : ""}`} key={faq.id}>
                <h3 style={{ margin: 0 }}>
                  <button
                    type="button"
                    id={`faq-btn-${faq.id}`}
                    className="faq-item__btn"
                    aria-expanded={expanded}
                    aria-controls={`faq-panel-${faq.id}`}
                    onClick={() => setOpenId(expanded ? null : faq.id)}
                  >
                    {faq.question}
                    <ChevronDownIcon size={18} />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${faq.id}`}
                  role="region"
                  aria-labelledby={`faq-btn-${faq.id}`}
                  className={`faq-item__panel${expanded ? " is-open" : ""}`}
                >
                  <div className="faq-item__clip">
                    <p className="faq-item__answer">{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
