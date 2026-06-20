// lib/stats.js
// Everything here is a pure function over already-loaded `matches` (+
// `tournaments` for date fallback). Nothing is written back to Firestore —
// stats are recomputed on every render, which keeps the data model simple
// (no "recalculate" step to forget) and free of extra reads/writes.

function isPlayedMatch(m) {
  return m.status === "completed" && m.playerAId && m.playerBId && m.winnerId;
}

function matchDateOf(m, tournamentsById) {
  if (m.matchDate) return new Date(m.matchDate);
  const t = tournamentsById?.get(m.tournamentId);
  if (t?.date) return new Date(t.date);
  if (m.createdAt?.toDate) return m.createdAt.toDate();
  return new Date(0);
}

// All completed matches a player took part in, newest first.
export function matchesForPlayer(matches, playerId, tournamentsById) {
  return matches
    .filter((m) => isPlayedMatch(m) && (m.playerAId === playerId || m.playerBId === playerId))
    .map((m) => ({ ...m, _date: matchDateOf(m, tournamentsById) }))
    .sort((a, b) => b._date - a._date);
}

// Stats derived purely from the matches collection (goals, wins, losses).
// These get ADDED to a player's legacy manually-entered totals elsewhere
// (lib/scoring.js) so old tournaments recorded before the bracket system
// existed still count.
export function deriveMatchStats(matches, playerId) {
  let wins = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, played = 0;
  for (const m of matches) {
    if (!isPlayedMatch(m)) continue;
    const isA = m.playerAId === playerId;
    const isB = m.playerBId === playerId;
    if (!isA && !isB) continue;
    played++;
    const my = isA ? m.scoreA : m.scoreB;
    const opp = isA ? m.scoreB : m.scoreA;
    if (typeof my === "number") goalsFor += my;
    if (typeof opp === "number") goalsAgainst += opp;
    if (m.winnerId === playerId) wins++; else losses++;
  }
  return { wins, losses, goalsFor, goalsAgainst, played };
}

// Recent Form: last N completed matches, newest first, as 'W' | 'L'.
export function recentForm(matches, playerId, tournamentsById, n = 5) {
  return matchesForPlayer(matches, playerId, tournamentsById)
    .slice(0, n)
    .map((m) => (m.winnerId === playerId ? "W" : "L"));
}

// Win Streak / Unbeaten Streak — current & best. In a knockout format a
// loss always means elimination, so "unbeaten" and "win streak" come out
// equal, but both are kept since the spec calls for both explicitly.
export function winStreaks(matches, playerId, tournamentsById) {
  const ordered = matchesForPlayer(matches, playerId, tournamentsById).slice().reverse(); // oldest → newest
  let current = 0, best = 0;
  for (const m of ordered) {
    if (m.winnerId === playerId) { current++; best = Math.max(best, current); }
    else current = 0;
  }
  return { currentWin: current, bestWin: best, currentUnbeaten: current, bestUnbeaten: best };
}

// Merges a player's legacy manually-entered totals (champion/runnerUp/
// wins/losses/participated — still supported for tournaments recorded
// before the bracket system, or entered by hand) with stats derived live
// from the matches collection. The result is what gets passed into
// rankPlayers() / the rest of the UI, so every screen sees one combined
// number regardless of which era a result came from.
export function combinePlayerStats(player, matches, tournamentsById) {
  const playerMatches = matchesForPlayer(matches, player.id, tournamentsById);
  const derived = deriveMatchStats(playerMatches, player.id);
  const streaks = winStreaks(matches, player.id, tournamentsById);

  // Bracket tournaments auto-fill championId/runnerUpId/playerIds on
  // creation/completion — fold those into the legacy manually-entered
  // champion/runnerUp/participated counters so score + badges stay correct
  // without the admin ever having to type a number by hand.
  let bracketChampion = 0, bracketRunnerUp = 0, bracketParticipated = 0;
  if (tournamentsById) {
    for (const t of tournamentsById.values()) {
      if (t.championId === player.id) bracketChampion++;
      if (t.runnerUpId === player.id) bracketRunnerUp++;
      if (Array.isArray(t.playerIds) && t.playerIds.includes(player.id)) bracketParticipated++;
    }
  }

  return {
    ...player,
    champion: (player.champion || 0) + bracketChampion,
    runnerUp: (player.runnerUp || 0) + bracketRunnerUp,
    participated: (player.participated || 0) + bracketParticipated,
    wins: (player.wins || 0) + derived.wins,
    losses: (player.losses || 0) + derived.losses,
    goalsFor: derived.goalsFor,
    goalsAgainst: derived.goalsAgainst,
    matchesFromBracket: derived.played,
    bestWinStreak: streaks.bestWin,
    currentWinStreak: streaks.currentWin,
    bestUnbeatenStreak: streaks.bestUnbeaten,
    currentUnbeatenStreak: streaks.currentUnbeaten,
  };
}


