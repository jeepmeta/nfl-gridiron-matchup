import type { NFLTeam, TeamSeasonStats, MatchupProbability } from "../types/nfl";
import { StatCard } from "./StatCard";
import { MomentumGauge } from "./MomentumGauge";

interface Props {
  teamA: NFLTeam;
  teamB: NFLTeam;
  statsA: TeamSeasonStats;
  statsB: TeamSeasonStats;
  probability: MatchupProbability;
  onReset: () => void;
}

export function MatchupDashboard({ teamA, teamB, statsA, statsB, probability, onReset }: Props) {
  const recordA = `${statsA.wins}-${statsA.losses}${statsA.ties ? `-${statsA.ties}` : ""}`;
  const recordB = `${statsB.wins}-${statsB.losses}${statsB.ties ? `-${statsB.ties}` : ""}`;

  return (
    <div className="matchup-dashboard">
      <button className="reset-btn" onClick={onReset}>
        ← New Matchup
      </button>

      <header className="matchup-header">
        <div className="team-side left" style={{ "--accent": teamA.primaryColor } as React.CSSProperties}>
          <img src={teamA.helmetUrl} alt={teamA.fullName} className="helmet" />
          <div>
            <h2>{teamA.fullName}</h2>
            <div className="record">{recordA}</div>
            <div className="div-tag">
              {teamA.conference} {teamA.division}
            </div>
          </div>
        </div>

        <div className="prob-center">
          <div className="prob-title">Model Probability</div>
          <div className="prob-bars">
            <div
              className="prob-bar a"
              style={{
                width: `${probability.teamAWinPct}%`,
                background: teamA.primaryColor,
              }}
            >
              {probability.teamAWinPct}%
            </div>
            <div
              className="prob-bar b"
              style={{
                width: `${probability.teamBWinPct}%`,
                background: teamB.primaryColor,
              }}
            >
              {probability.teamBWinPct}%
            </div>
          </div>
          <div className="margin">
            Expected margin: {probability.expectedMargin > 0 ? "+" : ""}
            {probability.expectedMargin.toFixed(1)} · Confidence {(probability.confidence * 100).toFixed(0)}%
          </div>
        </div>

        <div className="team-side right" style={{ "--accent": teamB.primaryColor } as React.CSSProperties}>
          <div>
            <h2>{teamB.fullName}</h2>
            <div className="record">{recordB}</div>
            <div className="div-tag">
              {teamB.conference} {teamB.division}
            </div>
          </div>
          <img src={teamB.helmetUrl} alt={teamB.fullName} className="helmet" />
        </div>
      </header>

      <section className="momentum-row">
        <MomentumGauge
          label={`${teamA.abbr} Momentum`}
          teamColor={teamA.primaryColor}
          input={{
            recentForm: ["W", "W", "L", "W", "L"],
            injuryImpact: 0.2,
            rivalryScore: 0.6,
            homeAdvantage: true,
          }}
        />
        <MomentumGauge
          label={`${teamB.abbr} Momentum`}
          teamColor={teamB.primaryColor}
          input={{
            recentForm: ["L", "W", "W", "L", "W"],
            injuryImpact: 0.35,
            rivalryScore: 0.6,
            homeAdvantage: false,
          }}
        />
      </section>

      <section className="stat-grid">
        <div className="stat-col">
          <h3 style={{ color: teamA.primaryColor }}>{teamA.abbr} Snapshot</h3>
          <div className="cards">
            <StatCard label="PPG" value={statsA.pointsPerGame} accent={teamA.primaryColor} />
            <StatCard label="PA/G" value={statsA.pointsAllowedPerGame} accent={teamA.primaryColor} />
            <StatCard label="Pass Y/G" value={statsA.passingYardsPerGame} accent={teamA.primaryColor} />
            <StatCard label="Rush Y/G" value={statsA.rushingYardsPerGame} accent={teamA.primaryColor} />
            <StatCard label="3rd Down %" value={`${statsA.thirdDownPct}%`} accent={teamA.primaryColor} />
            <StatCard label="RZ %" value={`${statsA.redZonePct}%`} accent={teamA.primaryColor} />
            <StatCard label="TO Diff" value={statsA.turnoverDiff} accent={teamA.primaryColor} highlight />
            <StatCard label="Off Rank" value={`#${statsA.rankOffense}`} accent={teamA.primaryColor} />
          </div>
        </div>

        <div className="cross-match">
          <h3>Key Cross-Matchups</h3>
          <div className="cross-item">
            <span>{teamA.abbr} Rush Y/G</span>
            <strong>{statsA.rushingYardsPerGame}</strong>
            <span>vs</span>
            <strong>{statsB.yardsAllowedPerGame}</strong>
            <span>{teamB.abbr} Yds Allowed</span>
          </div>
          <div className="cross-item">
            <span>{teamB.abbr} Rush Y/G</span>
            <strong>{statsB.rushingYardsPerGame}</strong>
            <span>vs</span>
            <strong>{statsA.yardsAllowedPerGame}</strong>
            <span>{teamA.abbr} Yds Allowed</span>
          </div>
          <div className="cross-item">
            <span>{teamA.abbr} PPG</span>
            <strong>{statsA.pointsPerGame}</strong>
            <span>vs</span>
            <strong>{statsB.pointsAllowedPerGame}</strong>
            <span>{teamB.abbr} PA/G</span>
          </div>
          <p className="disclaimer">
            Model notes: {probability.keyFactors.join(" · ")}
          </p>
        </div>

        <div className="stat-col">
          <h3 style={{ color: teamB.primaryColor }}>{teamB.abbr} Snapshot</h3>
          <div className="cards">
            <StatCard label="PPG" value={statsB.pointsPerGame} accent={teamB.primaryColor} />
            <StatCard label="PA/G" value={statsB.pointsAllowedPerGame} accent={teamB.primaryColor} />
            <StatCard label="Pass Y/G" value={statsB.passingYardsPerGame} accent={teamB.primaryColor} />
            <StatCard label="Rush Y/G" value={statsB.rushingYardsPerGame} accent={teamB.primaryColor} />
            <StatCard label="3rd Down %" value={`${statsB.thirdDownPct}%`} accent={teamB.primaryColor} />
            <StatCard label="RZ %" value={`${statsB.redZonePct}%`} accent={teamB.primaryColor} />
            <StatCard label="TO Diff" value={statsB.turnoverDiff} accent={teamB.primaryColor} highlight />
            <StatCard label="Off Rank" value={`#${statsB.rankOffense}`} accent={teamB.primaryColor} />
          </div>
        </div>
      </section>

      <footer className="matchup-footer">
        <button className="modal-btn">QB Comparison</button>
        <button className="modal-btn">Key Player Matchups</button>
        <button className="modal-btn">Offense vs Defense</button>
        <button className="modal-btn">Depth Chart</button>
        <button className="modal-btn">Injury Report</button>
      </footer>
    </div>
  );
}
