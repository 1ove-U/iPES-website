// lib/scoring.js
// Pure helper functions: scoring, win rate, ranking, ranking movement, club aggregation.
// Kept dependency-free so they can be unit-tested or reused from any component.

export function calcScore(p) {
  return p.champion * 10 + p.runnerUp * 6 + p.participated * 1;
}

export function calcWinRate(p) {
  const total = p.wins + p.losses;
  return total === 0 ? 0 : (p.wins / total) * 100;
}

// Adds score/winRate/rank to every player, sorted by score then tiebreakers.
export function rankPlayers(players) {
  return [...players]
    .map((p) => ({ ...p, score: calcScore(p), winRate: calcWinRate(p) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.champion !== a.champion) return b.champion - a.champion;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.wins - a.wins;
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

// Ranking Movement: compares each player's current rank against the rank
// captured at the last admin snapshot (p.previousRank / p.previousScore).
// Returns { direction: 'up'|'down'|'same'|'new', delta } where delta is
// always a positive number of places moved.
export function getMovement(p) {
  if (p.previousRank === undefined || p.previousRank === null) {
    return { direction: "new", delta: 0 };
  }
  const delta = p.previousRank - p.rank; // positive = moved up
  if (delta > 0) return { direction: "up", delta };
  if (delta < 0) return { direction: "down", delta: Math.abs(delta) };
  return { direction: "same", delta: 0 };
}

export function rankMedal(r) {
  return r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : null;
}

export function rankColor(r) {
  return r === 1 ? "#facc15" : r === 2 ? "#cbd5e1" : r === 3 ? "#fb923c" : "#6e6a96";
}

// Club Ranking: aggregates ranked players into their clubs. Players with no
// club set are excluded (they are not represented in any club's roster).
// clubsByName: optional Map of normalized-club-name -> club doc ({id, name,
// logoUrl}), used to attach a crest to each aggregated club. Matching is by
// trimmed, lowercased name — so existing free-text club values on players
// keep working with zero migration; a club only gets a logo once an admin
// creates a matching entry in the Clubs manager.
export function aggregateClubs(rankedPlayers, clubsByName = new Map()) {
  const map = new Map();
  for (const p of rankedPlayers) {
    const key = (p.club || "").trim();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, {
        club: key,
        players: [],
        totalScore: 0,
        champion: 0,
        runnerUp: 0,
        wins: 0,
        losses: 0,
        participated: 0,
      });
    }
    const c = map.get(key);
    c.players.push(p);
    c.totalScore += p.score;
    c.champion += p.champion;
    c.runnerUp += p.runnerUp;
    c.wins += p.wins;
    c.losses += p.losses;
    c.participated += p.participated;
  }
  const arr = [...map.values()].map((c) => ({
    ...c,
    memberCount: c.players.length,
    winRate: c.wins + c.losses === 0 ? 0 : (c.wins / (c.wins + c.losses)) * 100,
    players: c.players.sort((a, b) => b.score - a.score),
    logoUrl: clubsByName.get(c.club.toLowerCase())?.logoUrl || null,
  }));
  arr.sort((a, b) => b.totalScore - a.totalScore);
  return arr.map((c, i) => ({ ...c, rank: i + 1 }));
}

// Top climbers / fallers for the Dashboard "Ranking Movement" widget.
export function topMovers(rankedPlayers, count = 3) {
  const withMovement = rankedPlayers
    .filter((p) => p.previousRank !== undefined && p.previousRank !== null)
    .map((p) => ({ ...p, movement: getMovement(p) }));
  const climbers = withMovement
    .filter((p) => p.movement.direction === "up")
    .sort((a, b) => b.movement.delta - a.movement.delta)
    .slice(0, count);
  const fallers = withMovement
    .filter((p) => p.movement.direction === "down")
    .sort((a, b) => b.movement.delta - a.movement.delta)
    .slice(0, count);
  return { climbers, fallers };
}

// Player's results pulled from the tournament archive, used on the
// Player Profile modal (newest first). Matches by id (bracket-generated
// tournaments) first, falling back to the legacy plain-text name fields
// (manually-entered tournaments from before the bracket system existed).
export function tournamentsForPlayer(tournaments, player) {
  if (!player) return [];
  const id = player.id;
  const name = (player.name || "").trim();
  return tournaments
    .filter((t) => {
      if (t.championId === id || t.runnerUpId === id) return true;
      if (!name) return false;
      return [t.champion, t.runnerUp, t.third].some((n) => (n || "").trim() === name);
    })
    .map((t) => {
      let placement = null;
      if (t.championId === id || (t.champion || "").trim() === name) placement = 1;
      else if (t.runnerUpId === id || (t.runnerUp || "").trim() === name) placement = 2;
      else if ((t.third || "").trim() === name) placement = 3;
      return { ...t, placement };
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

// Hall of Fame — grouped by season: for every season tag found across the
// tournament archive, list its completed tournaments with champion/runner-
// up/third (resolved to a live player object where possible so avatars and
// current club show correctly). Seasons sort newest-label-first; "ไม่ระบุ
// ซีซั่น" (tournaments with no season tag) always sorts last.
export function seasonChampions(tournaments, rankedById) {
  const bySeason = new Map();
  for (const t of tournaments) {
    const finished = t.bracketSize ? t.status === "completed" : !!t.champion;
    if (!finished) continue;
    const key = (t.season || "").trim() || "ไม่ระบุซีซั่น";
    if (!bySeason.has(key)) bySeason.set(key, []);
    const championLive = t.championId ? rankedById?.get(t.championId) : null;
    const runnerUpLive = t.runnerUpId ? rankedById?.get(t.runnerUpId) : null;
    bySeason.get(key).push({
      ...t,
      // championPlayer/runnerUpPlayer are always safe to render a name from.
      // championClickable/runnerUpClickable are only true when the player
      // still exists in the live roster (rankedById) — guards against a
      // deleted player's id lingering on an old tournament doc.
      championPlayer: championLive || (t.champion ? { name: t.champion } : null),
      championClickable: !!championLive,
      runnerUpPlayer: runnerUpLive || (t.runnerUp ? { name: t.runnerUp } : null),
      runnerUpClickable: !!runnerUpLive,
    });
  }
  const seasons = [...bySeason.entries()].map(([season, list]) => ({
    season,
    tournaments: list.sort((a, b) => (b.date || "").localeCompare(a.date || "")),
  }));
  seasons.sort((a, b) => {
    if (a.season === "ไม่ระบุซีซั่น") return 1;
    if (b.season === "ไม่ระบุซีซั่น") return -1;
    return b.season.localeCompare(a.season);
  });
  return seasons;
}