export function headToHead(matches, idA, idB) {
  let winsA = 0, winsB = 0, goalsA = 0, goalsB = 0, meetings = 0;
  for (const m of matches) {
    if (!isPlayedMatch(m)) continue;
    const aIsA = m.playerAId === idA && m.playerBId === idB;
    const aIsB = m.playerAId === idB && m.playerBId === idA;
    if (!aIsA && !aIsB) continue;
    meetings++;
    const scoreFor = aIsA ? m.scoreA : m.scoreB;
    const scoreAgainst = aIsA ? m.scoreB : m.scoreA;
    if (typeof scoreFor === "number") goalsA += scoreFor;
    if (typeof scoreAgainst === "number") goalsB += scoreAgainst;
    if (m.winnerId === idA) winsA++; else if (m.winnerId === idB) winsB++;
  }
  return { meetings, winsA, winsB, goalsA, goalsB };
}

// Win Rate Trend: bucket completed matches into a window (7/30/90/all days)
// and report win rate inside that window only.
export function winRateInWindow(matches, playerId, tournamentsById, days) {
  const now = new Date();
  const cutoff = days ? new Date(now.getTime() - days * 86400000) : null;
  const list = matchesForPlayer(matches, playerId, tournamentsById)
    .filter((m) => !cutoff || m._date >= cutoff);
  if (list.length === 0) return null;
  const wins = list.filter((m) => m.winnerId === playerId).length;
  return (wins / list.length) * 100;
}

export const TREND_WINDOWS = [
  { label: "7 วัน", days: 7 },
  { label: "30 วัน", days: 30 },
  { label: "90 วัน", days: 90 },
  { label: "ทั้งหมด", days: null },
];

// Recent Matches: every completed match across all tournaments, newest
// first. Used by the "Recent Matches" widget/tab — purely derived, nothing
// extra stored.
export function recentCompletedMatches(matches, tournamentsById, limit = 10) {
  return matches
    .filter((m) => isPlayedMatch(m))
    .map((m) => ({ ...m, _date: matchDateOf(m, tournamentsById) }))
    .sort((a, b) => b._date - a._date)
    .slice(0, limit);
}

// Upcoming Tournaments: tournaments that are not yet completed — either a
// live bracket still in progress ("active"/"draft") or, for legacy manual
// tournaments, ones with a future date and no champion recorded yet.
// Sorted soonest first (tournaments with no date sink to the bottom).
export function upcomingTournaments(tournaments, limit = 5) {
  const isUpcoming = (t) => {
    if (t.bracketSize) return t.status === "active" || t.status === "draft";
    return !t.champion; // legacy: no champion yet = not finished
  };
  return tournaments
    .filter(isUpcoming)
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    })
    .slice(0, limit);
}

// Rivalry detection: pairs who have met often with a close overall record.
// Fully derived from matches — no extra storage.
export function detectRivalries(matches, playersById, minMeetings = 3, maxGap = 2) {
  const pairs = new Map();
  for (const m of matches) {
    if (!isPlayedMatch(m)) continue;
    const key = [m.playerAId, m.playerBId].sort().join("|");
    if (!pairs.has(key)) pairs.set(key, { idA: m.playerAId, idB: m.playerBId, winsA: 0, winsB: 0 });
    const p = pairs.get(key);
    const [sortedA] = key.split("|");
    if (m.winnerId === sortedA) p.winsA++; else p.winsB++;
  }
  return [...pairs.values()]
    .map((p) => ({ ...p, meetings: p.winsA + p.winsB, gap: Math.abs(p.winsA - p.winsB) }))
    .filter((p) => p.meetings >= minMeetings && p.gap <= maxGap)
    .filter((p) => playersById.has(p.idA) && playersById.has(p.idB))
    .sort((a, b) => b.meetings - a.meetings);
}

// Upset Detection: a much lower-ranked player beating a much higher-ranked
// one. rankById should be a Map<playerId, currentRank> (e.g. from rankPlayers).
export function detectUpsets(matches, rankById, tournamentsById, minGap = 15, limit = 5) {
  const upsets = [];
  for (const m of matches) {
    if (!isPlayedMatch(m)) continue;
    const winnerRank = rankById.get(m.winnerId);
    const loserId = m.winnerId === m.playerAId ? m.playerBId : m.playerAId;
    const loserRank = rankById.get(loserId);
    if (winnerRank == null || loserRank == null) continue;
    const gap = winnerRank - loserRank; // positive = lower-ranked player won
    if (gap >= minGap) {
      upsets.push({ match: m, winnerId: m.winnerId, loserId, gap, _date: matchDateOf(m, tournamentsById) });
    }
  }
  return upsets.sort((a, b) => b._date - a._date).slice(0, limit);
}
