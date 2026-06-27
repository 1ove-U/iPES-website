// components/TeamRanking.js
"use client";

import { useState } from "react";
import { Pill, EmptyState } from "./ui";
import { Avatar } from "./Avatar";
import { TeamLogo } from "./TeamManager";
import { colors, card } from "../lib/theme";
import { aggregateTeams } from "../lib/scoring";

const medalIcon = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

export const TeamRankingTab = ({ teams, matches, tournaments, playersById, onOpenProfile }) => {
  const [expanded, setExpanded] = useState(null);
  const rows = aggregateTeams(teams, matches, tournaments, playersById);

  if (rows.length === 0) {
    return <EmptyState text="ยังไม่มีทีมในระบบ — แอดมินสร้างทีมได้ที่ Admin → จัดการทีม" />;
  }

  return (
    <div className="fade-in">
      <div style={{ color: colors.dim, fontSize: 13, marginBottom: 16 }}>
        จัดอันดับทีมจากผลแข่งของทีมเอง (แชมป์×10 + รองแชมป์×6 + เข้าร่วม×1 + ชนะ×2) · แตะทีมเพื่อดูสมาชิก
      </div>
      {rows.map((t) => {
        const isOpen = expanded === t.id;
        return (
          <div key={t.id} style={{ ...card, marginBottom: 12, padding: 0, overflow: "hidden" }}>
            <button
              onClick={() => setExpanded(isOpen ? null : t.id)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer", color: "inherit",
                display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", textAlign: "left", fontFamily: "inherit",
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <TeamLogo name={t.name} logoUrl={t.logoUrl} size={44} radius={12} />
                {medalIcon(t.rank) && (
                  <span style={{ position: "absolute", bottom: -4, right: -4, fontSize: 16, lineHeight: 1 }}>
                    {medalIcon(t.rank)}
                  </span>
                )}
                {!medalIcon(t.rank) && (
                  <span style={{
                    position: "absolute", bottom: -4, right: -4, fontSize: 10, fontWeight: 800,
                    background: "#1a1640", color: colors.dim, borderRadius: 6, padding: "1px 4px",
                    border: "1px solid rgba(167,139,250,0.25)",
                  }}>#{t.rank}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>{t.size}v{t.size} · {(t.memberIds || []).length} สมาชิก</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 22, color: t.rank === 1 ? colors.gold : "#fff" }}>{t.score}</div>
                <div style={{ fontSize: 11, color: colors.faint }}>คะแนน</div>
              </div>
            </button>

            {isOpen && (
              <div style={{ borderTop: "1px solid rgba(167,139,250,0.1)", padding: "12px 18px 16px" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <Pill tone="gold">🏆 {t.champion} แชมป์</Pill>
                  <Pill tone="silver">🥈 {t.runnerUp} รองแชมป์</Pill>
                  <Pill tone="green">{t.winRate.toFixed(1)}% ชนะ</Pill>
                  <Pill tone="cyan">ยิง {t.goalsFor}-{t.goalsAgainst}</Pill>
                </div>
                {t.played === 0 && (
                  <div style={{ fontSize: 11, color: colors.faint, marginBottom: 10 }}>ทีมนี้ยังไม่มีผลแข่งที่จบแล้ว</div>
                )}
                {t.members.map((p) => (
                  <button key={p.id} onClick={() => onOpenProfile(p)} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                    background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left", fontFamily: "inherit",
                  }}>
                    <Avatar player={p} size={28} radius={8} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: colors.faint, flexShrink: 0 }}>#{p.rank} โลก</span>
                  </button>
                ))}
                {t.members.length < (t.memberIds || []).length && (
                  <div style={{ fontSize: 11, color: colors.faint, paddingTop: 6 }}>
                    มีสมาชิกบางคนที่ถูกลบออกจากระบบผู้เล่นแล้ว ไม่แสดงในรายชื่อนี้
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
