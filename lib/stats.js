// lib/stats.js
// Everything here is a pure function over already-loaded `matches` (+
// `tournaments` for date fallback). Nothing is written back to Firestore —
// stats are recomputed on every render, which keeps the data model simple
// (no "recalculate" step to forget) and free of extra reads/writes.

// ── Team Mode support ─────────────────────────────────────────────────────
// A "team match" stores team IDs in playerAId/playerBId — exactly like a
// solo match stores player IDs (lib/bracket.js's engine is generic and
// doesn't care which). To make personal stats (wins/losses/goals/streaks/
// form) correctly include team results without duplicating any counting
// logic, expandTeamMatches() rewrites the matches array so each completed
// team match becomes one synthetic match PER MEMBER of each side — e.g. a
// 3v3 match becomes 6 synthetic matches, one per player, each carrying the
// team's shared score/winner so every member of the winning team picks up
// exactly one personal win (not one win per opposing member — that would
// multiply goals/wins by the opposing team's size, which is wrong). The
// "opponent id" on these synthetic entries is the *other team's id*, which
// is intentionally not a real player id — this is safe because every
// function that counts a personal record (deriveMatchStats, recentForm,
// winStreaks) only ever looks at "is this player on side A or B" and the
// score/winner, never at who the opponent actually was.
//
// headToHead() and detectRivalries() are the only functions that DO need a
// real, distinct opposing player id to mean anything ("rivalry" requires
// knowing which specific person you keep meeting) — those two explicitly
// skip any match flagged _teamMatch (see their definitions below), so a
// team result never corrupts individual rivalry stats with a fake
// opponent. Non-team matches pass through this function completely
// unchanged. Must run once, before matches reach any other function in
// this file or lib/scoring.js.
export function expandTeamMatches(matches, teamsById) {
  if (!teamsById || teamsById.size === 0) return matches;
  const out = [];
  for (const m of matches) {
    const teamA = teamsById.get(m.playerAId);
    const teamB = teamsById.get(m.playerBId);
    if (!teamA && !teamB) { out.push(m); continue; } // ordinary solo match, untouched
    if (m.status !== "completed" || !m.winnerId) continue; // nothing to credit yet

    const membersA = teamA?.memberIds || [];
    const membersB = teamB?.memberIds || [];
    const aWon = m.winnerId === m.playerAId;

    for (const memberId of membersA) {
      out.push({
        ...m, id: `${m.id}__${memberId}`, playerAId: memberId, playerBId: m.playerBId,
        winnerId: aWon ? memberId : m.playerBId, _teamMatch: true,
      });
    }
    for (const memberId of membersB) {
      out.push({
        ...m, id: `${m.id}__${memberId}`, playerAId: m.playerAId, playerBId: memberId,
        winnerId: aWon ? m.playerAId : memberId, _teamMatch: true,
      });
    }
  }
  return out;
}

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

