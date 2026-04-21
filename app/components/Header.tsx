"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/app/lib/supabase";
import { PROFILE_UPDATED_EVENT } from "@/app/lib/profile-events";
import { MovynLogo } from "@/app/components/MovynLogo";
import { UserAvatar } from "@/app/components/UserAvatar";

const routeList = [
  { href: "/search", label: "Find Care" },
  { href: "/about", label: "About" },
] as const;

type HeaderProfile = {
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

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
): { first: string | null; last: string | null } {
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
  /** Sits inside a hero/map shell instead of the full-width sticky bar. */
  embedded?: boolean;
  /** Light chrome (e.g. search map) vs dark hero chrome. */
  surface?: "onDark" | "onLight";
};

const navLinkClass = (embedded: boolean, surface: "onDark" | "onLight") =>
  cn(
    "text-sm font-medium transition-colors",
    embedded
      ? surface === "onDark"
        ? "text-white/80 hover:text-white"
        : "text-muted-foreground hover:text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );

export function Header({ embedded = false, surface = "onDark" }: HeaderProps) {
  const [user, setUser] = useState<HeaderAuthUser | null>(null);
  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
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
        data: { session },
      } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(toHeaderAuthUser(u));
      if (u) await loadProfile(u.id);
      else setProfile(null);
    };
    void init();

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
    const onProfileEvent = () => {
      if (user) void loadProfile(user.id);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileEvent);
    return () =>
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileEvent);
  }, [loadProfile, user]);

  const handleSignOut = () => {
    if (signingOut) return;
    setSigningOut(true);
    setSheetOpen(false);
    const goHome = () => {
      window.location.assign("/");
    };
    const safetyNav = window.setTimeout(goHome, 1200);
    void (async () => {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* still navigate */
      } finally {
        window.clearTimeout(safetyNav);
        goHome();
      }
    })();
  };

  const primaryCtaClass = cn(
    "rounded-full px-5 font-medium shadow-sm",
    embedded && surface === "onDark"
      ? "border-0 bg-white text-[hsl(var(--marketing-hero-surface))] hover:bg-white/90"
      : "bg-[hsl(var(--marketing-hero-surface))] text-primary-foreground hover:bg-[hsl(var(--marketing-hero-surface))]/90",
  );

  const logoVariant =
    embedded && surface === "onDark" ? ("onDark" as const) : ("standard" as const);

  const frostedBarClass = cn(
    "bg-background/70 flex items-center justify-between rounded-2xl border p-3 backdrop-blur-sm",
    surface === "onLight" && !embedded && "border-border/70",
  );

  const authDesktop = signingOut ? (
    <span
      className="text-muted-foreground text-sm"
      role="status"
      aria-live="polite"
    >
      Signing out…
    </span>
  ) : user ? (
    <div className="flex items-center gap-2 lg:gap-3">
      <button
        type="button"
        className={cn(
          "text-sm font-medium transition-colors",
          "text-muted-foreground hover:text-foreground",
        )}
        onClick={handleSignOut}
      >
        Sign out
      </button>
      <Button size="sm" asChild className={primaryCtaClass}>
        <Link
          href="/account"
          className="inline-flex items-center gap-2"
          aria-label="My account"
        >
          <UserAvatar
            avatarUrl={profile?.avatar_url ?? user.oauthAvatarUrl ?? undefined}
            firstName={profile?.first_name ?? user.oauthFirstName ?? undefined}
            lastName={profile?.last_name ?? user.oauthLastName ?? undefined}
            email={profile?.email ?? user.email ?? undefined}
            size={28}
            variant="circle"
            fallbackTone="default"
            alt=""
          />
          <span className="hidden sm:inline">My Account</span>
        </Link>
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-1 lg:gap-2">
      <Button size="lg" variant="ghost" asChild>
        <Link href="/signin">Log in</Link>
      </Button>
      <Button size="sm" asChild className={primaryCtaClass}>
        <Link href="/join">Join Network</Link>
      </Button>
    </div>
  );

  const sheetAuthFooter = signingOut ? (
    <p className="text-muted-foreground text-sm">Signing out…</p>
  ) : user ? (
    <div className="flex w-full flex-col gap-2">
      <Button asChild className={cn(primaryCtaClass, "w-full justify-center")}>
        <Link href="/account" onClick={() => setSheetOpen(false)}>
          My Account
        </Link>
      </Button>
      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  ) : (
    <div className="flex w-full flex-col gap-2">
      <Button asChild className={cn(primaryCtaClass, "w-full justify-center")}>
        <Link href="/join" onClick={() => setSheetOpen(false)}>
          Join Network
        </Link>
      </Button>
      <Button variant="outline" asChild className="w-full">
        <Link href="/signin" onClick={() => setSheetOpen(false)}>
          Log in
        </Link>
      </Button>
    </div>
  );

  const mobileSheet = (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          disabled={signingOut}
          className={cn(
            "lg:hidden",
            embedded && surface === "onDark" && "text-white hover:bg-white/10",
          )}
        >
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-card border-secondary flex w-[min(100vw-2rem,320px)] flex-col justify-between rounded-tr-2xl rounded-br-2xl sm:max-w-sm"
      >
        <div>
          <SheetHeader className="mb-4 ml-4">
            <SheetTitle className="flex items-center">
              <Link href="/" className="leading-none" onClick={() => setSheetOpen(false)}>
                <MovynLogo variant="standard" className="h-8 w-auto" />
              </Link>
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2">
            {routeList.map(({ href, label }) => (
              <Button
                key={href}
                onClick={() => setSheetOpen(false)}
                asChild
                variant="ghost"
                className="justify-start text-base"
              >
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </div>
        </div>
        <SheetFooter className="flex-col items-stretch justify-start sm:flex-col">
          <Separator className="mb-2" />
          {sheetAuthFooter}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  if (embedded) {
    return (
      <header
        className={cn(
          "flex w-full max-w-6xl items-center justify-between gap-3 rounded-full border px-3 py-2 sm:gap-4 sm:px-5",
          surface === "onDark"
            ? "border-white/10 bg-black/30 text-white shadow-[0_8px_40px_rgba(0,0,0,0.2)] backdrop-blur-md"
            : "border-border/70 bg-background/95 text-foreground shadow-sm backdrop-blur-md",
        )}
      >
        <Link href="/" className="shrink-0 leading-none">
          <MovynLogo variant={logoVariant} className="h-8 w-auto sm:h-9" />
        </Link>
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-8 md:flex">
          <nav className="flex items-center gap-8" aria-label="Primary">
            {routeList.map(({ href, label }) => (
              <Link key={href} href={href} className={navLinkClass(embedded, surface)}>
                {label}
              </Link>
            ))}
          </nav>
          {/* strip duplicate mobile-only buttons from authDesktop for embedded */}
          {signingOut ? (
            <span className="text-muted-foreground text-sm" role="status">
              Signing out…
            </span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={cn(
                  "text-sm font-medium transition-colors",
                  embedded && surface === "onDark"
                    ? "text-white/80 hover:text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={handleSignOut}
              >
                Sign out
              </button>
              <Button size="sm" asChild className={primaryCtaClass}>
                <Link href="/account" className="inline-flex items-center gap-2" aria-label="My account">
                  <UserAvatar
                    avatarUrl={profile?.avatar_url ?? user.oauthAvatarUrl ?? undefined}
                    firstName={profile?.first_name ?? user.oauthFirstName ?? undefined}
                    lastName={profile?.last_name ?? user.oauthLastName ?? undefined}
                    email={profile?.email ?? user.email ?? undefined}
                    size={28}
                    variant="circle"
                    fallbackTone={embedded && surface === "onDark" ? "onDark" : "default"}
                    alt=""
                  />
                  <span className="hidden sm:inline">My Account</span>
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/signin" className={navLinkClass(embedded, surface)}>
                Log in
              </Link>
              <Button size="sm" asChild className={primaryCtaClass}>
                <Link href="/join">Join Network</Link>
              </Button>
            </div>
          )}
        </div>
        <div className="md:hidden">{mobileSheet}</div>
      </header>
    );
  }

  return (
    <header className="sticky top-2 z-40 lg:top-5">
      <div className="app-container">
        <div className={frostedBarClass}>
          <Link href="/" className="shrink-0 leading-none">
            <MovynLogo variant="standard" className="h-8 w-auto sm:h-9" />
          </Link>

          <div className="flex items-center lg:hidden">{mobileSheet}</div>

          <NavigationMenu viewport={false} className="mx-auto hidden lg:block">
            <NavigationMenuList className="space-x-0">
              {routeList.map(({ href, label }) => (
                <NavigationMenuItem key={href}>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "bg-transparent hover:bg-muted",
                    )}
                  >
                    <Link href={href}>{label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="hidden items-center lg:flex">{authDesktop}</div>
        </div>
      </div>
    </header>
  );
}
