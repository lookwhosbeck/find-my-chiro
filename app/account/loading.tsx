/**
 * Route-level Suspense fallback for any `/account/*` segment transition.
 * Matches the dashboard client's internal "Loading…" splash so the handoff
 * from server-rendered shell to client-hydrated dashboard is seamless.
 */
export default function AccountLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );
}
