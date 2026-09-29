import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TeamSelector } from "./components/TeamSelector";
import { MatchupDashboard } from "./components/MatchupDashboard";
import type { NFLTeam, MatchupProbability, TeamSeasonStats } from "./types/nfl";
import "./App.css";
import "./holo.css";

interface PipelineStatus {
  teamsCached: number;
  lastFullRefresh: string | null;
  cacheDir: string;
  stale: boolean;
  minRequestIntervalMs: number;
  fullRefreshTtlSecs: number;
}

async function loadTeamStats(team: NFLTeam): Promise<TeamSeasonStats> {
  const live = await invoke<TeamSeasonStats>("get_team_stats", {
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
  const [pipe, setPipe] = useState<PipelineStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await invoke<PipelineStatus>("pipeline_status");
      setPipe(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleRefreshPipeline = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg("Syncing full league pipeline (rate-limited)…");
    try {
      const s = await invoke<PipelineStatus>("refresh_pipeline", { force: true });
      setPipe(s);
      setStatusMsg(`Pipeline ready · ${s.teamsCached} teams cached`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatusMsg(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = useCallback(async () => {
    if (!teamA || !teamB) return;
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg("Loading normalized team stats (cache-first)…");
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
            "Normalized local pipeline",
          ],
        };
      }

      setStatsA(sA);
      setStatsB(sB);
      setProbability(prob);
      setLocked(true);
      setStatusMsg(null);
      refreshStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(`Stats load failed: ${msg}`);
      setStatusMsg(null);
    } finally {
      setLoading(false);
    }
  }, [teamA, teamB, refreshStatus]);

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
        <div className="logo-sub">MATCHUP · NORMALIZED PIPELINE</div>
      </header>

      {!locked && (
        <main className="home-main">
          <div className="field-stage" aria-hidden="true" />
          <p className="tagline">
            Side-by-side NFL matchups from a local normalized stats pipeline.
            ESPN is rate-limited; the app reads from cache first.
          </p>

          {pipe && (
            <div
              style={{
                maxWidth: 640,
                margin: "0 auto 1rem",
                fontSize: "0.8rem",
                opacity: 0.85,
                textAlign: "center",
              }}
            >
              Pipeline: {pipe.teamsCached}/32 teams ·{" "}
              {pipe.stale ? "stale — refresh recommended" : "fresh"} · min gap{" "}
              {pipe.minRequestIntervalMs}ms
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleRefreshPipeline}
                  disabled={loading}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #c9a227",
                    background: "transparent",
                    color: "#e8d48b",
                    cursor: "pointer",
                  }}
                >
                  Sync full league (rate-limited)
                </button>
              </div>
            </div>
          )}

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
        Model outputs only · Never betting advice · v0.3 pipeline
        {statsA?.live || statsB?.live ? " · Normalized cache" : ""}
      </footer>
    </div>
  );
}

export default App;
