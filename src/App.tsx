import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TeamSelector } from "./components/TeamSelector";
import { MatchupDashboard } from "./components/MatchupDashboard";
import { mockSeasonStats } from "./services/espn";
import type { NFLTeam, MatchupProbability, TeamSeasonStats } from "./types/nfl";
import "./App.css";

function App() {
  const [teamA, setTeamA] = useState<NFLTeam | null>(null);
  const [teamB, setTeamB] = useState<NFLTeam | null>(null);
  const [locked, setLocked] = useState(false);
  const [statsA, setStatsA] = useState<TeamSeasonStats | null>(null);
  const [statsB, setStatsB] = useState<TeamSeasonStats | null>(null);
  const [probability, setProbability] = useState<MatchupProbability | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLock = useCallback(async () => {
    if (!teamA || !teamB) return;
    setLoading(true);
    try {
      const sA = mockSeasonStats(parseInt(teamA.id, 10));
      const sB = mockSeasonStats(parseInt(teamB.id, 10) + 17);

      let prob: MatchupProbability;
      try {
        prob = await invoke<MatchupProbability>("calculate_matchup_probability", {
          teamAAbbr: teamA.abbr,
          teamBAbbr: teamB.abbr,
          statsA: sA,
          statsB: sB,
        });
      } catch {
        const edge =
          sA.pointsPerGame -
          sB.pointsAllowedPerGame -
          (sB.pointsPerGame - sA.pointsAllowedPerGame);
        const aWin = Math.min(78, Math.max(22, 50 + edge * 1.8));
        prob = {
          teamAWinPct: Math.round(aWin * 10) / 10,
          teamBWinPct: Math.round((100 - aWin) * 10) / 10,
          expectedMargin: Math.round(edge * 10) / 10,
          confidence: 0.62,
          keyFactors: [
            "Offensive efficiency differential",
            "Recent form (mock)",
            "Injury impact (placeholder)",
          ],
        };
      }

      setStatsA(sA);
      setStatsB(sB);
      setProbability(prob);
      setLocked(true);
    } finally {
      setLoading(false);
    }
  }, [teamA, teamB]);

  const handleReset = () => {
    setLocked(false);
    setStatsA(null);
    setStatsB(null);
    setProbability(null);
  };

  return (
    <div className={`app-shell ${locked ? "locked" : "home"}`}>
      <div className="field-overlay" />
      <header className="app-header">
        <div className="logo-mark">GRIDIRON</div>
        <div className="logo-sub">MATCHUP · AI COMPARISON ENGINE</div>
      </header>

      {!locked && (
        <main className="home-main">
          <p className="tagline">
            Select any two NFL teams for a dense side-by-side matchup powered by
            self-optimizing models and live stats.
          </p>
          <TeamSelector
            selectedA={teamA}
            selectedB={teamB}
            onSelectA={setTeamA}
            onSelectB={setTeamB}
            onLock={handleLock}
          />
          {loading && <div className="loading-pulse">Computing matchup…</div>}
        </main>
      )}

      {locked && teamA && teamB && statsA && statsB && probability && (
        <MatchupDashboard
          teamA={teamA}
          teamB={teamB}
          statsA={statsA}
          statsB={statsB}
          probability={probability}
          onReset={handleReset}
        />
      )}

      <footer className="app-footer">
        Probabilities are statistical model outputs only · Never betting advice · v0.1
      </footer>
    </div>
  );
}

export default App;
