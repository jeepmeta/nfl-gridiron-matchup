use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
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
    #[serde(default)]
    pub live: bool,
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

fn round1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

fn stat_map_from_categories(categories: &[Value]) -> std::collections::HashMap<String, f64> {
    let mut map = std::collections::HashMap::new();
    for cat in categories {
        if let Some(stats) = cat.get("stats").and_then(|s| s.as_array()) {
            for s in stats {
                let name = s.get("name").and_then(|n| n.as_str()).unwrap_or("");
                if name.is_empty() {
                    continue;
                }
                if let Some(v) = s.get("value").and_then(|v| v.as_f64()) {
                    map.insert(name.to_string(), v);
                }
                if let Some(v) = s.get("perGameValue").and_then(|v| v.as_f64()) {
                    map.insert(format!("{name}__pg"), v);
                }
            }
        }
    }
    map
}

fn get_f(map: &std::collections::HashMap<String, f64>, keys: &[&str]) -> Option<f64> {
    for k in keys {
        if let Some(v) = map.get(*k) {
            return Some(*v);
        }
    }
    None
}

async fn get_json(client: &reqwest::Client, url: &str) -> Result<Value, String> {
    let resp = client
        .get(url)
        .header("User-Agent", "Mozilla/5.0 (compatible; GridironMatchup/0.2)")
        .header("Accept", "application/json")
        .header("Accept-Encoding", "gzip, deflate")
        .send()
        .await
        .map_err(|e| format!("request failed ({url}): {e}"))?;

    let status = resp.status();
    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("read body failed ({url}): {e}"))?;

    if !status.is_success() {
        let preview = String::from_utf8_lossy(&bytes).chars().take(200).collect::<String>();
        return Err(format!("HTTP {status} from {url}: {preview}"));
    }

    serde_json::from_slice(&bytes).map_err(|e| {
        let preview = String::from_utf8_lossy(&bytes).chars().take(120).collect::<String>();
        format!("json decode failed ({url}): {e}; body starts: {preview}")
    })
}

async fn espn_team_id_for_abbr(client: &reqwest::Client, abbr: &str) -> Result<String, String> {
    let abbr = abbr.to_uppercase();
    let data = get_json(
        client,
        "https://site.api.espn.com/apis/v2/sports/football/nfl/standings",
    )
    .await?;

    let empty: Vec<Value> = vec![];
    for conf in data.get("children").and_then(|c| c.as_array()).unwrap_or(&empty) {
        let entries = conf
            .pointer("/standings/entries")
            .and_then(|e| e.as_array())
            .cloned()
            .unwrap_or_default();
        for entry in entries {
            let team_abbr = entry
                .pointer("/team/abbreviation")
                .and_then(|a| a.as_str())
                .unwrap_or("");
            if team_abbr.eq_ignore_ascii_case(&abbr) {
                if let Some(id) = entry.pointer("/team/id").and_then(|i| i.as_str()) {
                    return Ok(id.to_string());
                }
            }
        }
    }
    Err(format!("ESPN team id not found for {abbr}"))
}

fn standings_record_for_abbr(data: &Value, abbr: &str) -> (i32, i32, i32, f64, f64) {
    let abbr_u = abbr.to_uppercase();
    let empty: Vec<Value> = vec![];
    for conf in data.get("children").and_then(|c| c.as_array()).unwrap_or(&empty) {
        let entries = conf
            .pointer("/standings/entries")
            .and_then(|e| e.as_array())
            .cloned()
            .unwrap_or_default();
        for entry in entries {
            let team_abbr = entry
                .pointer("/team/abbreviation")
                .and_then(|a| a.as_str())
                .unwrap_or("");
            if !team_abbr.eq_ignore_ascii_case(&abbr_u) {
                continue;
            }
            let mut wins = 0i32;
            let mut losses = 0i32;
            let mut ties = 0i32;
            let mut pf = 0.0;
            let mut pa = 0.0;
            if let Some(stats) = entry.get("stats").and_then(|s| s.as_array()) {
                for s in stats {
                    let name = s.get("name").and_then(|n| n.as_str()).unwrap_or("");
                    let val = s.get("value").and_then(|v| v.as_f64()).unwrap_or(0.0);
                    match name {
                        "wins" => wins = val as i32,
                        "losses" => losses = val as i32,
                        "ties" => ties = val as i32,
                        "pointsFor" => pf = val,
                        "pointsAgainst" => pa = val,
                        _ => {}
                    }
                }
            }
            return (wins, losses, ties, pf, pa);
        }
    }
    (0, 0, 0, 0.0, 0.0)
}

