// components/ClubRanking.js
"use client";

import { useState } from "react";
import { Pill, EmptyState } from "./ui";
import { Avatar } from "./Avatar";
import { colors, card } from "../lib/theme";
import { aggregateClubs, rankColor } from "../lib/scoring";

const medalBg = (rank) => rank === 1 ? "#facc15" : rank === 2 ? "#cbd5e1" : rank === 3 ? "#fb923c" : "rgba(255,255,255,0.05)";
const medalIcon = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

export const ClubRankingTab = ({ ranked, onOpenProfile }) => {
  const [expanded, setExpanded] = useState(null);
  const clubs = aggregateClubs(ranked);

  if (clubs.length === 0) {
    return <EmptyState text="ยังไม่มีผู้เล่นที่ระบุสังกัดสโมสร" />;
  }

  return (
    <div className="fade-in">
      <div style={{ color: colors.dim, fontSize: 13, marginBottom: 16 }}>
        จัดอันดับจากคะแนนรวมของผู้เล่นทุกคนในสโมสร · แตะที่สโมสรเพื่อดูรายชื่อผู้เล่น
      </div>
      {clubs.map((c) => {
        const isOpen = expanded === c.club;
        return (
          <div key={c.club} style={{ ...card, marginBottom: 12, padding: 0, overflow: "hidden" }}>
            <button
              onClick={() => setExpanded(isOpen ? null : c.club)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer", color: "inherit",
                display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", textAlign: "left", fontFamily: "inherit",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, background: medalBg(c.rank), fontWeight: 800, fontSize: 16,
                color: c.rank <= 3 ? "#0a0820" : colors.dim,
              }}>
                {medalIcon(c.rank) || `#${c.rank}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{c.club}</div>
                <div style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>{c.memberCount} ผู้เล่น</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 22, color: rankColor(c.rank) }}>{c.totalScore}</div>
                <div style={{ fontSize: 11, color: colors.faint }}>คะแนนรวม</div>
              </div>
            </button>

            {isOpen && (
              <div style={{ borderTop: "1px solid rgba(167,139,250,0.1)", padding: "12px 18px 16px" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <Pill tone="gold">🏆 {c.champion} แชมป์</Pill>
                  <Pill tone="silver">🥈 {c.runnerUp} รองแชมป์</Pill>
                  <Pill tone="green">{c.winRate.toFixed(1)}% ชนะ</Pill>
                </div>
                {c.players.map((p) => (
                  <button key={p.id} onClick={() => onOpenProfile(p)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                    background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left", fontFamily: "inherit",
                  }}>
                    <Avatar player={p} size={28} radius={8} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: colors.faint }}>#{p.rank} โลก</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: colors.cyan }}>{p.score} pts</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
