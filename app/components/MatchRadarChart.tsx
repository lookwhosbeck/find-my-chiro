'use client';

type RadarPoint = { label: string; score: number };

function polar(cx: number, cy: number, angle: number, r: number): { x: number; y: number } {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/**
 * Radar chart for active match dimensions (same semantics as search scoring).
 * For 1–2 axes, uses horizontal bars so the shape stays readable.
 */
export function MatchRadarChart({ points, size = 280 }: { points: RadarPoint[]; size?: number }) {
  if (points.length === 0) return null;

  if (points.length < 3) {
    return (
      <ul className="match-radar-fallback" aria-label="Match by category">
        {points.map((p) => (
          <li key={p.label} className="match-radar-fallback-row">
            <span className="match-radar-fallback-label">{p.label}</span>
            <div className="match-radar-fallback-track" role="presentation">
              <div
                className="match-radar-fallback-fill"
                style={{ width: `${Math.max(0, Math.min(100, p.score))}%` }}
              />
            </div>
            <span className="match-radar-fallback-pct">{Math.round(p.score)}%</span>
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

  const polygonPts = points
    .map((p, i) => {
      const a = startAngle + i * angleStep;
      const r = (Math.max(0, Math.min(100, p.score)) / 100) * maxR;
      const { x, y } = polar(cx, cy, a, r);
      return `${x},${y}`;
    })
    .join(' ');

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
      aria-label="Match score radar chart by search criteria"
    >
      {rings}
      {axisLines}
      <polygon
        points={polygonPts}
        fill="rgba(1, 144, 255, 0.18)"
        stroke="var(--color-tab-active-underline, #0190ff)"
        strokeWidth={2}
      />
      {labels}
    </svg>
  );
}
