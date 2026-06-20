// components/ClubRanking.js
"use client";

import { useState } from "react";
import { Pill, EmptyState } from "./ui";
import { Avatar } from "./Avatar";
import { ClubLogo } from "./ClubManager";
import { colors, card } from "../lib/theme";
import { aggregateClubs, rankColor } from "../lib/scoring";

const medalIcon = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

export const ClubRankingTab = ({ ranked, clubsByName, onOpenProfile }) => {
  const [expanded, setExpanded] = useState(null);
  const clubs = aggregateClubs(ranked, clubsByName);

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
              <div style={{ position: "relative", flexShrink: 0 }}>
                <ClubLogo name={c.club} logoUrl={c.logoUrl} size={44} radius={12} />
                {medalIcon(c.rank) && (
                  <span style={{ position: "absolute", bottom: -4, right: -4, fontSize: 16, lineHeight: 1 }}>
                    {medalIcon(c.rank)}
                  </span>
                )}
                {!medalIcon(c.rank) && (
                  <span style={{
                    position: "absolute", bottom: -4, right: -4, fontSize: 10, fontWeight: 800,
                    background: "#1a1640", color: colors.dim, borderRadius: 6, padding: "1px 4px",
                    border: "1px solid rgba(167,139,250,0.25)",
                  }}>#{c.rank}</span>
                )}
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
