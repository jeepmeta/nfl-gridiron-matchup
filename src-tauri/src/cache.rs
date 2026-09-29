//! Local disk cache for normalized team seasons.

use crate::models::{NormalizedTeamSeason, PipelineMeta};
use std::fs;
use std::path::{Path, PathBuf};

pub fn ensure_dirs(root: &Path) -> Result<(), String> {
    fs::create_dir_all(root.join("teams")).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn team_path(root: &Path, abbr: &str) -> PathBuf {
    root.join("teams").join(format!("{}.json", abbr.to_uppercase()))
}

pub fn meta_path(root: &Path) -> PathBuf {
    root.join("meta.json")
}

pub fn read_team(root: &Path, abbr: &str) -> Option<NormalizedTeamSeason> {
    let path = team_path(root, abbr);
    let data = fs::read_to_string(path).ok()?;
    serde_json::from_str(&data).ok()
}

pub fn write_team(root: &Path, team: &NormalizedTeamSeason) -> Result<(), String> {
    ensure_dirs(root)?;
    let path = team_path(root, &team.team_abbr);
    let json = serde_json::to_string_pretty(team).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

pub fn list_cached_abbrs(root: &Path) -> Vec<String> {
    let dir = root.join("teams");
    let Ok(entries) = fs::read_dir(dir) else {
        return vec![];
    };
    let mut out = vec![];
    for e in entries.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if let Some(abbr) = name.strip_suffix(".json") {
            out.push(abbr.to_uppercase());
        }
    }
    out.sort();
    out
}

pub fn read_meta(root: &Path) -> PipelineMeta {
    let path = meta_path(root);
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn write_meta(root: &Path, meta: &PipelineMeta) -> Result<(), String> {
    ensure_dirs(root)?;
    let path = meta_path(root);
    let json = serde_json::to_string_pretty(meta).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}
