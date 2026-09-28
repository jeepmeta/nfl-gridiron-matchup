/**
 * Keyless ESPN Site API helpers.
 * Unofficial endpoints — rate-limit politely and expect possible shape changes.
 */

const SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";

export async function fetchTeams() {
  const res = await fetch(`${SITE}/teams?limit=32`);
  if (!res.ok) throw new Error(`ESPN teams failed: ${res.status}`);
  return res.json();
}

export async function fetchTeamDetail(idOrAbbr: string) {
  const res = await fetch(`${SITE}/teams/${idOrAbbr}`);
  if (!res.ok) throw new Error(`ESPN team detail failed: ${res.status}`);
  return res.json();
}

export async function fetchRoster(idOrAbbr: string) {
  const res = await fetch(`${SITE}/teams/${idOrAbbr}/roster`);
  if (!res.ok) throw new Error(`ESPN roster failed: ${res.status}`);
  return res.json();
}

export async function fetchInjuries(teamId: string) {
  const res = await fetch(`${CORE}/teams/${teamId}/injuries`);
  if (!res.ok) return { items: [] };
  return res.json();
}

export async function fetchScoreboard(dates?: string) {
  const q = dates ? `?dates=${dates}` : "";
  const res = await fetch(`${SITE}/scoreboard${q}`);
  if (!res.ok) throw new Error(`ESPN scoreboard failed: ${res.status}`);
  return res.json();
}

export async function fetchStandings() {
  const res = await fetch("https://site.api.espn.com/apis/v2/sports/football/nfl/standings");
  if (!res.ok) throw new Error(`ESPN standings failed: ${res.status}`);
  return res.json();
}

/** Placeholder mock stats until live ingestion is wired */
export function mockSeasonStats(seed: number) {
  const r = (min: number, max: number) =>
    Math.round((min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min)) * 10) / 10;
  return {
    wins: Math.floor(r(3, 12)),
    losses: Math.floor(r(3, 12)),
    ties: 0,
    pointsFor: Math.floor(r(280, 450)),
    pointsAgainst: Math.floor(r(250, 420)),
    pointsPerGame: r(18, 30),
    pointsAllowedPerGame: r(16, 28),
    passingYardsPerGame: r(180, 280),
    rushingYardsPerGame: r(90, 160),
    yardsAllowedPerGame: r(280, 380),
    thirdDownPct: r(35, 48),
    fourthDownPct: r(40, 60),
    redZonePct: r(45, 70),
    turnoverDiff: Math.floor(r(-8, 12)),
    rankOffense: Math.floor(r(1, 32)),
    rankDefense: Math.floor(r(1, 32)),
  };
}
