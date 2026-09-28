# NFL Gridiron Matchup

**AI-powered NFL team comparison dashboard** built with **Rust + Tauri 2 + React**.

Side-by-side matchups powered by up-to-the-hour stats, comprehensive depth charts, self-optimizing probability models, key player matchups, QB comparisons, momentum gauges, and an immersive American-football-themed UI that transforms when you lock in a matchup.

> Never financial or gambling advice. Probabilities are model outputs based on statistical analysis only.

---

## Vision

A dream comparison app for any NFL fan:

- **Dense Polymarket-style dashboard** with team & player stats (W/L, PPG, yards, 3rd/4th down %, red zone, special teams, packages, injuries, combine data, YAC, YACONT, etc.)
- **Keyless data feeds** (ESPN unofficial endpoints + nfldata.org) + planned WebSocket live updates
- **Self-optimizing AI agent skills** that generate outcome probabilities, key matchups to watch, and QB comparisons
- **Transformer-style UI transitions** — color bursts, metallic reflections, moving panels, shadows when a matchup is selected
- **Momentum meter** (gauge driven by recent W/L, injuries, rivalry strength)
- **Pressable modals**: QB comparison · Offense vs Defense cross-match · Player matchups · Depth chart
- **Hourly + post-game refresh** of stats, injuries, trades; breaking-news instant alerts
- **Desktop-first + mobile-friendly** (Tauri 2)

## Current Status (v0.1 Foundation)

- ✅ Tauri 2 + React + TypeScript scaffold
- ✅ Football-themed custom window & dense dashboard shell
- ✅ All 32 NFL teams with conference/division filters + primary/secondary colors + helmet logos (ESPN CDN)
- ✅ Side-by-side matchup layout with basic stats cards
- ✅ Momentum gauge component
- ✅ Mock probability engine (Rust command) — will be replaced by real self-optimizing models
- ✅ ESPN keyless data service stubs (teams, roster, injuries, scoreboard)
- ✅ Responsive layout foundations
- ⏳ Full live stat ingestion, depth charts, advanced player metrics
- ⏳ Real self-optimizing probability models & key-matchup generator
- ⏳ Transformer animations & metallic UI polish
- ⏳ Polymarket spread display (read-only)
- ⏳ Hourly background refresh + alert system

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop shell | Tauri 2 (Rust) |
| UI | React 19 + TypeScript + Vite |
| Animation | Framer Motion (planned) |
| Charts / gauges | Custom + Recharts |
| Data | ESPN public endpoints (keyless) + nfldata.org |
| Probability core | Rust commands (expandable to full agent skills) |

## Quick Start

```bash
# Prerequisites: Node 20+, Rust, Tauri system deps
# https://tauri.app/start/prerequisites/

git clone https://github.com/jeepmeta/nfl-gridiron-matchup.git
cd nfl-gridiron-matchup
npm install
npm run tauri dev
```

## Project Structure

```
src/
  components/     # TeamSelector, MatchupDashboard, MomentumGauge, StatCard, modals
  data/           # Static team metadata (colors, divisions, logos)
  services/       # ESPN / nfldata fetchers
  types/          # Shared TypeScript types
  App.tsx         # Root flow: home → select → transform → matchup
src-tauri/
  src/lib.rs      # Tauri commands (probability engine, future AI skills)
```

## Data Sources (Keyless)

- **ESPN Site API** (unofficial, no key): teams, rosters, injuries, scoreboard, basic stats
  - `https://site.api.espn.com/apis/site/v2/sports/football/nfl/...`
- **nfldata.org**: rich historical + player game logs, play-by-play (free, no key)
- Future: WebSocket live scores, official injury feeds, combine data

**Important**: ESPN endpoints are unofficial and may change. Rate-limit politely.

## Probability Model (Current)

Simple weighted heuristic in Rust (placeholder):

- Recent form (last 5 games)
- Offensive efficiency vs opponent defensive ranks
- Injury impact on key positions
- Home/away & rivalry modifiers

Will evolve into self-optimizing scripts that re-weight features after every slate of games.

## Roadmap

1. **v0.2** – Live ESPN ingestion for standings, team stats, injuries; real depth charts
2. **v0.3** – Full player stat cards + key matchup generator
3. **v0.4** – Transformer UI animations + metallic theme polish
4. **v0.5** – Self-optimizing model v1 + hourly refresh + alerts
5. **v1.0** – Mobile-friendly layouts, offline cache, Polymarket read-only spreads

## Contributing

This is an ambitious fan project. PRs welcome for data adapters, UI components, model improvements, and animation polish.

## License

MIT

---

Built with 🏈 by [jeepmeta](https://github.com/jeepmeta) · 789 Studios
