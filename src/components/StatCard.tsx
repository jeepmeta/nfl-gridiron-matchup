interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, sub, accent = "#c9a227", highlight }: Props) {
  return (
    <div className={`stat-card ${highlight ? "highlight" : ""}`} style={{ borderColor: accent }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
