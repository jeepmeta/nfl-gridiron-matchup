export type Conference = "AFC" | "NFC";
export type Division = "East" | "North" | "South" | "West";

export interface NFLTeam {
  id: string;
  abbr: string;
  name: string;
  fullName: string;
  conference: Conference;
  division: Division;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  logoUrl: string;
  helmetUrl: string;
}

export interface TeamSeasonStats {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsPerGame: number;
  pointsAllowedPerGame: number;
  passingYardsPerGame: number;
  rushingYardsPerGame: number;
  yardsAllowedPerGame: number;
  thirdDownPct: number;
  fourthDownPct: number;
  redZonePct: number;
  turnoverDiff: number;
  rankOffense?: number;
  rankDefense?: number;
}

export interface MomentumInput {
  recentForm: ("W" | "L" | "T")[];
  injuryImpact: number;
  rivalryScore: number;
  homeAdvantage: boolean;
}

export interface MatchupProbability {
  teamAWinPct: number;
  teamBWinPct: number;
  expectedMargin: number;
  confidence: number;
  keyFactors: string[];
}

export interface KeyMatchup {
  position: string;
  playerA: string;
  playerB: string;
  edge: "A" | "B" | "Even";
  note: string;
}

export interface MatchupState {
  teamA: NFLTeam | null;
  teamB: NFLTeam | null;
  statsA?: TeamSeasonStats;
  statsB?: TeamSeasonStats;
  probability?: MatchupProbability;
  keyMatchups?: KeyMatchup[];
  isLocked: boolean;
}
