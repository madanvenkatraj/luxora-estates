import { useEffect, useState } from "react";
import { AGENTS } from "../data/properties";
import { fetchAgents } from "../lib/api";
import type { Agent } from "../types";
import SmartImage from "./SmartImage";
import Reveal from "./Reveal";
import {
  CheckIcon,
  ChevronDownIcon,
  MailIcon,
  PhoneIcon,
} from "./Icon";

/** Agents showcase. Every profile is a fictional sample agent — the
 * badge on the photo, the page intro and the footnote all say so.
 * "View Profile" expands the profile inline; "Contact Agent" opens a
 * mailto: draft addressed to the (placeholder) agent email.
 *
 * Data source: renders the static roster first, then swaps in the API
 * list only when it resolves non-empty — so an unreachable API leaves
 * the section pixel-identical. */
export default function AgentsSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [remote, setRemote] = useState<Agent[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchAgents().then((list) => {
      if (alive && list.length > 0) setRemote(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const agents = remote ?? AGENTS;

  return (
    <section className="section" aria-labelledby="agents-section-title">
      <div className="container">
        <Reveal className="section-head">
          <span className="eyebrow">Our agents</span>
          <h2 id="agents-section-title">Specialists for Every Kind of Home</h2>
          <p>
            Sample specialists across villas, commercial, rentals and luxury
            homes. Expand a profile for languages and contact details — every
            profile is visibly labelled as a sample agent.
          </p>
        </Reveal>
        <div className="cards-grid">
          {agents.map((agent, i) => {
            const expanded = openId === agent.id;
            return (
              <Reveal delay={i * 60} key={agent.id}>
                <article
                  className={`agent-card${expanded ? " is-open" : ""}`}
                  style={{ height: "100%" }}
                >
                  <div className="agent-card__media">
                    <SmartImage
                      src={agent.photo}
                      alt={`Portrait of sample agent ${agent.name}`}
                      className="agent-card__img"
                      eager={i < 2}
                    />
                    <span className="badge badge--gold agent-card__sample">
                      Sample agent
                    </span>
                  </div>
                  <div className="agent-card__body">
                    <h3 className="agent-card__name">{agent.name}</h3>
                    <p className="agent-card__role">{agent.title}</p>
                    <p className="agent-card__spec">{agent.specialty}</p>
                    <p className="agent-card__bio">{agent.bio}</p>
                    <div className="agent-card__stats">
                      <div className="agent-card__stat">
                        <b>{agent.experienceYears}</b>
                        <span>Years</span>
                      </div>
                      <div className="agent-card__stat">
                        <b>{agent.listingsCount}</b>
                        <span>Listings</span>
                      </div>
                      <div className="agent-card__stat">
                        <b>{agent.languages.length}</b>
                        <span>Languages</span>
                      </div>
                    </div>
                    <div className="agent-card__actions">
                      <button
                        type="button"
                        id={`agent-btn-${agent.id}`}
                        className="btn btn--outline btn--sm"
                        aria-expanded={expanded}
                        aria-controls={`agent-more-${agent.id}`}
                        onClick={() => setOpenId(expanded ? null : agent.id)}
                      >
                        {expanded ? "Hide profile" : "View Profile"}
                        <ChevronDownIcon size={15} />
                      </button>
                      <a
                        className="btn btn--navy btn--sm"
                        href={`mailto:${agent.email}?subject=Property%20inquiry%20via%20LUXORA%20ESTATES%20demo`}
                      >
                        <MailIcon size={15} />
                        Contact Agent
                        <span className="sr-only"> (sample agent)</span>
                      </a>
                    </div>
                    <div
                      id={`agent-more-${agent.id}`}
                      role="region"
                      aria-labelledby={`agent-btn-${agent.id}`}
                      className={`agent-card__more${expanded ? " is-open" : ""}`}
                    >
                      <div className="agent-card__clip">
                        <div className="agent-card__more-inner">
                          <p className="agent-card__note">
                            <CheckIcon size={16} />
                            Demonstration profile — contact details are
                            placeholders until real agents are connected.
                          </p>
                          <div className="agent-card__chips">
                            {agent.languages.map((lang) => (
                              <span className="agent-card__chip" key={lang}>
                                {lang}
                              </span>
                            ))}
                          </div>
                          <div className="agent-card__contact">
                            <span>
                              <PhoneIcon size={15} />
                              {agent.phone}
                            </span>
                            <span>
                              <MailIcon size={15} />
                              {agent.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        <p className="demo-note section-note">
          <strong>Demonstration data.</strong> All agent profiles above are
          fictional samples with placeholder contact details.
        </p>
      </div>
    </section>
  );
}
