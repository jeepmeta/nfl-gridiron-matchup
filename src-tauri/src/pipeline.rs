//! Orchestrates cache-first reads and rate-limited full/partial refreshes.

use crate::cache;
use crate::espn;
use crate::models::{NormalizedTeamSeason, PipelineMeta, PipelineStatus, TeamSeasonStats};
use chrono::{Duration as ChronoDuration, Utc};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub const TEAM_TTL_SECS: i64 = 60 * 60;
pub const FULL_REFRESH_TTL_SECS: i64 = 60 * 60;
pub const SEASON: i32 = 2026;

pub fn cache_root(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?
        .join("gridiron_pipeline");
    cache::ensure_dirs(&dir)?;
    Ok(dir)
}

pub fn status(app: &AppHandle) -> Result<PipelineStatus, String> {
    let root = cache_root(app)?;
    let meta = cache::read_meta(&root);
    let teams = cache::list_cached_abbrs(&root);
    let stale = match meta.last_full_refresh {
        Some(t) => Utc::now() - t > ChronoDuration::seconds(FULL_REFRESH_TTL_SECS),
        None => true,
    };
    Ok(PipelineStatus {
        teams_cached: teams.len(),
        last_full_refresh: meta.last_full_refresh,
        cache_dir: root.display().to_string(),
        stale,
        min_request_interval_ms: espn::MIN_INTERVAL.as_millis() as u64,
        full_refresh_ttl_secs: FULL_REFRESH_TTL_SECS as u64,
    })
}

fn is_fresh(team: &NormalizedTeamSeason) -> bool {
    Utc::now() - team.updated_at < ChronoDuration::seconds(TEAM_TTL_SECS)
}

pub async fn get_team_stats(app: &AppHandle, abbr: &str) -> Result<TeamSeasonStats, String> {
    let root = cache_root(app)?;
    let abbr = abbr.to_uppercase();

    if let Some(cached) = cache::read_team(&root, &abbr) {
        if is_fresh(&cached) {
            eprintln!("[pipeline] cache hit {}", abbr);
            return Ok(TeamSeasonStats::from(&cached));
        }
        eprintln!("[pipeline] cache stale {}", abbr);
    }

    let client = espn::http_client()?;
    let index = espn::fetch_standings_index(&client).await?;
    let (espn_id, wins, losses, ties, pf, pa) = index
        .get(&abbr)
        .cloned()
        .ok_or_else(|| format!("Team {abbr} not in ESPN standings"))?;

    let normalized = espn::fetch_normalized_team(
        &client, &abbr, &espn_id, wins, losses, ties, pf, pa, SEASON,
    )
    .await?;
    cache::write_team(&root, &normalized)?;
    eprintln!(
        "[pipeline] refreshed {} => {}-{}",
        abbr, normalized.wins, normalized.losses
    );
    Ok(TeamSeasonStats::from(&normalized))
}

pub async fn refresh_all(app: &AppHandle, force: bool) -> Result<PipelineStatus, String> {
    let root = cache_root(app)?;
    let mut meta = cache::read_meta(&root);

    if !force {
        if let Some(last) = meta.last_full_refresh {
            if Utc::now() - last < ChronoDuration::seconds(FULL_REFRESH_TTL_SECS) {
                eprintln!("[pipeline] full refresh skipped (TTL)");
                return status(app);
            }
        }
    }

    let client = espn::http_client()?;
    let index = espn::fetch_standings_index(&client).await?;
    let mut errors = vec![];

    for (abbr, (espn_id, wins, losses, ties, pf, pa)) in index {
        match espn::fetch_normalized_team(
            &client, &abbr, &espn_id, wins, losses, ties, pf, pa, SEASON,
        )
        .await
        {
            Ok(n) => {
                if let Err(e) = cache::write_team(&root, &n) {
                    errors.push(format!("{abbr} write: {e}"));
                } else {
                    eprintln!("[pipeline] synced {abbr} {}-{}", n.wins, n.losses);
                }
            }
            Err(e) => errors.push(format!("{abbr}: {e}")),
        }
    }

    meta.last_full_refresh = Some(Utc::now());
    meta.last_error = if errors.is_empty() {
        None
    } else {
        Some(errors.join("; "))
    };
    cache::write_meta(&root, &meta)?;

    status(app)
}
