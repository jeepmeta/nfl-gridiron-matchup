import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TeamSelector } from "./components/TeamSelector";
import { MatchupDashboard } from "./components/MatchupDashboard";
import type { NFLTeam, MatchupProbability, TeamSeasonStats } from "./types/nfl";
import "./App.css";

async function loadTeamStats(team: NFLTeam): Promise<TeamSeasonStats> {
  const live = await invoke<TeamSeasonStats>("fetch_team_season_stats", {
    teamAbbr: team.abbr,
  });
  if (!live || typeof live.wins !== "number") {
    throw new Error(`Invalid stats payload for ${team.abbr}`);
  }
  return { ...live, live: live.live !== false };
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLock = useCallback(async () => {
    if (!teamA || !teamB) return;
    setLoading(true);
    setErrorMsg(null);
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
      } catch (e) {
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
            "ESPN live season stats",
            `Model fallback (${String(e)})`,
          ],
        };
      }

      setStatsA(sA);
      setStatsB(sB);
      setProbability(prob);
      setLocked(true);
      setStatusMsg(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Live stats error:", e);
      setErrorMsg(
        `Live ESPN fetch failed: ${msg}. ` +
          "Ensure src-tauri/src/lib.rs includes fetch_team_season_stats and Cargo.toml has reqwest."
      );
      setStatusMsg(null);
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
    setErrorMsg(null);
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
            live ESPN stats and the matchup model.
          </p>
          <TeamSelector
            selectedA={teamA}
            selectedB={teamB}
            onSelectA={setTeamA}
            onSelectB={setTeamB}
            onLock={handleLock}
          />
          {(loading || statusMsg) && (
            <div className="loading-pulse">{statusMsg ?? "Working…"}</div>
          )}
          {errorMsg && (
            <div
              className="error-banner"
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                maxWidth: 640,
                marginLeft: "auto",
                marginRight: "auto",
                background: "rgba(180,40,40,0.25)",
                border: "1px solid #c44",
                borderRadius: 8,
                color: "#f8c0c0",
                fontSize: "0.85rem",
                lineHeight: 1.4,
              }}
            >
              {errorMsg}
            </div>
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
