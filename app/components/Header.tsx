"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Button, Text } from "@radix-ui/themes";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import { PROFILE_UPDATED_EVENT } from "@/app/lib/profile-events";
import { FindMyChiroLogo } from "@/app/components/FindMyChiroLogo";
import { UserAvatar } from "@/app/components/UserAvatar";
import styles from "./Header.module.css";

type HeaderProfile = {
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

/** Google / Apple OAuth often expose picture in metadata before `profiles` is loaded. */
function oauthAvatarFromSessionUser(
  user: { user_metadata?: Record<string, unknown> } | null,
): string | null {
  const m = user?.user_metadata;
  if (!m || typeof m !== "object") return null;
  for (const key of ["avatar_url", "picture"] as const) {
    const v = m[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function oauthNamesFromSessionUser(
  user: { user_metadata?: Record<string, unknown> } | null,
): {
  first: string | null;
  last: string | null;
} {
  const m = user?.user_metadata;
  if (!m || typeof m !== "object") return { first: null, last: null };
  const str = (key: string) => {
    const v = (m as Record<string, unknown>)[key];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  let first = str("given_name") ?? str("first_name");
  let last = str("family_name") ?? str("last_name");
  if (!first || !last) {
    const full = str("full_name") ?? str("name");
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      if (!first && parts[0]) first = parts[0];
      if (!last && parts.length > 1) last = parts[parts.length - 1];
    }
  }
  return { first, last };
}

type HeaderAuthUser = {
  id: string;
  email: string | null;
  oauthAvatarUrl: string | null;
  oauthFirstName: string | null;
  oauthLastName: string | null;
};

function toHeaderAuthUser(
  u: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null,
): HeaderAuthUser | null {
  if (!u) return null;
  const { first, last } = oauthNamesFromSessionUser(u);
  return {
    id: u.id,
    email: u.email ?? null,
    oauthAvatarUrl: oauthAvatarFromSessionUser(u),
    oauthFirstName: first,
    oauthLastName: last,
  };
}

type HeaderProps = {
  /** When true, header sits in normal flow (e.g. inside the search hero) instead of floating absolutely. */
  embedded?: boolean;
  /** Matches ProximitySearchBar: soft shadow on dark heroes, outline on light surfaces. */
  surface?: "onDark" | "onLight";
};

export function Header({ embedded = false, surface = "onDark" }: HeaderProps) {
  const [user, setUser] = useState<HeaderAuthUser | null>(null);
  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, first_name, last_name, email")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data as HeaderProfile | null);
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(toHeaderAuthUser(u));
      if (u) await loadProfile(u.id);
      else setProfile(null);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(toHeaderAuthUser(u));
      if (u) await loadProfile(u.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  useEffect(() => {
    const onProfileEvent = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u) await loadProfile(u.id);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileEvent);
    return () =>
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileEvent);
  }, [loadProfile]);

  useEffect(() => {
    if (!user) return;
    loadProfile(user.id);
  }, [pathname, user, loadProfile]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setMobileMenuOpen(false);
    router.push("/");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const barClassName = [
    "fmc-site-header",
    styles.bar,
    embedded ? styles.barEmbedded : styles.barFloating,
    surface === "onLight" ? styles.barOnLight : styles.barOnDark,
  ].join(" ");

  return (
    <>
      <header className={barClassName}>
        <Link href="/" className={styles.logoLink}>
          <FindMyChiroLogo variant="standard" className={styles.headerLogo} />
        </Link>

        <div className={styles.desktopCluster}>
          <nav className={styles.navLinks} aria-label="Primary">
            <Link href="/search" className={styles.navTextLink}>
              Find Care
            </Link>
            <Link href="/about" className={styles.navTextLink}>
              About
            </Link>
          </nav>
          <div className={styles.authActions}>
            {user ? (
              <>
                <button
                  type="button"
                  className={styles.navTextButton}
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
                <Button
                  size="2"
                  variant="solid"
                  asChild
                  className={`join-network-button fmc-black-pill-cta ${styles.joinCta}`}
                >
                  <Link
                    href="/account"
                    className={styles.myAccountCtaLink}
                    aria-label="My account"
                  >
                    <UserAvatar
                      avatarUrl={
                        profile?.avatar_url ?? user.oauthAvatarUrl ?? undefined
                      }
                      firstName={
                        profile?.first_name ?? user.oauthFirstName ?? undefined
                      }
                      lastName={
                        profile?.last_name ?? user.oauthLastName ?? undefined
                      }
                      email={profile?.email ?? user.email ?? undefined}
                      size={28}
                      variant="circle"
                      fallbackTone="onDark"
                      alt=""
                    />
                    <span className={styles.myAccountCtaLabel}>My Account</span>
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Link href="/signin" className={styles.navTextLink}>
                  Log in
                </Link>
                <Button
                  size="2"
                  variant="solid"
                  asChild
                  className={`join-network-button fmc-black-pill-cta ${styles.joinCta}`}
                >
                  <Link href="/join">Join Network</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={toggleMobileMenu}
          className={styles.mobileMenuButton}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </Button>
      </header>

      {mounted &&
        mobileMenuOpen &&
        createPortal(
          <div className={styles.mobileFlyoutRoot}>
            <button
              type="button"
              className={styles.mobileFlyoutBackdrop}
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className={styles.mobileFlyoutPanel}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
            >
              <div className={styles.mobileFlyoutInner}>
                <div className={styles.mobileFlyoutHeaderRow}>
                  <Text
                    size="2"
                    weight="bold"
                    color="gray"
                    style={{
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Menu
                  </Text>
                  <Button
                    type="button"
                    variant="ghost"
                    size="2"
                    aria-label="Close menu"
                    className={styles.mobileFlyoutClose}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </Button>
                </div>
                <div className={styles.mobileFlyoutLinks}>
                  <Link
                    href="/search"
                    className={styles.mobileFlyoutLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Find Care
                  </Link>
                  <Link
                    href="/about"
                    className={styles.mobileFlyoutLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                </div>
                <div className={styles.mobileFlyoutDivider} />
                {user ? (
                  <div className={styles.mobileFlyoutActions}>
                    <Button
                      size="2"
                      variant="solid"
                      asChild
                      className={`join-network-button fmc-black-pill-cta ${styles.mobileJoinCta}`}
                    >
                      <Link
                        href="/account"
                        className={styles.mobileMyAccountCtaLink}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserAvatar
                          avatarUrl={
                            profile?.avatar_url ??
                            user.oauthAvatarUrl ??
                            undefined
                          }
                          firstName={
                            profile?.first_name ??
                            user.oauthFirstName ??
                            undefined
                          }
                          lastName={
                            profile?.last_name ??
                            user.oauthLastName ??
                            undefined
                          }
                          email={profile?.email ?? user.email ?? undefined}
                          size={36}
                          variant="circle"
                          fallbackTone="onDark"
                          alt=""
                        />
                        <span>My Account</span>
                      </Link>
                    </Button>
                    <Button
                      size="2"
                      variant="outline"
                      onClick={handleSignOut}
                      style={{ width: "100%" }}
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className={styles.mobileFlyoutActions}>
                    <Button
                      size="2"
                      variant="solid"
                      asChild
                      className={`join-network-button fmc-black-pill-cta ${styles.mobileJoinCta}`}
                    >
                      <Link
                        href="/join"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Join Network
                      </Link>
                    </Button>
                    <Button
                      size="2"
                      variant="outline"
                      asChild
                      style={{ width: "100%" }}
                    >
                      <Link
                        href="/signin"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
