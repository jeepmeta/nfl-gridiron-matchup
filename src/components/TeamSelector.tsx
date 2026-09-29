import { useMemo, useState } from "react";
import { NFL_TEAMS, filterTeams } from "../data/nflTeams";
import type { NFLTeam } from "../types/nfl";

interface Props {
  selectedA: NFLTeam | null;
  selectedB: NFLTeam | null;
  onSelectA: (t: NFLTeam | null) => void;
  onSelectB: (t: NFLTeam | null) => void;
  onLock: () => void;
}

export function TeamSelector({ selectedA, selectedB, onSelectA, onSelectB, onLock }: Props) {
  const [conf, setConf] = useState("ALL");
  const [div, setDiv] = useState("ALL");

  const teams = useMemo(() => filterTeams(conf, div), [conf, div]);

  const canLock = selectedA && selectedB && selectedA.id !== selectedB.id;

  return (
    <div className="team-selector">
      <div className="filters">
        <label>
          Conference
          <select value={conf} onChange={(e) => setConf(e.target.value)}>
            <option value="ALL">All</option>
            <option value="AFC">AFC</option>
            <option value="NFC">NFC</option>
          </select>
        </label>
        <label>
          Division
          <select value={div} onChange={(e) => setDiv(e.target.value)}>
            <option value="ALL">All</option>
            <option value="East">East</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="West">West</option>
          </select>
        </label>
      </div>

      <div className="selector-columns">
        <div className="team-col">
          <h3>Away</h3>
          <div className="team-grid">
            {teams.map((t) => (
              <button
                key={t.id}
                className={`team-chip ${selectedA?.id === t.id ? "selected" : ""}`}
                style={
                  {
                    "--team-primary": t.primaryColor,
                    "--team-secondary": t.secondaryColor,
                  } as React.CSSProperties
                }
                onClick={() => onSelectA(selectedA?.id === t.id ? null : t)}
                disabled={selectedB?.id === t.id}
              >
                <img src={t.logoUrl} alt={t.abbr} width={36} height={36} />
                <span>{t.abbr}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="vs-badge">VS</div>

        <div className="team-col">
          <h3>Home</h3>
          <div className="team-grid">
            {teams.map((t) => (
              <button
                key={t.id}
                className={`team-chip ${selectedB?.id === t.id ? "selected" : ""}`}
                style={
                  {
                    "--team-primary": t.primaryColor,
                    "--team-secondary": t.secondaryColor,
                  } as React.CSSProperties
                }
                onClick={() => onSelectB(selectedB?.id === t.id ? null : t)}
                disabled={selectedA?.id === t.id}
              >
                <img src={t.logoUrl} alt={t.abbr} width={36} height={36} />
                <span>{t.abbr}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="lock-btn" disabled={!canLock} onClick={onLock}>
        {canLock ? "LOCK MATCHUP" : "Select two different teams"}
      </button>
    </div>
  );
}
