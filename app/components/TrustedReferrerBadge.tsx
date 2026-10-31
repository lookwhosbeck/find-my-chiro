export function TrustedReferrerBadge({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className={onDark ? "trusted-referrer-badge trusted-referrer-badge--on-dark" : "trusted-referrer-badge"}>
      Trusted Referrer
    </span>
  );
}
