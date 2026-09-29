/** Display slogans / meta lines for stadium plate (extend via pipeline later). */
export const TEAM_SLOGANS: Record<string, string> = {
  ARI: "Bird Gang",
  ATL: "Rise Up",
  BAL: "Ravens Flock",
  BUF: "Bills Mafia",
  CAR: "Keep Pounding",
  CHI: "Bear Down",
  CIN: "Who Dey",
  CLE: "Dawg Pound",
  DAL: "America's Team",
  DEN: "Broncos Country",
  DET: "One Pride",
  GB: "Title Town",
  HOU: "We Are Texans",
  IND: "Colts Nation",
  JAX: "Duval",
  KC: "Chiefs Kingdom",
  LAC: "Bolt Up",
  LAR: "Rams House",
  LV: "Raider Nation",
  MIA: "Fins Up",
  MIN: "Skol",
  NE: "Do Your Job",
  NO: "Who Dat",
  NYG: "Big Blue",
  NYJ: "Jets Life",
  PHI: "Fly Eagles Fly",
  PIT: "Here We Go",
  SEA: "Go Hawks",
  SF: "Faithful",
  TB: "Fire The Cannons",
  TEN: "Titan Up",
  WSH: "HTTR",
};

export function sloganFor(abbr: string): string {
  return TEAM_SLOGANS[abbr.toUpperCase()] ?? abbr.toUpperCase();
}
