// components/HallOfFame.js
"use client";

import { useState } from "react";
import { Pill, SectionHeader, EmptyState, formatDate } from "./ui";
import { Avatar } from "./Avatar";
import { colors, card, btnPrimary, btnGhost } from "../lib/theme";
import { seasonChampions } from "../lib/scoring";

const AllTimeView = ({ ranked, onOpenProfile }) => {
  const hallOfFame = [...ranked].sort((a, b) => b.champion - a.champion || b.score - a.score);
  const champions = hallOfFame.filter((p) => p.champion > 0);
  const rest = hallOfFame.filter((p) => p.champion === 0);

  if (champions.length === 0) return <EmptyState text="ยังไม่มีผู้เล่นที่คว้าแชมป์ในระบบ" />;

  return (
    <div>
      {champions.map((p, i) => (
        <button
          key={p.id}
          onClick={() => onOpenProfile(p)}
          className={i === 0 ? "gold-glow" : ""}
          style={{
            ...card, marginBottom: 12, display: "flex", alignItems: "center", gap: 16, width: "100%",
            cursor: "pointer", color: "inherit", textAlign: "left", fontFamily: "inherit",
            border: i === 0 ? "1px solid rgba(250,204,21,0.4)" : card.border,
            background: i === 0 ? "linear-gradient(165deg, rgba(250,204,21,0.10), rgba(255,255,255,0.02))" : "rgba(255,255,255,0.025)",
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            background: i === 0 ? "#facc15" : i === 1 ? "#cbd5e1" : i === 2 ? "#fb923c" : "rgba(255,255,255,0.05)",
            fontWeight: 800, fontSize: 20, color: i < 3 ? "#0a0820" : colors.dim,
          }}>
            {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
          </div>
          <Avatar player={p} size={44} radius={12} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", marginBottom: 2 }}>{p.name}</div>
            {p.club && <div style={{ fontSize: 12, color: colors.faint, marginBottom: 6 }}>{p.club}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill tone="gold">🏆 {p.champion} แชมป์</Pill>
              <Pill tone="violet">🥈 {p.runnerUp} รองแชมป์</Pill>
              <Pill tone="cyan">{p.winRate.toFixed(1)}% ชนะ</Pill>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 28, color: "#facc15", lineHeight: 1 }}>{p.score}</div>
            <div style={{ fontSize: 11, color: colors.faint }}>คะแนน</div>
          </div>
        </button>
      ))}

      {rest.length > 0 && (
        <div style={{ marginTop: 20, color: colors.faint, fontSize: 12, textAlign: "center" }}>
          มีผู้เล่นอีก {rest.length} คนที่ยังไม่เคยคว้าแชมป์
        </div>
      )}
    </div>
  );
};

const SeasonTournamentRow = ({ t, onOpenProfile }) => (
  <div style={{ ...card, marginBottom: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{t.name}</div>
        <div style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>{formatDate(t.date)}</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {t.championPlayer && (
        <button
          onClick={() => t.championClickable && onOpenProfile(t.championPlayer)}
          disabled={!t.championClickable}
          style={{
            display: "flex", alignItems: "center", gap: 10, background: "none", border: "none",
            cursor: t.championClickable ? "pointer" : "default", color: "inherit", padding: 0, fontFamily: "inherit",
          }}
        >
          <Avatar player={t.championPlayer} size={36} radius={10} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 10, color: colors.gold, fontWeight: 700, letterSpacing: "0.05em" }}>🏆 แชมป์</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.championPlayer.name}</div>
          </div>
        </button>
      )}
      {t.runnerUpPlayer && (
        <button
          onClick={() => t.runnerUpClickable && onOpenProfile(t.runnerUpPlayer)}
          disabled={!t.runnerUpClickable}
          style={{
            display: "flex", alignItems: "center", gap: 10, background: "none", border: "none",
            cursor: t.runnerUpClickable ? "pointer" : "default", color: "inherit", padding: 0, fontFamily: "inherit",
          }}
        >
          <Avatar player={t.runnerUpPlayer} size={36} radius={10} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 10, color: colors.silver, fontWeight: 700, letterSpacing: "0.05em" }}>🥈 รองแชมป์</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.runnerUpPlayer.name}</div>
          </div>
        </button>
      )}
    </div>
  </div>
);

const SeasonView = ({ tournaments, rankedById, onOpenProfile }) => {
  const seasons = seasonChampions(tournaments, rankedById);
  if (seasons.length === 0) return <EmptyState text="ยังไม่มีทัวร์นาเมนต์ที่จบการแข่งขัน" />;

  return (
    <div>
      {seasons.map((s) => (
        <div key={s.season} style={{ marginBottom: 28 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
          }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: colors.violetLight }}>{s.season}</div>
            <div style={{ flex: 1, height: 1, background: "rgba(167,139,250,0.15)" }} />
            <div style={{ fontSize: 11, color: colors.faint }}>{s.tournaments.length} ทัวร์นาเมนต์</div>
          </div>
          {s.tournaments.map((t) => (
            <SeasonTournamentRow key={t.id} t={t} onOpenProfile={onOpenProfile} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const HallOfFameTab = ({ ranked, tournaments, rankedById, onOpenProfile }) => {
  const [view, setView] = useState("alltime");

  return (
    <div className="fade-in">
      <SectionHeader title="หอเกียรติยศ" subtitle="ผู้เล่นที่คว้าแชมป์สูงสุดในประวัติศาสตร์การแข่งขัน iPES" />

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setView("alltime")} style={{ ...(view === "alltime" ? btnPrimary : btnGhost), flex: 1, padding: "10px" }}>
          แชมป์ตลอดกาล
        </button>
        <button onClick={() => setView("season")} style={{ ...(view === "season" ? btnPrimary : btnGhost), flex: 1, padding: "10px" }}>
          แยกตามซีซั่น
        </button>
      </div>

      {view === "alltime"
        ? <AllTimeView ranked={ranked} onOpenProfile={onOpenProfile} />
        : <SeasonView tournaments={tournaments || []} rankedById={rankedById} onOpenProfile={onOpenProfile} />}
    </div>
  );
};
