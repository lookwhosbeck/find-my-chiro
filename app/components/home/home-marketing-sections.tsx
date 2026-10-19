import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import styles from "./home-marketing.module.css";

const whyItems = [
  {
    title: "Matching, not just mapping",
    description:
      "We weigh technique, treatment philosophy, focus areas, and how a practice runs—then surface chiropractors who actually fit, instead of ranking by distance alone.",
  },
  {
    title: "Know what to expect before you book",
    description:
      "Cash, insurance, sliding scale, visit length, follow-up cadence—every profile spells it out up front, so you walk in with no surprises and the right questions.",
  },
  {
    title: "Less wasted time on both sides",
    description:
      "Patients stop calling around. Chiropractors stop fielding inquiries that were never going to be a fit. Everyone gets to the right conversation faster.",
  },
  {
    title: "Verified, licensed providers only",
    description:
      "Every chiropractor on Movyn has had their state license verified. Education, graduation year, and credentials are visible on every profile.",
  },
] as const;

const patientFeatures = [
  {
    title: "Search built for chiropractic, not generic health",
    description:
      "Filter by adjustment style, soft-tissue work, instrument-assisted technique, decompression, prenatal, pediatric—the choices patients actually weigh before they book.",
  },
  {
    title: "Fit-first match scoring",
    description:
      "When you set your preferences, Movyn ranks practices by how well they line up with what you want—not by who paid the most for placement.",
  },
  {
    title: "One step to make contact",
    description:
      "Visit the practice's website, call the office, or send a direct request through Movyn—whichever the chiropractor prefers. No middleman, no playing phone tag.",
  },
  {
    title: "Privacy-minded by default",
    description:
      "We don't sell your data, and we don't share your search activity with practices. Your information is used to find you better matches—nothing else.",
  },
] as const;

const practiceFeatures = [
  {
    title: "Profiles that read like a real practice",
    description:
      "A bio in the chiropractor's own words, the room they treat in, their team, their approach. Enough to know if it feels right before you pick up the phone.",
    pro: false,
  },
  {
    title: "Referrals between providers",
    description:
      "Refer patients to a colleague who's a better fit for what they need, in a network of vetted chiropractors. Built in collaboration with the providers who use it.",
    pro: true,
  },
  {
    title: "Trust & verification",
    description:
      "Every chiropractor on Movyn has their license verified before their profile goes live. Patient privacy is protected by default—no selling data, no aggressive remarketing.",
    pro: false,
  },
] as const;

const testimonials = [
  {
    quote:
      "I don't want anyone who'll just crack my back. I wanted someone who does soft-tissue work and explains what they're doing. Movyn was the first place that let me filter for that.",
    name: "What patients tell us",
    role: "Patient research",
  },
  {
    quote:
      "Most directory leads were the wrong fit—people calling about insurance I don't take, or expecting a model of care I don't practice. The patients reaching out through Movyn already know what I do.",
    name: "What chiropractors tell us",
    role: "Provider research",
  },
  {
    quote:
      "We finally have a way to send a patient to a colleague we trust, knowing they'll get exactly the care that's right for them.",
    name: "What network providers tell us",
    role: "Referral partner research",
  },
] as const;

const founders = [
  {
    name: "Dr. Lance Gard",
    role: "Co-founder",
    bio: "Practicing chiropractor shaping how Movyn represents real-world care—so patients find the right fit on the first visit, not the fifth.",
  },
  {
    name: "Dr. Stephen Kosterman",
    role: "Co-founder",
    bio: "Brings the provider's perspective to every feature, making sure Movyn works for the way chiropractors actually run their practices.",
  },
  {
    name: "Nick Becker",
    role: "Co-founder",
    bio: "Leads product and design, turning conversations with patients and providers into the Movyn experience you see today.",
  },
] as const;