// Form Table: ranks every player by their result in the last N matches,
// using football-style points (win = 3, loss = 0) — same source data as
// recentForm(), just computed for everyone at once and sorted. Players
// with zero played matches are excluded (nothing to show a form line for).
export function formTableRanking(matches, players, tournamentsById, n = 5) {
  return players
    .map((p) => {
      const form = recentForm(matches, p.id, tournamentsById, n);
      const points = form.filter((r) => r === "W").length * 3;
      const wins = form.filter((r) => r === "W").length;
      return { player: p, form, points, wins, losses: form.length - wins, played: form.length };
    })
    .filter((row) => row.played > 0)
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.played - a.played);
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
// playerMatches/streaks here expect the EXPANDED matches array (output of
// expandTeamMatches) so team results already count toward derived
// wins/losses/goals/streaks — see that function's comment for why.
// teamsById is needed separately only to credit champion/runnerUp/
// participated for TEAM tournaments, since those store a team id in
// championId/runnerUpId/playerIds rather than a player id directly.
export function combinePlayerStats(player, matches, tournamentsById, teamsById = new Map()) {
  const playerMatches = matchesForPlayer(matches, player.id, tournamentsById);
  const derived = deriveMatchStats(playerMatches, player.id);
  const streaks = winStreaks(matches, player.id, tournamentsById);

  // Bracket tournaments auto-fill championId/runnerUpId/playerIds on
  // creation/completion — fold those into the legacy manually-entered
  // champion/runnerUp/participated counters so score + badges stay correct
  // without the admin ever having to type a number by hand. For a TEAM
  // tournament, championId/runnerUpId/playerIds hold team ids — a player
  // is credited if they're a member of that team.
  let bracketChampion = 0, bracketRunnerUp = 0, bracketParticipated = 0;
  if (tournamentsById) {
    for (const t of tournamentsById.values()) {
      if (t.format === "team") {
        const championTeam = teamsById.get(t.championId);
        const runnerUpTeam = teamsById.get(t.runnerUpId);
        if (championTeam?.memberIds?.includes(player.id)) bracketChampion++;
        if (runnerUpTeam?.memberIds?.includes(player.id)) bracketRunnerUp++;
        if (Array.isArray(t.playerIds)) {
          const participated = t.playerIds.some((teamId) => teamsById.get(teamId)?.memberIds?.includes(player.id));
          if (participated) bracketParticipated++;
        }
      } else {
        if (t.championId === player.id) bracketChampion++;
        if (t.runnerUpId === player.id) bracketRunnerUp++;
        if (Array.isArray(t.playerIds) && t.playerIds.includes(player.id)) bracketParticipated++;
      }
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


// Note: headToHead deliberately skips matches flagged _teamMatch — see the
// big comment on expandTeamMatches() above for why a team result's
// "opponent id" isn't a real player and would corrupt this otherwise.
export function headToHead(matches, idA, idB) {
  let winsA = 0, winsB = 0, goalsA = 0, goalsB = 0, meetings = 0;
  for (const m of matches) {
    if (!isPlayedMatch(m) || m._teamMatch) continue;
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
// extra stored. IMPORTANT: pass the RAW matches array here (not the output
// of expandTeamMatches) — this shows each real fixture once, team or solo;
// the _teamMatch skip below is just a defensive backstop in case it's ever
// called with an expanded array by mistake.
export function recentCompletedMatches(matches, tournamentsById, limit = 10) {
  return matches
    .filter((m) => isPlayedMatch(m) && !m._teamMatch)
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

// ── Live Lobby ───────────────────────────────────────────────────────────
// Every match across every active tournament that's "ready to play" right
// now (both fighters known, not yet completed) — gathered into one feed so
// the whole group can see "who's playing who next" without opening each
// tournament one by one. Sorted with expired-deadline matches first (most
// urgent, admin needs to act), then by round deadline soonest, then
// matches with no deadline last.
export function pendingLobbyMatches(matches, tournaments) {
  const activeTournamentIds = new Set(
    tournaments.filter((t) => t.bracketSize && (t.status === "active" || t.status === "draft")).map((t) => t.id)
  );
  const tournamentsById = new Map(tournaments.map((t) => [t.id, t]));

  const ready = matches.filter((m) =>
    activeTournamentIds.has(m.tournamentId) &&
    m.status === "waiting" &&
    m.playerAId && m.playerBId
  );

  const now = Date.now();
  const deadlineOf = (m) => {
    const t = tournamentsById.get(m.tournamentId);
    const iso = t?.deadlines?.[m.round];
    return iso ? new Date(iso).getTime() : null;
  };

  return ready
    .map((m) => {
      const dl = deadlineOf(m);
      return { ...m, _deadlineMs: dl, _expired: dl != null && dl < now, tournament: tournamentsById.get(m.tournamentId) };
    })
    .sort((a, b) => {
      if (a._expired !== b._expired) return a._expired ? -1 : 1;
      if (a._deadlineMs == null && b._deadlineMs == null) return 0;
      if (a._deadlineMs == null) return 1;
      if (b._deadlineMs == null) return -1;
      return a._deadlineMs - b._deadlineMs;
    });
}

// Rivalry detection: pairs who have met often with a close overall record.
// Fully derived from matches — no extra storage. Skips _teamMatch entries
// for the same reason headToHead does (see expandTeamMatches comment).
export function detectRivalries(matches, playersById, minMeetings = 3, maxGap = 2) {
  const pairs = new Map();
  for (const m of matches) {
    if (!isPlayedMatch(m) || m._teamMatch) continue;
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
