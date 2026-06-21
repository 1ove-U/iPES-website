// components/Stats.js
"use client";

import { useState } from "react";
import { EmptyState, Pill } from "./ui";
import { Avatar } from "./Avatar";
import { colors, card, btnPrimary, btnGhost } from "../lib/theme";
import { formTableRanking, detectRivalries, headToHead } from "../lib/stats";

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

// ── Form Table: ranks players by football-style points (W=3, L=0) from
// their last 5 completed matches — same idea as a real league "form" table
// shown next to the main standings. ───────────────────────────────────────
const FormPips = ({ form }) => (
  <div style={{ display: "flex", gap: 3 }}>
    {form.map((r, i) => (
      <span key={i} style={{
        width: 18, height: 18, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 800, color: "#0a0820",
        background: r === "W" ? colors.green : colors.red,
      }}>{r}</span>
    ))}
  </div>
);

const FormTableView = ({ ranked, matches, tournamentsById, onOpenProfile }) => {
  const rows = formTableRanking(matches, ranked, tournamentsById, 5);
  if (rows.length === 0) return <EmptyState text="ยังไม่มีผู้เล่นที่แข่งจากระบบสายแข่ง" />;
  return (
    <div>
      <div style={{ color: colors.dim, fontSize: 13, marginBottom: 16 }}>
        จัดอันดับจาก 5 แมตช์ล่าสุดของแต่ละคน (ชนะ = 3 แต้ม) แบบตารางฟอร์มของลีกฟุตบอลจริง — ใครร้อนแรงตอนนี้ไม่ใช่ใครเก่งตลอดกาล
      </div>
      <div style={{ ...card, padding: "6px 0" }}>
        {rows.map((row, i) => (
          <button key={row.player.id} onClick={() => onOpenProfile(row.player)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
            background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left", fontFamily: "inherit",
            borderBottom: i === rows.length - 1 ? "none" : "1px solid rgba(167,139,250,0.06)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, background: medalBg(i + 1), fontWeight: 800, fontSize: 14,
              color: i < 3 ? "#0a0820" : colors.dim,
            }}>
              {medalIcon(i + 1) || `#${i + 1}`}
            </div>
            <Avatar player={row.player} size={34} radius={10} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4 }}>{row.player.name}</div>
              <FormPips form={row.form} />
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: colors.cyan }}>{row.points}</div>
              <div style={{ fontSize: 10, color: colors.faint }}>แต้มฟอร์ม</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Rivalry Tracker: pairs who've met often with a close overall record —
// "คู่ปรับตลอดกาล". Tapping a pair expands their full head-to-head record. ─
const RivalryView = ({ ranked, matches, playersById, onOpenProfile }) => {
  const [expanded, setExpanded] = useState(null);
  const rivalries = detectRivalries(matches, playersById, 2, 3); // 2+ meetings, gap of at most 3 wins

  if (rivalries.length === 0) {
    return <EmptyState text="ยังไม่มีคู่ปรับที่เจอกันมากพอจะจัดเป็นคู่ปรับตลอดกาล (ต้องเจอกันอย่างน้อย 2 ครั้ง และสถิติสูสีกัน)" />;
  }

  return (
    <div>
      <div style={{ color: colors.dim, fontSize: 13, marginBottom: 16 }}>
        คู่ที่เจอกันบ่อยและสถิติสูสีที่สุด · แตะที่คู่ไหนเพื่อดูประวัติการเจอกันทั้งหมด
      </div>
      {rivalries.map((r) => {
        const pA = playersById.get(r.idA), pB = playersById.get(r.idB);
        if (!pA || !pB) return null;
        const key = `${r.idA}|${r.idB}`;
        const isOpen = expanded === key;
        const h2h = headToHead(matches, r.idA, r.idB);
        return (
          <div key={key} style={{ ...card, marginBottom: 12, padding: 0, overflow: "hidden" }}>
            <button onClick={() => setExpanded(isOpen ? null : key)} style={{
              width: "100%", background: "none", border: "none", cursor: "pointer", color: "inherit",
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", textAlign: "left", fontFamily: "inherit",
            }}>
              <Avatar player={pA} size={36} radius={10} />
              <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: colors.faint, marginBottom: 2 }}>เจอกันมาแล้ว {r.meetings} ครั้ง</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{r.winsA} - {r.winsB}</div>
              </div>
              <Avatar player={pB} size={36} radius={10} />
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 16px 12px", fontSize: 12, color: colors.dim }}>
              <span style={{ flex: 1 }}>{pA.name}</span>
              <span style={{ flex: 1, textAlign: "right" }}>{pB.name}</span>
            </div>

            {isOpen && (
              <div style={{ borderTop: "1px solid rgba(167,139,250,0.1)", padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <Pill tone="cyan">ยิงรวม {h2h.goalsA} - {h2h.goalsB}</Pill>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => onOpenProfile(pA)} style={{ ...btnGhost, flex: 1, padding: "8px", fontSize: 12 }}>ดูโปรไฟล์ {pA.name}</button>
                  <button onClick={() => onOpenProfile(pB)} style={{ ...btnGhost, flex: 1, padding: "8px", fontSize: 12 }}>ดูโปรไฟล์ {pB.name}</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const StatsRankingTab = ({ ranked, matches, tournamentsById, playersById, onOpenProfile }) => {
  const [view, setView] = useState("goals");
  return (
    <div className="fade-in">
      <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
        <button onClick={() => setView("goals")} style={{ ...(view === "goals" ? btnPrimary : btnGhost), flexShrink: 0, padding: "10px 14px", fontSize: 13 }}>
          ⚽ ยิงประตู
        </button>
        <button onClick={() => setView("streak")} style={{ ...(view === "streak" ? btnPrimary : btnGhost), flexShrink: 0, padding: "10px 14px", fontSize: 13 }}>
          🔥 สตรีคชนะ
        </button>
        <button onClick={() => setView("form")} style={{ ...(view === "form" ? btnPrimary : btnGhost), flexShrink: 0, padding: "10px 14px", fontSize: 13 }}>
          📈 ฟอร์ม 5 นัด
        </button>
        <button onClick={() => setView("rivalry")} style={{ ...(view === "rivalry" ? btnPrimary : btnGhost), flexShrink: 0, padding: "10px 14px", fontSize: 13 }}>
          ⚔️ คู่ปรับตลอดกาล
        </button>
      </div>
      {view === "goals" && <GoalsRankingView ranked={ranked} onOpenProfile={onOpenProfile} />}
      {view === "streak" && <WinStreakView ranked={ranked} onOpenProfile={onOpenProfile} />}
      {view === "form" && <FormTableView ranked={ranked} matches={matches} tournamentsById={tournamentsById} onOpenProfile={onOpenProfile} />}
      {view === "rivalry" && <RivalryView ranked={ranked} matches={matches} playersById={playersById} onOpenProfile={onOpenProfile} />}
    </div>
  );
};
