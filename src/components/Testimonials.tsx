import { useCallback, useEffect, useRef, useState } from "react";
import { TESTIMONIALS } from "../data/properties";
import Reveal from "./Reveal";
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from "./Icon";

/** Testimonials carousel. One slide visible at a time; an sr-only
 * aria-live region announces the position after navigation. Prev/next
 * and the dots are real buttons, so the whole control row is keyboard
 * operable; inactive slides are aria-hidden. */
export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = TESTIMONIALS.length;
  const liveRef = useRef<HTMLParagraphElement>(null);

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (liveRef.current) {
      liveRef.current.textContent = `Showing testimonial ${index + 1} of ${count}`;
    }
  }, [index, count]);

  return (
    <section className="section section--ivory" aria-labelledby="testimonials-title">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Client voices</span>
          <h2 id="testimonials-title">What Our Clients Say</h2>
          <p>
            A selection of recent client experiences — every one a sample
            story written for this demonstration build.
          </p>
        </Reveal>
        <div className="testi">
          <div className="testi__viewport">
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={t.id}
                className={`testi__slide${i === index ? " is-active" : ""}`}
                aria-hidden={i !== index}
              >
                <div className="testi__head">
                  <span className="testi__avatar" aria-hidden="true">
                    {t.initials}
                  </span>
                  <div className="testi__who">
                    <b>{t.name}</b>
                    <span className="testi__role">{t.role}</span>
                  </div>
                  <span
                    className="testi__stars"
                    role="img"
                    aria-label={`Rated ${t.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, s) => (
                      <StarIcon key={s} size={15} filled={s < t.rating} />
                    ))}
                  </span>
                </div>
                <blockquote className="testi__quote">{t.quote}</blockquote>
                <figcaption className="sr-only">
                  Testimonial from {t.name}, {t.role}, rated {t.rating} of 5.
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="testi__controls">
            <button
              type="button"
              className="testi__arrow"
              onClick={() => go(index - 1)}
            >
              <ChevronLeftIcon size={18} />
              <span className="sr-only">Previous testimonial</span>
            </button>
            <div className="testi__dots">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  className="testi__dot"
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => go(i)}
                >
                  <i />
                  <span className="sr-only">
                    Testimonial {i + 1} of {count}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="testi__arrow"
              onClick={() => go(index + 1)}
            >
              <ChevronRightIcon size={18} />
              <span className="sr-only">Next testimonial</span>
            </button>
          </div>
          <p ref={liveRef} className="sr-only" aria-live="polite" />
          <p className="demo-note testi-note">
            <strong>Sample testimonials</strong> for demonstration.
          </p>
        </div>
      </div>
    </section>
  );
}