export function HomeWhy() {
  return (
    <section id="benefits" className={styles.section}>
      <div className={`app-container ${styles.whyGrid}`}>
        <div className={styles.whyCopy}>
          <div className={styles.eyebrow}>Why Movyn</div>
          <h2 className={styles.h2}>Generic directories weren&apos;t built for chiropractic care.</h2>
          <p className={styles.lead}>
            Patients waste hours calling around to find someone who actually does what they need.
            Chiropractors waste hours on inquiries that were never going to be a fit. Movyn fixes
            both sides of that problem.
          </p>
        </div>
        <div className={styles.whyItems}>
          {whyItems.map((item, index) => (
            <div key={item.title} className={styles.whyItem}>
              <span className={styles.whyNum}>0{index + 1}</span>
              <h3 className={styles.whyTitle}>{item.title}</h3>
              <p className={styles.whyBody}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeBothSides() {
  return (
    <section id="solutions" className={styles.section}>
      <div className="app-container">
        <header className={styles.centerHeader}>
          <div className={styles.eyebrow}>What&apos;s on Movyn</div>
          <h2 className={styles.h2}>Built for both sides of the appointment.</h2>
          <p className={styles.lead}>
            Patients get a smarter way to search. Chiropractors get a profile, a referral network,
            and verified trust signals that turn the right kind of attention into the right kind of
            patient.
          </p>
        </header>
        <div className={styles.panelGrid}>
          <div className={`${styles.panel} ${styles.panelLight}`}>
            <div className={styles.panelIntro}>
              <div className={styles.panelEyebrow}>For patients</div>
              <h3 className={styles.h3}>Smart search</h3>
              <p className={styles.panelDesc}>
                Search by ZIP and the things that actually matter: technique, philosophy, payment
                model, focus areas, even preferred days and times. Save your preferences once and
                your matches keep getting sharper.
              </p>
            </div>
            <div>
              {patientFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`${styles.featureRow} ${index === patientFeatures.length - 1 ? styles.featureRowLast : ""}`}
                >
                  <Check className={styles.check} size={16} aria-hidden />
                  <div>
                    <div className={styles.featureTitle}>{feature.title}</div>
                    <p className={styles.featureBody}>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.ctaRow}>
              <Link href="/signup-patient" className={`fmc-pill ${styles.pill} ${styles.pillPrimary}`}>
                Find my chiropractor
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </div>

          <div className={`${styles.panel} ${styles.panelDark}`}>
            <div className={styles.panelIntro}>
              <div className={`${styles.panelEyebrow} ${styles.panelEyebrowDark}`}>For practices</div>
              <h3 className={`${styles.h3} ${styles.h3OnDark}`}>Living profiles</h3>
              <p className={`${styles.panelDesc} ${styles.panelDescDark}`}>
                Show how you really practice. Bio, modalities, focus areas, rates, payment models,
                and accepting-new-patients status all surface as match signals—so the people who
                reach out are the people you want to treat.
              </p>
            </div>
            <div>
              {practiceFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`${styles.featureRow} ${styles.featureRowDark} ${index === practiceFeatures.length - 1 ? styles.featureRowDarkLast : ""}`}
                >
                  <Check className={`${styles.check} ${styles.checkDark}`} size={16} aria-hidden />
                  <div>
                    {feature.pro ? (
                      <div className={styles.featureTitleRow}>
                        {feature.title}
                        <span className={styles.proBadge}>PRO</span>
                      </div>
                    ) : (
                      <div className={`${styles.featureTitle} ${styles.featureTitleDark}`}>
                        {feature.title}
                      </div>
                    )}
                    <p className={`${styles.featureBody} ${styles.featureBodyDark}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.ctaRow}>
              <Link href="/join" className={`fmc-pill ${styles.pill} ${styles.pillWhite}`}>
                List your practice
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="#pricing" className={`fmc-pill ${styles.pill} ${styles.pillOutlineDark}`}>
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeTestimonials() {
  return (
    <section id="testimonials" className={styles.section}>
      <div className="app-container">
        <header className={styles.centerHeader}>
          <div className={styles.eyebrow}>What we hear</div>
          <h2 className={styles.h2}>The frustration we kept hearing on both sides.</h2>
        </header>
        <div className={styles.quoteGrid}>
          {testimonials.map((review) => (
            <figure key={review.name} className={styles.quote}>
              <blockquote className={styles.quoteText}>&ldquo;{review.quote}&rdquo;</blockquote>
              <figcaption>
                <span className={styles.quoteName}>{review.name}</span>
                <span className={styles.quoteRole}>{review.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className={styles.disclaimer}>
          Quotes drawn from patient and provider conversations during Movyn&apos;s build. Real
          customer stories will replace these as the network grows.
        </p>
      </div>
    </section>
  );
}

export function HomeTeam() {
  return (
    <section id="about" className={styles.section}>
      <div className={`app-container ${styles.founderGrid}`}>
        <figure className={styles.founderPhoto}>
          <Image
            src="/homepage/founders-photo.jpg"
            alt="Movyn founders Dr. Lance Gard, Dr. Stephen Kosterman, and Nick Becker"
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
        </figure>
        <div className={styles.founderCopy}>
          <div className={styles.eyebrow}>Meet the founders</div>
          <h2 className={styles.h2}>Built by chiropractors and patients who wanted better.</h2>
          <p className={styles.lead}>
            Movyn is shaped by ongoing conversations with the providers and patients it serves.
            Here&apos;s the team making sure the product keeps reflecting how chiropractic care
            actually works.
          </p>
          <div className={styles.founderList}>
            {founders.map((person, index) => (
              <div
                key={person.name}
                className={`${styles.founderRow} ${index === founders.length - 1 ? styles.founderRowLast : ""}`}
              >
                <div>
                  <h3 className={styles.founderName}>{person.name}</h3>
                  <p className={styles.founderRole}>{person.role}</p>
                </div>
                <p className={styles.founderBio}>{person.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeClosingCta() {
  return (
    <section className={styles.sectionClosing}>
      <div className="app-container">
        <div className={styles.closingPanel}>
          <div className={styles.closingCopy}>
            <h2 className={`${styles.h2} ${styles.h2OnDark}`}>
              Better-fit chiropractic care starts with the right network.
            </h2>
            <p className={styles.closingLead}>
              Movyn is built with—and for—the chiropractors and patients who use it. Join the
              network and help shape what better-fit care looks like.
            </p>
            <div className={styles.closingActions}>
              <Link href="/signup-patient" className={`fmc-pill ${styles.pill} ${styles.pillLg} ${styles.pillWhite}`}>
                I&apos;m looking for care
              </Link>
              <Link href="/join" className={`fmc-pill ${styles.pill} ${styles.pillLg} ${styles.pillOutlineDark}`}>
                I&apos;m a chiropractor
              </Link>
            </div>
          </div>
          <div
            className={styles.closingPhoto}
            style={{ backgroundImage: "url(/hero/home-hero-bg.jpg)" }}
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
