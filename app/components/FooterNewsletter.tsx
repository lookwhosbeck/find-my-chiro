"use client";

import { useState, type FormEvent } from "react";
import { CONTACT_INBOX } from "@/app/lib/contact-inbox";
import styles from "./home/home-marketing.module.css";

export function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    try {
      const res = await fetch("/api/email/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error("send failed");
      setSubmitted(true);
    } catch {
      const body = encodeURIComponent(`Please add me to the Movyn newsletter.\n\nEmail: ${trimmed}`);
      window.location.href = `mailto:${CONTACT_INBOX}?subject=${encodeURIComponent("Movyn newsletter signup")}&body=${body}`;
      setSubmitted(true);
    }
  }

  return (
    <div className={styles.newsletter}>
      <h3>Get the Movyn newsletter</h3>
      <p>
        Occasional updates on new features, network growth, and what we&apos;re learning from
        chiropractors and patients. No spam—unsubscribe in one click.
      </p>
      {submitted ? (
        <p className={styles.newsSuccess}>You&apos;re in — check your inbox</p>
      ) : (
        <form className={styles.newsForm} onSubmit={onSubmit}>
          <input
            className={`fmc-pill ${styles.newsInput}`}
            type="email"
            name="email"
            placeholder="you@example.com"
            aria-label="Email for newsletter"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className={`fmc-pill ${styles.pill} ${styles.pillPrimary} ${styles.newsBtn}`}>
            Keep me posted
          </button>
        </form>
      )}
    </div>
  );
}
