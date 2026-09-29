use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Canonical record stored in our local pipeline (not ESPN's raw shape).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NormalizedTeamSeason {
    pub team_abbr: String,
    pub espn_id: String,
    pub season: i32,
    pub updated_at: DateTime<Utc>,
    pub source: String,
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
}

/// UI-facing shape (matches frontend TeamSeasonStats).
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

impl From<&NormalizedTeamSeason> for TeamSeasonStats {
    fn from(n: &NormalizedTeamSeason) -> Self {
        Self {
            wins: n.wins,
            losses: n.losses,
            ties: n.ties,
            points_for: n.points_for,
            points_against: n.points_against,
            points_per_game: n.points_per_game,
            points_allowed_per_game: n.points_allowed_per_game,
            passing_yards_per_game: n.passing_yards_per_game,
            rushing_yards_per_game: n.rushing_yards_per_game,
            yards_allowed_per_game: n.yards_allowed_per_game,
            third_down_pct: n.third_down_pct,
            fourth_down_pct: n.fourth_down_pct,
            red_zone_pct: n.red_zone_pct,
            turnover_diff: n.turnover_diff,
            rank_offense: None,
            rank_defense: None,
            live: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchupProbability {
    pub team_a_win_pct: f64,
    pub team_b_win_pct: f64,
    pub expected_margin: f64,
    pub confidence: f64,
    pub key_factors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PipelineStatus {
    pub teams_cached: usize,
    pub last_full_refresh: Option<DateTime<Utc>>,
    pub cache_dir: String,
    pub stale: bool,
    pub min_request_interval_ms: u64,
    pub full_refresh_ttl_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PipelineMeta {
    pub last_full_refresh: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
}
