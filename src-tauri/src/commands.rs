use crate::models::{MatchupProbability, PipelineStatus, TeamSeasonStats};
use crate::pipeline;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_team_stats(app: AppHandle, team_abbr: String) -> Result<TeamSeasonStats, String> {
    pipeline::get_team_stats(&app, &team_abbr).await
}

/// Back-compat alias used by older frontend builds.
#[tauri::command]
pub async fn fetch_team_season_stats(
    app: AppHandle,
    team_abbr: String,
) -> Result<TeamSeasonStats, String> {
    pipeline::get_team_stats(&app, &team_abbr).await
}

#[tauri::command]
pub async fn refresh_pipeline(app: AppHandle, force: bool) -> Result<PipelineStatus, String> {
    pipeline::refresh_all(&app, force).await
}

#[tauri::command]
pub fn pipeline_status(app: AppHandle) -> Result<PipelineStatus, String> {
    pipeline::status(&app)
}

fn round1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

#[tauri::command]
pub fn calculate_matchup_probability(
    team_a_abbr: String,
    team_b_abbr: String,
    stats_a: TeamSeasonStats,
    stats_b: TeamSeasonStats,
) -> MatchupProbability {
    let off_edge_a = stats_a.points_per_game - stats_b.points_allowed_per_game;
    let off_edge_b = stats_b.points_per_game - stats_a.points_allowed_per_game;
    let rush_edge_a = stats_a.rushing_yards_per_game - (stats_b.yards_allowed_per_game * 0.35);
    let pass_edge_a = stats_a.passing_yards_per_game - (stats_b.yards_allowed_per_game * 0.55);
    let eff_a = (stats_a.third_down_pct + stats_a.red_zone_pct) / 2.0;
    let eff_b = (stats_b.third_down_pct + stats_b.red_zone_pct) / 2.0;
    let to_edge = (stats_a.turnover_diff - stats_b.turnover_diff) as f64;

    let composite = off_edge_a * 1.8
        - off_edge_b * 1.8
        + rush_edge_a * 0.04
        + pass_edge_a * 0.03
        + (eff_a - eff_b) * 0.25
        + to_edge * 0.6;

    let a_win = (50.0 + composite * 1.6).clamp(18.0, 82.0);
    let margin = composite * 0.55;

    let mut factors = vec![
        format!("{} PPG vs {} PA/G differential", team_a_abbr, team_b_abbr),
        "3rd-down & red-zone efficiency".into(),
        "Turnover margin".into(),
        "Normalized local pipeline".into(),
    ];
    if stats_a.live || stats_b.live {
        factors.push("Cached ESPN-normalized season stats".into());
    }
    if rush_edge_a.abs() > 15.0 {
        factors.push("Notable rushing mismatch".into());
    }
    if to_edge.abs() > 4.0 {
        factors.push("Turnover differential is a swing factor".into());
    }

    MatchupProbability {
        team_a_win_pct: round1(a_win),
        team_b_win_pct: round1(100.0 - a_win),
        expected_margin: round1(margin),
        confidence: 0.58 + (composite.abs() / 80.0).min(0.25),
        key_factors: factors,
    }
}
