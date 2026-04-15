import Link from 'next/link';

export function Footer() {
  return (
    <footer
      className="footer-container"
      style={{
        background: 'var(--color-text-primary)',
        margin: 'var(--space-4)',
        padding: 'var(--space-5)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="mx-auto w-full max-w-[1160px] px-4 md:px-6">
        <div className="flex flex-col gap-6 py-5">
          {/* Footer Links */}
          <div className="flex flex-col flex-wrap justify-between gap-10 md:flex-row">
            {/* Product Column */}
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span
                className="mb-2 text-sm font-medium uppercase tracking-wide text-card"
                style={{
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--color-surface)',
                }}
              >
                Product
              </span>
              <div
                style={{
                  height: '0.5px',
                  background: 'var(--color-border)',
                  marginBottom: 'var(--space-2)',
                }}
              />
              <div className="flex flex-col gap-1">
                <Link
                  href="/features"
                  style={{ textDecoration: 'none', opacity: 0.8 }}
                >
                  <span
                    className="text-sm text-card"
                    style={{
                      color: 'var(--color-surface)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Features
                  </span>
                </Link>
                <Link
                  href="/pricing"
                  style={{ textDecoration: 'none', opacity: 0.8 }}
                >
                  <span
                    className="text-sm text-card"
                    style={{
                      color: 'var(--color-surface)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Pricing
                  </span>
                </Link>
              </div>
            </div>

            {/* Community Column */}
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span
                className="mb-2 text-sm font-medium uppercase tracking-wide text-card"
                style={{
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--color-surface)',
                }}
              >
                Community
              </span>
              <div
                style={{
                  height: '0.5px',
                  background: 'var(--color-border)',
                  marginBottom: 'var(--space-2)',
                }}
              />
              <div className="flex flex-col gap-1">
                <Link
                  href="/about"
                  style={{ textDecoration: 'none', opacity: 0.8 }}
                >
                  <span
                    className="text-sm text-card"
                    style={{
                      color: 'var(--color-surface)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    About
                  </span>
                </Link>
                <Link
                  href="/blog"
                  style={{ textDecoration: 'none', opacity: 0.8 }}
                >
                  <span
                    className="text-sm text-card"
                    style={{
                      color: 'var(--color-surface)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Blog
                  </span>
                </Link>
              </div>
            </div>

            {/* Support Column */}
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span
                className="mb-2 text-sm font-medium uppercase tracking-wide text-card"
                style={{
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--color-surface)',
                }}
              >
                Support
              </span>
              <div
                style={{
                  height: '0.5px',
                  background: 'var(--color-border)',
                  marginBottom: 'var(--space-2)',
                }}
              />
              <div className="flex flex-col gap-1">
                <Link
                  href="/help"
                  style={{ textDecoration: 'none', opacity: 0.8 }}
                >
                  <span
                    className="text-sm text-card"
                    style={{
                      color: 'var(--color-surface)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Help Center
                  </span>
                </Link>
                <Link
                  href="/contact"
                  style={{ textDecoration: 'none', opacity: 0.8 }}
                >
                  <span
                    className="text-sm text-card"
                    style={{
                      color: 'var(--color-surface)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Contact Support
                  </span>
                </Link>
              </div>
            </div>

            {/* Company Column */}
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span
                className="mb-2 text-sm font-medium uppercase tracking-wide text-card"
                style={{
                  fontSize: 'var(--text-sm)',
                  letterSpacing: 'var(--tracking-wide)',
                  color: 'var(--color-surface)',
                }}
              >
                Company
              </span>
              <div
                style={{
                  height: '0.5px',
                  background: 'var(--color-border)',
                  marginBottom: 'var(--space-2)',
                }}
              />
              <div className="flex flex-col gap-1">
                <Link
                  href="/legal"
                  style={{ textDecoration: 'none', opacity: 0.8 }}
                >
                  <span
                    className="text-sm text-card"
                    style={{
                      color: 'var(--color-surface)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Legal
                  </span>
                </Link>
                <Link
                  href="/privacy"
                  style={{ textDecoration: 'none', opacity: 0.8 }}
                >
                  <span
                    className="text-sm text-card"
                    style={{
                      color: 'var(--color-surface)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    Privacy Policy
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              height: '0.5px',
              background: 'var(--color-border)',
              marginTop: 'var(--space-4)',
            }}
          />
          <div className="mt-4 flex flex-col items-center justify-between gap-4 md:flex-row">
            <span
              className="text-sm text-card opacity-80"
              style={{
                color: 'var(--color-surface)',
                fontSize: 'var(--text-base)',
                letterSpacing: 'var(--tracking-normal)',
              }}
            >
              © 2026 Movyn. All rights reserved.
            </span>
            <div className="flex items-center gap-2">{/* Social icons placeholder */}</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
