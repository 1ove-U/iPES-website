// lib/achievements.js
// Badges are computed on the fly from a player's combined stats (legacy +
// match-derived) plus their chronological tournament results. Nothing is
// stored — add a badge here and every existing player is instantly
// re-evaluated for it, no migration needed.

// championshipsForPlayer: tournaments this player won, oldest → newest,
// used to detect "Back-to-Back" / "Triple Champion" streaks.
function chronologicalChampionships(tournaments, playerId, playerName) {
  return tournaments
    .filter((t) => t.championId === playerId || (t.champion || "").trim() === (playerName || "").trim())
    .filter((t) => t.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Longest run of *consecutive* tournaments (by date order, among ALL
// tournaments in the archive) that this player won back to back.
function longestBackToBack(allTournaments, playerId, playerName) {
  const sorted = [...allTournaments].filter((t) => t.date).sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, current = 0;
  for (const t of sorted) {
    const won = t.championId === playerId || (t.champion || "").trim() === (playerName || "").trim();
    current = won ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

export function computeBadges(player, { allTournaments = [], giantKillCount = 0 } = {}) {
  const badges = [];
  const champ = player.champion || 0;
  const matchesPlayed = player.wins + player.losses;
  const bestWinStreak = player.bestWinStreak || 0;
  const backToBack = longestBackToBack(allTournaments, player.id, player.name);

  if (champ >= 1) badges.push({ id: "first_champion", icon: "🏆", label: "First Champion" });
  if (champ >= 3) badges.push({ id: "champion_3", icon: "🏆", label: "3 Time Champion" });
  if (champ >= 5) badges.push({ id: "champion_5", icon: "🏆", label: "5 Time Champion" });
  if (bestWinStreak >= 5) badges.push({ id: "streak_5", icon: "🔥", label: "Win 5 Matches In A Row" });
  if (bestWinStreak >= 10) badges.push({ id: "streak_10", icon: "🔥", label: "Win 10 Matches In A Row" });
  if (giantKillCount >= 1) badges.push({ id: "giant_killer", icon: "⚔", label: "Giant Killer" });
  if (backToBack >= 2) badges.push({ id: "back_to_back", icon: "👑", label: "Back-to-Back Champion" });
  if (backToBack >= 3) badges.push({ id: "triple_champion", icon: "👑", label: "Triple Champion" });
  if (matchesPlayed >= 100) badges.push({ id: "matches_100", icon: "🎯", label: "100 Matches Played" });
  if (matchesPlayed >= 500) badges.push({ id: "matches_500", icon: "🎯", label: "500 Matches Played" });

  return badges;
}
