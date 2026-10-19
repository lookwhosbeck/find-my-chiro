"use client";

import { useState } from "react";
import { CONTACT_INBOX } from "@/app/lib/contact-inbox";
import styles from "./home-marketing.module.css";

const faqItems = [
  {
    q: "Is Movyn free for patients?",
    a: "Yes. Searching, filtering, saving preferences, and contacting a chiropractor on Movyn is free. We make money from practice memberships, not from patients.",
  },
  {
    q: "How is Movyn different from a regular directory?",
    a: "Most directories rank by distance or who pays for ads. Movyn matches on the things that actually shape your care—technique, philosophy, payment model, focus areas, and visit style—so the chiropractor you find is one who's a real fit, not just the closest one.",
  },
  {
    q: "Are the chiropractors on Movyn vetted?",
    a: "Yes. Every chiropractor goes through license verification before their profile is visible to patients. You'll see their state license, school, graduation year, and credentials on every profile.",
  },
  {
    q: "Does Movyn give medical advice or book appointments for me?",
    a: "No. Movyn helps you find the right chiropractor; care decisions and scheduling stay between you and the practice. We hand you off directly—through their booking link, phone number, or website—so there's no middleman.",
  },
  {
    q: "How do you handle my data?",
    a: "We use your information to surface better matches and to let you reach out to a practice—nothing else. We don't sell your data, and we don't share your search activity with chiropractors you haven't contacted.",
  },
  {
    q: "I'm a chiropractor—how do I list my practice?",
    a: "Create a free account, add your practice details, and submit your license for verification. Once you're approved, you can publish your profile and start receiving fit-matched patient inquiries.",
  },
  {
    q: "How much does it cost to be on Movyn?",
    a: "A verified profile is free—there's no monthly cost. Premium is $30/month (or 20% off when billed annually) and unlocks unlimited modalities, priority placement, direct messages, and provider referrals. Every plan includes an annual $50 license verification fee to confirm your license remains in good standing, which is waived for our first 250 founding members.",
  },
] as const;

export function HomeFAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className={styles.section}>
      <div className={`app-container ${styles.faqGrid}`}>
        <div className={styles.faqCopy}>
          <div className={styles.eyebrow}>FAQs</div>
          <h2 className={styles.h2}>Questions we get a lot</h2>
          <div id="contact" className={styles.contactCard}>
            <h3 className={styles.contactTitle}>We read every message.</h3>
            <div className={styles.contactRows}>
              <div className={styles.contactRow}>
                <span>General</span>
                <a
                  className={styles.contactLink}
                  href={`mailto:${CONTACT_INBOX}?subject=${encodeURIComponent("Movyn website inquiry")}`}
                >
                  {CONTACT_INBOX}
                </a>
              </div>
              <div className={styles.contactRow}>
                <span>For chiropractors</span>
                <a
                  className={styles.contactLink}
                  href={`mailto:${CONTACT_INBOX}?subject=${encodeURIComponent("Movyn practice question")}`}
                >
                  {CONTACT_INBOX}
                </a>
              </div>
            </div>
            <p className={styles.contactNote}>
              Most messages get a reply within one business day, Monday through Friday.
            </p>
          </div>
        </div>
        <div className={styles.faqList}>
          {faqItems.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q} className={styles.faqItem}>
                <button
                  type="button"
                  className={styles.faqTrigger}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  {item.q}
                  <span className={styles.faqGlyph} aria-hidden>
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? <p className={styles.faqAnswer}>{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
