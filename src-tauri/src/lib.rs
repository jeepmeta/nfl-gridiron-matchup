use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeamSeasonStats {
    pub wins: i32,
    pub losses: i32,
    pub ties: i32,
    pub points_for: f64,
    pub points_against: f64,
    pub points_per_game: f64,
    pub points_allowed_per_game: f64,
    pub passing_yards_per_game: f64,
    pub rushing_yards_per_game: f64,
    pub yards_allowed_per_game: f64,
    pub third_down_pct: f64,
    pub fourth_down_pct: f64,
    pub red_zone_pct: f64,
    pub turnover_diff: i32,
    pub rank_offense: Option<i32>,
    pub rank_defense: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchupProbability {
    pub team_a_win_pct: f64,
    pub team_b_win_pct: f64,
    pub expected_margin: f64,
    pub confidence: f64,
    pub key_factors: Vec<String>,
}

/// Placeholder self-optimizing probability engine.
/// Weights will be tuned over time from post-game outcomes.
#[tauri::command]
fn calculate_matchup_probability(
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
    ];
    if rush_edge_a.abs() > 15.0 {
        factors.push("Notable rushing mismatch".into());
    }
    if to_edge.abs() > 4.0 {
        factors.push("Turnover differential is a swing factor".into());
    }

    MatchupProbability {
        team_a_win_pct: (a_win * 10.0).round() / 10.0,
        team_b_win_pct: ((100.0 - a_win) * 10.0).round() / 10.0,
        expected_margin: (margin * 10.0).round() / 10.0,
        confidence: 0.58 + (composite.abs() / 80.0).min(0.25),
        key_factors: factors,
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Gridiron Matchup.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            calculate_matchup_probability
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("Gridiron Matchup · NFL Comparison Engine");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
