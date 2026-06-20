// components/HomeWidgets.js
"use client";

import { Pill, formatDate } from "./ui";
import { Avatar } from "./Avatar";
import { colors, card } from "../lib/theme";

function nameOf(playersById, id, fallback) {
  if (!id) return fallback || "ผู้เล่นที่ถูกลบ";
  return playersById.get(id)?.name || fallback || "ผู้เล่นที่ถูกลบ";
}

// ── Recent Matches: latest completed matches across every bracket
// tournament, newest first. Purely derived from the `matches` collection —
// nothing extra stored. ─────────────────────────────────────────────────
export const RecentMatchesWidget = ({ matches, playersById, tournamentsById, onOpenProfile }) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 14, color: "#f1f0ff" }}>แมตช์ล่าสุด</div>
      {matches.map((m) => {
        const playerA = playersById.get(m.playerAId);
        const playerB = playersById.get(m.playerBId);
        const t = tournamentsById.get(m.tournamentId);
        return (
          <div key={m.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(167,139,250,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => playerA && onOpenProfile(playerA)} style={{
                flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end",
                background: "none", border: "none", cursor: playerA ? "pointer" : "default", color: "inherit", fontFamily: "inherit", padding: 0,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: m.winnerId === m.playerAId ? 800 : 500,
                  color: m.winnerId === m.playerAId ? "#fff" : colors.faint,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right",
                }}>{nameOf(playersById, m.playerAId)}</span>
                <Avatar player={playerA || { name: nameOf(playersById, m.playerAId) }} size={26} radius={8} />
              </button>
              <div style={{ flexShrink: 0, textAlign: "center", minWidth: 56 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: colors.cyan, fontVariantNumeric: "tabular-nums" }}>
                  {m.scoreA ?? "–"} : {m.scoreB ?? "–"}
                </div>
              </div>
              <button onClick={() => playerB && onOpenProfile(playerB)} style={{
                flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8,
                background: "none", border: "none", cursor: playerB ? "pointer" : "default", color: "inherit", fontFamily: "inherit", padding: 0,
              }}>
                <Avatar player={playerB || { name: nameOf(playersById, m.playerBId) }} size={26} radius={8} />
                <span style={{
                  fontSize: 13, fontWeight: m.winnerId === m.playerBId ? 800 : 500,
                  color: m.winnerId === m.playerBId ? "#fff" : colors.faint,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{nameOf(playersById, m.playerBId)}</span>
              </button>
            </div>
            {t?.name && (
              <div style={{ fontSize: 10, color: colors.faint, textAlign: "center", marginTop: 4 }}>{t.name}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Upcoming Tournament: next tournament(s) still in progress / not yet
// started, soonest date first. ───────────────────────────────────────────
export const UpcomingTournamentWidget = ({ tournaments, onGoTournament }) => {
  if (!tournaments || tournaments.length === 0) return null;

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 14, color: "#f1f0ff" }}>ทัวร์นาเมนต์ที่กำลังจะมาถึง</div>
      {tournaments.map((t) => (
        <button key={t.id} onClick={onGoTournament} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
          background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left", fontFamily: "inherit",
          borderBottom: "1px solid rgba(167,139,250,0.06)",
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{t.name}</div>
            <div style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>
              {t.date ? formatDate(t.date) : "ยังไม่กำหนดวันที่"}{t.season ? ` · ${t.season}` : ""}
            </div>
          </div>
          {t.bracketSize
            ? <Pill tone={t.status === "active" ? "cyan" : "silver"}>{t.status === "active" ? "กำลังแข่งขัน" : "Draft"}</Pill>
            : <Pill tone="violet">รอประกาศผล</Pill>}
        </button>
      ))}
    </div>
  );
};