#[tauri::command]
async fn fetch_team_season_stats(team_abbr: String) -> Result<TeamSeasonStats, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())?;

    let abbr = team_abbr.to_uppercase();
    let team_id = espn_team_id_for_abbr(&client, &abbr).await?;

    let standings = get_json(
        client,
        "https://site.api.espn.com/apis/v2/sports/football/nfl/standings",
    )
    .await?;

    let (wins, losses, ties, points_for, points_against) =
        standings_record_for_abbr(&standings, &abbr);
    let games = (wins + losses + ties).max(1) as f64;
    let ppg = points_for / games;
    let papg = points_against / games;

    let site_url = format!(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{team_id}/statistics"
    );
    let site = get_json(client, &site_url).await?;

    let empty: Vec<Value> = vec![];
    let site_cats = site
        .pointer("/results/stats/categories")
        .and_then(|c| c.as_array())
        .unwrap_or(&empty);
    let site_map = stat_map_from_categories(site_cats);

    let pass_final = get_f(&site_map, &["netPassingYardsPerGame", "netPassingYardsPerGame__pg"])
        .or_else(|| get_f(&site_map, &["netPassingYards"]).map(|v| v / games))
        .unwrap_or(0.0);

    let rush_final = get_f(&site_map, &["rushingYardsPerGame", "rushingYardsPerGame__pg"])
        .or_else(|| get_f(&site_map, &["rushingYards"]).map(|v| v / games))
        .unwrap_or(0.0);

    let third = get_f(&site_map, &["thirdDownConvPct"]).unwrap_or(0.0);
    let fourth = get_f(&site_map, &["fourthDownConvPct"]).unwrap_or(0.0);
    let redzone = get_f(
        &site_map,
        &["redzoneScoringPct", "redzoneEfficiencyPct", "redzoneTouchdownPct"],
    )
    .unwrap_or(0.0);
    let to_diff = get_f(&site_map, &["turnOverDifferential"]).unwrap_or(0.0) as i32;
    let ppg_final = get_f(&site_map, &["totalPointsPerGame"]).unwrap_or(ppg);

    let mut yards_allowed_pg = 0.0;
    let year = 2026;
    let core_url = format!(
        "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{year}/types/2/teams/{team_id}/statistics"
    );
    if let Ok(core) = get_json(client, &core_url).await {
        if let Some(cats) = core.pointer("/splits/categories").and_then(|c| c.as_array()) {
            let core_map = stat_map_from_categories(cats);
            if let Some(ya) = get_f(&core_map, &["yardsAllowed"]) {
                if ya > 0.0 {
                    yards_allowed_pg = ya / games;
                }
            }
        }
    }
    if yards_allowed_pg <= 0.0 {
        yards_allowed_pg = papg * 14.5;
    }

    let stats = TeamSeasonStats {
        wins,
        losses,
        ties,
        points_for,
        points_against,
        points_per_game: round1(ppg_final),
        points_allowed_per_game: round1(papg),
        passing_yards_per_game: round1(pass_final),
        rushing_yards_per_game: round1(rush_final),
        yards_allowed_per_game: round1(yards_allowed_pg),
        third_down_pct: round1(third),
        fourth_down_pct: round1(fourth),
        red_zone_pct: round1(redzone),
        turnover_diff: to_diff,
        rank_offense: None,
        rank_defense: None,
        live: true,
    };
    eprintln!(
        "[gridiron] live {} => {}-{} PPG={:.1} PA/G={:.1}",
        abbr, wins, losses, stats.points_per_game, stats.points_allowed_per_game
    );
    Ok(stats)
}

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
    if stats_a.live || stats_b.live {
        factors.push("ESPN live season stats".into());
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

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! Welcome to Gridiron Matchup.")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            calculate_matchup_probability,
            fetch_team_season_stats
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
