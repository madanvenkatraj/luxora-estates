import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import ContactForm from "../components/ContactForm";
import { MailIcon, PhoneIcon, PinIcon } from "../components/Icon";
import "../styles/tools.css";

/** Contact details are placeholders for this demonstration platform. */
const DETAILS = [
  {
    id: "phone",
    icon: PhoneIcon,
    label: "Call us",
    value: "+91 80 4000 XXXX",
    note: "Mon–Sat, 9:30am – 6:30pm IST",
  },
  {
    id: "email",
    icon: MailIcon,
    label: "Email",
    value: "hello@luxoraestates.example",
    note: "We reply within one business day",
  },
  {
    id: "address",
    icon: PinIcon,
    label: "Visit",
    value: "MG Road, Bengaluru",
    note: "By appointment",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk To A Property Specialist"
        intro="Placeholder contact details — this demonstration platform does not connect to a live agency."
      />
      <section className="section section--ivory" aria-labelledby="contact-heading">
        <div className="container">
          <div className="contact-grid">
            <div>
              <div className="contact-card">
                <h2 id="contact-heading">Reach the desk</h2>
                <p className="contact-lead">
                  Details below are placeholders for demonstration and are not
                  real contact points.
                </p>
                <ul className="contact-rows">
                  {DETAILS.map((d) => (
                    <li className="contact-row" key={d.id}>
                      <d.icon size={18} />
                      <div>
                        <p className="contact-row__label">
                          {d.label}
                          <span className="tag--placeholder">Placeholder</span>
                        </p>
                        <p className="contact-row__value">{d.value}</p>
                        <p className="form-note">{d.note}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="demo-note contact-note">
                <MailIcon size={16} />
                <span>
                  <strong>Looking for answers first?</strong> Browse our{" "}
                  <Link to="/about#faq" className="link-inline">
                    frequently asked questions
                  </Link>
                  .
                </span>
              </p>
            </div>
            <div className="form-card">
              <div className="form-card__head">
                <h3>Send a message</h3>
                <p>
                  Validation and confirmation happen entirely in this browser.
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
