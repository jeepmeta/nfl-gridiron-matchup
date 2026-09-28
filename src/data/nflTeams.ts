import type { NFLTeam } from "../types/nfl";

const logo = (abbr: string) =>
  `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;

export const NFL_TEAMS: NFLTeam[] = [
  // AFC East
  { id: "1", abbr: "BUF", name: "Bills", fullName: "Buffalo Bills", conference: "AFC", division: "East", primaryColor: "#00338D", secondaryColor: "#C60C30", logoUrl: logo("buf"), helmetUrl: logo("buf") },
  { id: "2", abbr: "MIA", name: "Dolphins", fullName: "Miami Dolphins", conference: "AFC", division: "East", primaryColor: "#008E97", secondaryColor: "#FC4C02", logoUrl: logo("mia"), helmetUrl: logo("mia") },
  { id: "3", abbr: "NE", name: "Patriots", fullName: "New England Patriots", conference: "AFC", division: "East", primaryColor: "#002244", secondaryColor: "#C60C30", logoUrl: logo("ne"), helmetUrl: logo("ne") },
  { id: "4", abbr: "NYJ", name: "Jets", fullName: "New York Jets", conference: "AFC", division: "East", primaryColor: "#125740", secondaryColor: "#000000", logoUrl: logo("nyj"), helmetUrl: logo("nyj") },
  // AFC North
  { id: "5", abbr: "BAL", name: "Ravens", fullName: "Baltimore Ravens", conference: "AFC", division: "North", primaryColor: "#241773", secondaryColor: "#000000", logoUrl: logo("bal"), helmetUrl: logo("bal") },
  { id: "6", abbr: "CIN", name: "Bengals", fullName: "Cincinnati Bengals", conference: "AFC", division: "North", primaryColor: "#FB4F14", secondaryColor: "#000000", logoUrl: logo("cin"), helmetUrl: logo("cin") },
  { id: "7", abbr: "CLE", name: "Browns", fullName: "Cleveland Browns", conference: "AFC", division: "North", primaryColor: "#311D00", secondaryColor: "#FF3C00", logoUrl: logo("cle"), helmetUrl: logo("cle") },
  { id: "8", abbr: "PIT", name: "Steelers", fullName: "Pittsburgh Steelers", conference: "AFC", division: "North", primaryColor: "#FFB612", secondaryColor: "#101820", logoUrl: logo("pit"), helmetUrl: logo("pit") },
  // AFC South
  { id: "9", abbr: "HOU", name: "Texans", fullName: "Houston Texans", conference: "AFC", division: "South", primaryColor: "#03202F", secondaryColor: "#A71930", logoUrl: logo("hou"), helmetUrl: logo("hou") },
  { id: "10", abbr: "IND", name: "Colts", fullName: "Indianapolis Colts", conference: "AFC", division: "South", primaryColor: "#002C5F", secondaryColor: "#A2AAAD", logoUrl: logo("ind"), helmetUrl: logo("ind") },
  { id: "11", abbr: "JAX", name: "Jaguars", fullName: "Jacksonville Jaguars", conference: "AFC", division: "South", primaryColor: "#006778", secondaryColor: "#D7A22A", logoUrl: logo("jax"), helmetUrl: logo("jax") },
  { id: "12", abbr: "TEN", name: "Titans", fullName: "Tennessee Titans", conference: "AFC", division: "South", primaryColor: "#0C2340", secondaryColor: "#4B92DB", logoUrl: logo("ten"), helmetUrl: logo("ten") },
  // AFC West
  { id: "13", abbr: "DEN", name: "Broncos", fullName: "Denver Broncos", conference: "AFC", division: "West", primaryColor: "#FB4F14", secondaryColor: "#002244", logoUrl: logo("den"), helmetUrl: logo("den") },
  { id: "14", abbr: "KC", name: "Chiefs", fullName: "Kansas City Chiefs", conference: "AFC", division: "West", primaryColor: "#E31837", secondaryColor: "#FFB81C", logoUrl: logo("kc"), helmetUrl: logo("kc") },
  { id: "15", abbr: "LV", name: "Raiders", fullName: "Las Vegas Raiders", conference: "AFC", division: "West", primaryColor: "#000000", secondaryColor: "#A5ACAF", logoUrl: logo("lv"), helmetUrl: logo("lv") },
  { id: "16", abbr: "LAC", name: "Chargers", fullName: "Los Angeles Chargers", conference: "AFC", division: "West", primaryColor: "#0080C6", secondaryColor: "#FFC20E", logoUrl: logo("lac"), helmetUrl: logo("lac") },
  // NFC East
  { id: "17", abbr: "DAL", name: "Cowboys", fullName: "Dallas Cowboys", conference: "NFC", division: "East", primaryColor: "#003594", secondaryColor: "#869397", logoUrl: logo("dal"), helmetUrl: logo("dal") },
  { id: "18", abbr: "NYG", name: "Giants", fullName: "New York Giants", conference: "NFC", division: "East", primaryColor: "#0B2265", secondaryColor: "#A71930", logoUrl: logo("nyg"), helmetUrl: logo("nyg") },
  { id: "19", abbr: "PHI", name: "Eagles", fullName: "Philadelphia Eagles", conference: "NFC", division: "East", primaryColor: "#004C54", secondaryColor: "#A5ACAF", logoUrl: logo("phi"), helmetUrl: logo("phi") },
  { id: "20", abbr: "WSH", name: "Commanders", fullName: "Washington Commanders", conference: "NFC", division: "East", primaryColor: "#5A1414", secondaryColor: "#FFB612", logoUrl: logo("wsh"), helmetUrl: logo("wsh") },
  // NFC North
  { id: "21", abbr: "CHI", name: "Bears", fullName: "Chicago Bears", conference: "NFC", division: "North", primaryColor: "#0B162A", secondaryColor: "#C83803", logoUrl: logo("chi"), helmetUrl: logo("chi") },
  { id: "22", abbr: "DET", name: "Lions", fullName: "Detroit Lions", conference: "NFC", division: "North", primaryColor: "#0076B6", secondaryColor: "#B0B7BC", logoUrl: logo("det"), helmetUrl: logo("det") },
  { id: "23", abbr: "GB", name: "Packers", fullName: "Green Bay Packers", conference: "NFC", division: "North", primaryColor: "#203731", secondaryColor: "#FFB612", logoUrl: logo("gb"), helmetUrl: logo("gb") },
  { id: "24", abbr: "MIN", name: "Vikings", fullName: "Minnesota Vikings", conference: "NFC", division: "North", primaryColor: "#4F2683", secondaryColor: "#FFC62F", logoUrl: logo("min"), helmetUrl: logo("min") },
  // NFC South
  { id: "25", abbr: "ATL", name: "Falcons", fullName: "Atlanta Falcons", conference: "NFC", division: "South", primaryColor: "#A71930", secondaryColor: "#000000", logoUrl: logo("atl"), helmetUrl: logo("atl") },
  { id: "26", abbr: "CAR", name: "Panthers", fullName: "Carolina Panthers", conference: "NFC", division: "South", primaryColor: "#0085CA", secondaryColor: "#101820", logoUrl: logo("car"), helmetUrl: logo("car") },
  { id: "27", abbr: "NO", name: "Saints", fullName: "New Orleans Saints", conference: "NFC", division: "South", primaryColor: "#D3BC8D", secondaryColor: "#101820", logoUrl: logo("no"), helmetUrl: logo("no") },
  { id: "28", abbr: "TB", name: "Buccaneers", fullName: "Tampa Bay Buccaneers", conference: "NFC", division: "South", primaryColor: "#D50A0A", secondaryColor: "#FF7900", logoUrl: logo("tb"), helmetUrl: logo("tb") },
  // NFC West
  { id: "29", abbr: "ARI", name: "Cardinals", fullName: "Arizona Cardinals", conference: "NFC", division: "West", primaryColor: "#97233F", secondaryColor: "#000000", logoUrl: logo("ari"), helmetUrl: logo("ari") },
  { id: "30", abbr: "LAR", name: "Rams", fullName: "Los Angeles Rams", conference: "NFC", division: "West", primaryColor: "#003594", secondaryColor: "#FFA300", logoUrl: logo("lar"), helmetUrl: logo("lar") },
  { id: "31", abbr: "SF", name: "49ers", fullName: "San Francisco 49ers", conference: "NFC", division: "West", primaryColor: "#AA0000", secondaryColor: "#B3995D", logoUrl: logo("sf"), helmetUrl: logo("sf") },
  { id: "32", abbr: "SEA", name: "Seahawks", fullName: "Seattle Seahawks", conference: "NFC", division: "West", primaryColor: "#002244", secondaryColor: "#69BE28", logoUrl: logo("sea"), helmetUrl: logo("sea") },
];

export function getTeamByAbbr(abbr: string): NFLTeam | undefined {
  return NFL_TEAMS.find((t) => t.abbr === abbr.toUpperCase());
}

export function filterTeams(
  conference?: string,
  division?: string
): NFLTeam[] {
  return NFL_TEAMS.filter((t) => {
    if (conference && conference !== "ALL" && t.conference !== conference) return false;
    if (division && division !== "ALL" && t.division !== division) return false;
    return true;
  });
}
