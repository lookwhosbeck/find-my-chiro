'use client';

export type MatchRadarChartPoint = {
  label: string;
  /** How well the practice matches you on this axis (0–100). */
  providerScore: number;
  /**
   * Your search on this axis as chart distance from center (typically 100).
   * When set on points, draws a second polygon so you can compare shapes.
   */
  userScore?: number;
};

function polar(cx: number, cy: number, angle: number, r: number): { x: number; y: number } {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function polygonFromScores(
  scores: number[],
  cx: number,
  cy: number,
  maxR: number,
  n: number,
  startAngle: number,
  angleStep: number
): string {
  return scores
    .map((score, i) => {
      const a = startAngle + i * angleStep;
      const r = (Math.max(0, Math.min(100, score)) / 100) * maxR;
      const { x, y } = polar(cx, cy, a, r);
      return `${x},${y}`;
    })
    .join(' ');
}

/**
 * Radar chart for active match dimensions. With `userScore` on points, draws your search (outer)
 * and this provider (inner) so gaps show where fit is weaker.
 */
export function MatchRadarChart({ points, size = 280 }: { points: MatchRadarChartPoint[]; size?: number }) {
  if (points.length === 0) return null;

  const overlay =
    points.length > 0 && points.every((p) => typeof p.userScore === 'number' && !Number.isNaN(p.userScore));

  if (points.length < 3) {
    return (
      <ul className="match-radar-fallback" aria-label="Match by category">
        {points.map((p) => (
          <li key={p.label} className="match-radar-fallback-row">
            <span className="match-radar-fallback-label">{p.label}</span>
            {overlay ? (
              <div className="match-radar-overlay-bars" role="presentation">
                <div className="match-radar-overlay-bar-track">
                  <div
                    className="match-radar-overlay-bar-provider"
                    style={{ width: `${Math.max(0, Math.min(100, p.providerScore))}%` }}
                  />
                </div>
                <div className="match-radar-overlay-bar-meta">
                  <span className="match-radar-overlay-bar-pct">{Math.round(p.providerScore)}% practice fit</span>
                </div>
              </div>
            ) : (
              <>
                <div className="match-radar-fallback-track" role="presentation">
                  <div
                    className="match-radar-fallback-fill"
                    style={{ width: `${Math.max(0, Math.min(100, p.providerScore))}%` }}
                  />
                </div>
                <span className="match-radar-fallback-pct">{Math.round(p.providerScore)}%</span>
              </>
            )}
          </li>
        ))}
      </ul>
    );
  }

  const n = points.length;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const ringLevels = [0.25, 0.5, 0.75, 1] as const;
  const rings = ringLevels.map((g, gi) => {
    const pts = Array.from({ length: n }, (_, i) => {
      const a = startAngle + i * angleStep;
      const { x, y } = polar(cx, cy, a, g * maxR);
      return `${x},${y}`;
    }).join(' ');
    return (
      <polygon
        key={gi}
        points={pts}
        fill="none"
        stroke="rgba(0,0,0,0.07)"
        strokeWidth={1}
      />
    );
  });

  const axisLines = Array.from({ length: n }, (_, i) => {
    const a = startAngle + i * angleStep;
    const { x, y } = polar(cx, cy, a, maxR);
    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,0,0,0.09)" strokeWidth={1} />;
  });

  const providerScores = points.map((p) => p.providerScore);
  const providerPolygon = polygonFromScores(providerScores, cx, cy, maxR, n, startAngle, angleStep);

  const userScores = overlay ? points.map((p) => p.userScore!) : null;
  const userPolygon =
    overlay && userScores
      ? polygonFromScores(userScores, cx, cy, maxR, n, startAngle, angleStep)
      : null;

  const labelR = maxR * 1.2;
  const labels = points.map((p, i) => {
    const a = startAngle + i * angleStep;
    const { x, y } = polar(cx, cy, a, labelR);
    return (
      <text
        key={p.label}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="match-radar-label"
      >
        {p.label}
      </text>
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="match-radar-svg"
      role="img"
      aria-label={
        overlay
          ? 'Radar chart comparing your search to this provider on each category'
          : 'Match score radar chart by search criteria'
      }
    >
      {rings}
      {axisLines}
      {userPolygon ? (
        <polygon
          points={userPolygon}
          fill="rgba(134, 134, 139, 0.14)"
          stroke="rgba(60, 60, 67, 0.45)"
          strokeWidth={2}
          strokeDasharray="5 4"
          className="match-radar-user-polygon"
        />
      ) : null}
      <polygon
        points={providerPolygon}
        fill="rgba(1, 144, 255, 0.22)"
        stroke="var(--color-tab-active-underline, #0190ff)"
        strokeWidth={2}
        className="match-radar-provider-polygon"
      />
      {labels}
    </svg>
  );
}
