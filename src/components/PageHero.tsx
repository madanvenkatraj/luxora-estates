import type { ReactNode } from "react";

/** Interior-page hero used by secondary pages (about, contact, sell,
 * agents, tools) until those sections ship their own headers. */
export default function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <p style={{ letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", fontSize: "0.78rem", fontWeight: 600 }}>
          {eyebrow}
        </p>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
        {children}
      </div>
    </section>
  );
}
