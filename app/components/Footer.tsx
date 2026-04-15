import Link from "next/link";
import { MovynLogo } from "@/app/components/MovynLogo";

const linkClass = "text-sm opacity-60 transition-opacity hover:opacity-100";

export function Footer() {
  return (
    <footer id="footer" className="app-container space-y-4 pb-4 lg:pb-8">
      <div className="bg-muted rounded-2xl border p-10">
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 md:grid-cols-4 xl:grid-cols-6">
          <div className="col-span-full space-y-4 xl:col-span-2">
            <Link href="/" className="inline-block leading-none">
              <MovynLogo variant="standard" className="h-9 w-auto" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
              Movyn helps patients find chiropractors who match their values, modalities, and how
              they want to receive care—and helps practices reach the right people.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-lg font-bold">Product</h3>
            <div>
              <Link href="/features" className={linkClass}>
                Features
              </Link>
            </div>
            <div>
              <Link href="/pricing" className={linkClass}>
                Pricing
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-lg font-bold">Community</h3>
            <div>
              <Link href="/about" className={linkClass}>
                About
              </Link>
            </div>
            <div>
              <Link href="/blog" className={linkClass}>
                Blog
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-lg font-bold">Support</h3>
            <div>
              <Link href="/help" className={linkClass}>
                Help Center
              </Link>
            </div>
            <div>
              <Link href="/contact" className={linkClass}>
                Contact Support
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-lg font-bold">Company</h3>
            <div>
              <Link href="/legal" className={linkClass}>
                Legal
              </Link>
            </div>
            <div>
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="text-muted-foreground flex flex-col justify-between gap-4 text-sm sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-start">
          <span>&copy; {new Date().getFullYear()} Movyn</span>
          <span className="hidden sm:inline">|</span>
          <span className="text-center sm:text-left">All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
