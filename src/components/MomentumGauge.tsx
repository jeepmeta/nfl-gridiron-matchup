import type { MomentumInput } from "../types/nfl";

interface Props {
  input: MomentumInput;
  teamColor: string;
  label: string;
}

/** Simple radial momentum gauge 0–100 */
export function MomentumGauge({ input, teamColor, label }: Props) {
  const formScore =
    input.recentForm.reduce((acc, r) => acc + (r === "W" ? 1 : r === "T" ? 0.5 : 0), 0) /
    Math.max(input.recentForm.length, 1);

  const raw =
    formScore * 0.45 +
    (1 - input.injuryImpact) * 0.25 +
    input.rivalryScore * 0.15 +
    (input.homeAdvantage ? 0.15 : 0.05);

  const value = Math.round(Math.min(100, Math.max(0, raw * 100)));
  const angle = (value / 100) * 180 - 90;

  return (
    <div className="momentum-gauge">
      <div className="gauge-label">{label}</div>
      <svg viewBox="0 0 120 70" className="gauge-svg">
        <path
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M10 60 A50 60 0 0 1 110 60"
          fill="none"
          stroke={teamColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 157} 157`}
          style={{ filter: `drop-shadow(0 0 6px ${teamColor})` }}
        />
        <line
          x1="60"
          y1="60"
          x2={60 + 42 * Math.cos((angle * Math.PI) / 180)}
          y2={60 + 42 * Math.sin((angle * Math.PI) / 180)}
          stroke="#f5f5f5"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="60" cy="60" r="5" fill="#f5f5f5" />
      </svg>
      <div className="gauge-value" style={{ color: teamColor }}>
        {value}
      </div>
    </div>
  );
}
