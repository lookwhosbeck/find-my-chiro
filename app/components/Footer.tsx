import Link from "next/link";
import { MovynLogo } from "@/app/components/MovynLogo";
import { FooterNewsletter } from "@/app/components/FooterNewsletter";
import styles from "./home/home-marketing.module.css";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/search", label: "Find Care" },
      { href: "/#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Community",
    links: [{ href: "/about", label: "About" }],
  },
  {
    title: "Support",
    links: [
      { href: "/#faq", label: "Help Center" },
      { href: "/#contact", label: "Contact Support" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer id="footer" className="app-container flex flex-col gap-4 pb-8">
      <div className={styles.footerCard}>
        <div className={styles.footerTop}>
          <div className={styles.brand}>
            <Link href="/" className="inline-block leading-none self-start">
              <MovynLogo variant="standard" className="h-8 w-auto" />
            </Link>
            <p>
              Movyn helps patients find chiropractors who match their values, modalities, and how
              they want to receive care—and helps practices reach the right people.
            </p>
          </div>
          <FooterNewsletter />
        </div>

        {columns.map((column) => (
          <div key={column.title} className={styles.linkCol}>
            <h3>{column.title}</h3>
            {column.links.map((link) => (
              <Link key={link.label} href={link.href} className={styles.footerLink}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.legal}>© {new Date().getFullYear()} Movyn. All rights reserved.</div>
    </footer>
  );
}
