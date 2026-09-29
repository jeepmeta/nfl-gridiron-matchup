import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TeamSelector } from "./components/TeamSelector";
import { MatchupDashboard } from "./components/MatchupDashboard";
import { mockSeasonStats } from "./services/espn";
import type { NFLTeam, MatchupProbability, TeamSeasonStats } from "./types/nfl";
import "./App.css";

async function loadTeamStats(team: NFLTeam): Promise<TeamSeasonStats> {
  try {
    const live = await invoke<TeamSeasonStats>("fetch_team_season_stats", {
      teamAbbr: team.abbr,
    });
    return live;
  } catch (err) {
    console.warn(`ESPN live stats failed for ${team.abbr}, using mock:`, err);
    return { ...mockSeasonStats(parseInt(team.id, 10) || 1), live: false };
  }
}

function App() {
  const [teamA, setTeamA] = useState<NFLTeam | null>(null);
  const [teamB, setTeamB] = useState<NFLTeam | null>(null);
  const [locked, setLocked] = useState(false);
  const [statsA, setStatsA] = useState<TeamSeasonStats | null>(null);
  const [statsB, setStatsB] = useState<TeamSeasonStats | null>(null);
  const [probability, setProbability] = useState<MatchupProbability | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleLock = useCallback(async () => {
    if (!teamA || !teamB) return;
    setLoading(true);
    setStatusMsg("Fetching live ESPN stats…");
    try {
      const [sA, sB] = await Promise.all([
        loadTeamStats(teamA),
        loadTeamStats(teamB),
      ]);

      setStatusMsg("Computing matchup model…");

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
            sA.live || sB.live ? "ESPN live season stats" : "Fallback mock stats",
          ],
        };
      }

      setStatsA(sA);
      setStatsB(sB);
      setProbability(prob);
      setLocked(true);
      setStatusMsg(null);
    } catch (e) {
      console.error(e);
      setStatusMsg("Failed to load matchup. Check the terminal for errors.");
    } finally {
      setLoading(false);
    }
  }, [teamA, teamB]);

  const handleReset = () => {
    setLocked(false);
    setStatsA(null);
    setStatsB(null);
    setProbability(null);
    setStatusMsg(null);
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
            self-optimizing models and live ESPN stats.
          </p>
          <TeamSelector
            selectedA={teamA}
            selectedB={teamB}
            onSelectA={setTeamA}
            onSelectB={setTeamB}
            onLock={handleLock}
          />
          {(loading || statusMsg) && (
            <div className="loading-pulse">{statusMsg ?? "Computing matchup…"}</div>
          )}
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
        Probabilities are statistical model outputs only · Never betting advice · v0.2
        {statsA?.live || statsB?.live ? " · Live ESPN data" : ""}
      </footer>
    </div>
  );
}

export default App;
