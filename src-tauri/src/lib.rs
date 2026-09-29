mod cache;
mod commands;
mod espn;
mod models;
mod pipeline;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_team_stats,
            commands::fetch_team_season_stats,
            commands::refresh_pipeline,
            commands::pipeline_status,
            commands::calculate_matchup_probability,
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("Gridiron Matchup · NFL Comparison Engine");
            }
            let _ = pipeline::cache_root(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
