// components/Stats.js
"use client";

import { useState } from "react";
import { EmptyState } from "./ui";
import { Avatar } from "./Avatar";
import { colors, card, btnPrimary, btnGhost } from "../lib/theme";

const medalBg = (rank) => rank === 1 ? "#facc15" : rank === 2 ? "#cbd5e1" : rank === 3 ? "#fb923c" : "rgba(255,255,255,0.05)";
const medalIcon = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

// Generic ranked-row list used by both Goals Ranking and Win Streak Ranking
// — same visual language as Club Ranking, just a different metric on the
// right-hand side.
const RankedRow = ({ rank, p, mainValue, mainLabel, subline, onOpenProfile }) => (
  <button onClick={() => onOpenProfile(p)} style={{
    width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
    background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left", fontFamily: "inherit",
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, background: medalBg(rank), fontWeight: 800, fontSize: 14,
      color: rank <= 3 ? "#0a0820" : colors.dim,
    }}>
      {medalIcon(rank) || `#${rank}`}
    </div>
    <Avatar player={p} size={34} radius={10} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{p.name}</div>
      <div style={{ fontSize: 11, color: colors.faint, marginTop: 1 }}>{subline}</div>
    </div>
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <div style={{ fontWeight: 800, fontSize: 20, color: colors.cyan }}>{mainValue}</div>
      <div style={{ fontSize: 10, color: colors.faint }}>{mainLabel}</div>
    </div>
  </button>
);

const RankedList = ({ rows, emptyText }) => {
  if (rows.length === 0) return <EmptyState text={emptyText} />;
  return (
    <div style={{ ...card, padding: "6px 0" }}>
      {rows.map((row, i) => (
        <div key={row.p.id} style={{ borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(167,139,250,0.06)" }}>
          <RankedRow rank={i + 1} {...row} />
        </div>
      ))}
    </div>
  );
};

// ── Goals Ranking: ranks by goals scored (goalsFor), tie-broken by goal
// difference. Only players with at least one recorded match (bracket-derived
// goal data) are listed, since legacy hand-entered tournaments never
// recorded a goal count. ──────────────────────────────────────────────────
const GoalsRankingView = ({ ranked, onOpenProfile }) => {
  const withGoals = ranked.filter((p) => (p.matchesFromBracket || 0) > 0);
  const sorted = [...withGoals].sort((a, b) => {
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    const diffA = a.goalsFor - a.goalsAgainst, diffB = b.goalsFor - b.goalsAgainst;
    return diffB - diffA;
  });
  const rows = sorted.map((p) => ({
    p, onOpenProfile,
    mainValue: p.goalsFor, mainLabel: "ประตู",
    subline: `เสีย ${p.goalsAgainst} · ส่วนต่าง ${p.goalsFor - p.goalsAgainst >= 0 ? "+" : ""}${p.goalsFor - p.goalsAgainst}`,
  }));
  return (
    <div>
      <div style={{ color: colors.dim, fontSize: 13, marginBottom: 16 }}>
        จัดอันดับจากจำนวนประตูที่ยิงได้รวมทุกแมตช์ในระบบสายแข่ง (ทัวร์นาเมนต์แบบกรอกผลด้วยมือไม่มีข้อมูลประตูแยกเป็นรายคน)
      </div>
      <RankedList rows={rows} emptyText="ยังไม่มีข้อมูลประตูจากแมตช์ในระบบสายแข่ง" />
    </div>
  );
};

// ── Win Streak Ranking: ranks by best win streak ever achieved, tie-broken
// by current active streak. ──────────────────────────────────────────────
const WinStreakView = ({ ranked, onOpenProfile }) => {
  const withStreak = ranked.filter((p) => (p.bestWinStreak || 0) > 0);
  const sorted = [...withStreak].sort((a, b) => {
    if (b.bestWinStreak !== a.bestWinStreak) return b.bestWinStreak - a.bestWinStreak;
    return (b.currentWinStreak || 0) - (a.currentWinStreak || 0);
  });
  const rows = sorted.map((p) => ({
    p, onOpenProfile,
    mainValue: p.bestWinStreak, mainLabel: "สูงสุด",
    subline: p.currentWinStreak > 0 ? `🔥 ชนะต่อเนื่อง ${p.currentWinStreak} แมตช์ตอนนี้` : "ไม่มีสตรีคที่กำลังดำเนินอยู่",
  }));
  return (
    <div>
      <div style={{ color: colors.dim, fontSize: 13, marginBottom: 16 }}>
        จัดอันดับจากสถิติชนะติดต่อกันสูงสุดที่เคยทำได้ (คำนวณจากผลแมตช์ในระบบสายแข่งเท่านั้น)
      </div>
      <RankedList rows={rows} emptyText="ยังไม่มีผู้เล่นที่มีสตรีคชนะจากแมตช์ในระบบสายแข่ง" />
    </div>
  );
};

export const StatsRankingTab = ({ ranked, onOpenProfile }) => {
  const [view, setView] = useState("goals");
  return (
    <div className="fade-in">
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setView("goals")} style={{ ...(view === "goals" ? btnPrimary : btnGhost), flex: 1, padding: "10px" }}>
          ⚽ อันดับยิงประตู
        </button>
        <button onClick={() => setView("streak")} style={{ ...(view === "streak" ? btnPrimary : btnGhost), flex: 1, padding: "10px" }}>
          🔥 อันดับสตรีคชนะ
        </button>
      </div>
      {view === "goals"
        ? <GoalsRankingView ranked={ranked} onOpenProfile={onOpenProfile} />
        : <WinStreakView ranked={ranked} onOpenProfile={onOpenProfile} />}
    </div>
  );
};
