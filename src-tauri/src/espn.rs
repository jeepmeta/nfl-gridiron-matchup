//! Rate-limited ESPN keyless client. All external HTTP goes through here.

use crate::models::NormalizedTeamSeason;
use chrono::Utc;
use once_cell::sync::Lazy;
use serde_json::Value;
use std::collections::HashMap;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

static RATE_LOCK: Lazy<Mutex<Option<Instant>>> = Lazy::new(|| Mutex::new(None));

pub const MIN_INTERVAL: Duration = Duration::from_millis(600);

fn round1(v: f64) -> f64 {
    (v * 10.0).round() / 10.0
}

async fn throttle() {
    let mut guard = RATE_LOCK.lock().await;
    if let Some(prev) = *guard {
        let elapsed = prev.elapsed();
        if elapsed < MIN_INTERVAL {
            tokio::time::sleep(MIN_INTERVAL - elapsed).await;
        }
    }
    *guard = Some(Instant::now());
}

async fn get_json(client: &reqwest::Client, url: &str) -> Result<Value, String> {
    throttle().await;

    let resp = client
        .get(url)
        .header(
            "User-Agent",
            "Mozilla/5.0 (compatible; GridironMatchup/0.3; +local-pipeline)",
        )
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
        let preview = String::from_utf8_lossy(&bytes)
            .chars()
            .take(200)
            .collect::<String>();
        return Err(format!("HTTP {status} from {url}: {preview}"));
    }

    serde_json::from_slice(&bytes).map_err(|e| {
        let preview = String::from_utf8_lossy(&bytes)
            .chars()
            .take(120)
            .collect::<String>();
        format!("json decode failed ({url}): {e}; body starts: {preview}")
    })
}

fn stat_map_from_categories(categories: &[Value]) -> HashMap<String, f64> {
    let mut map = HashMap::new();
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

fn get_f(map: &HashMap<String, f64>, keys: &[&str]) -> Option<f64> {
    keys.iter().find_map(|k| map.get(*k).copied())
}

pub async fn fetch_standings_index(
    client: &reqwest::Client,
) -> Result<HashMap<String, (String, i32, i32, i32, f64, f64)>, String> {
    let data = get_json(
        client,
        "https://site.api.espn.com/apis/v2/sports/football/nfl/standings",
    )
    .await?;

    let mut out = HashMap::new();
    let empty = vec![];
    for conf in data
        .get("children")
        .and_then(|c| c.as_array())
        .unwrap_or(&empty)
    {
        let entries = conf
            .pointer("/standings/entries")
            .and_then(|e| e.as_array())
            .cloned()
            .unwrap_or_default();
        for entry in entries {
            let abbr = entry
                .pointer("/team/abbreviation")
                .and_then(|a| a.as_str())
                .unwrap_or("")
                .to_uppercase();
            let id = entry
                .pointer("/team/id")
                .and_then(|i| i.as_str())
                .unwrap_or("")
                .to_string();
            if abbr.is_empty() || id.is_empty() {
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
            out.insert(abbr, (id, wins, losses, ties, pf, pa));
        }
    }
    Ok(out)
}

pub async fn fetch_normalized_team(
    client: &reqwest::Client,
    abbr: &str,
    espn_id: &str,
    wins: i32,
    losses: i32,
    ties: i32,
    points_for: f64,
    points_against: f64,
    season: i32,
) -> Result<NormalizedTeamSeason, String> {
    let games = (wins + losses + ties).max(1) as f64;
    let ppg = points_for / games;
    let papg = points_against / games;

    let site_url = format!(
        "https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{espn_id}/statistics"
    );
    let site = get_json(client, &site_url).await?;
    let empty = vec![];
    let site_cats = site
        .pointer("/results/stats/categories")
        .and_then(|c| c.as_array())
        .unwrap_or(&empty);
    let site_map = stat_map_from_categories(site_cats);

    let pass_final = get_f(
        &site_map,
        &["netPassingYardsPerGame", "netPassingYardsPerGame__pg"],
    )
    .or_else(|| get_f(&site_map, &["netPassingYards"]).map(|v| v / games))
    .unwrap_or(0.0);

    let rush_final = get_f(
        &site_map,
        &["rushingYardsPerGame", "rushingYardsPerGame__pg"],
    )
    .or_else(|| get_f(&site_map, &["rushingYards"]).map(|v| v / games))
    .unwrap_or(0.0);

    let third = get_f(&site_map, &["thirdDownConvPct"]).unwrap_or(0.0);
    let fourth = get_f(&site_map, &["fourthDownConvPct"]).unwrap_or(0.0);
    let redzone = get_f(
        &site_map,
        &[
            "redzoneScoringPct",
            "redzoneEfficiencyPct",
            "redzoneTouchdownPct",
        ],
    )
    .unwrap_or(0.0);
    let to_diff = get_f(&site_map, &["turnOverDifferential"]).unwrap_or(0.0) as i32;
    let ppg_final = get_f(&site_map, &["totalPointsPerGame"]).unwrap_or(ppg);

    let mut yards_allowed_pg = 0.0;
    let core_url = format!(
        "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/{season}/types/2/teams/{espn_id}/statistics"
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

    Ok(NormalizedTeamSeason {
        team_abbr: abbr.to_uppercase(),
        espn_id: espn_id.to_string(),
        season,
        updated_at: Utc::now(),
        source: "espn".into(),
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
    })
}

pub fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(25))
        .build()
        .map_err(|e| e.to_string())
}
