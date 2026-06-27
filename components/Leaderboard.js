// components/Leaderboard.js
"use client";

import { useState } from "react";
import {
  IconSearch, IconPlus, IconEdit, IconTrash, IconClose, IconPin, Pill, MovementPill,
} from "./ui";
import { Avatar } from "./Avatar";
import { ClubLogo } from "./ClubManager";
import { colors, table, th, thR, td, tdR, btnPrimary, iconBtnCyan, iconBtnRed } from "../lib/theme";
import { rankMedal, rankColor, getMovement } from "../lib/scoring";

const searchBar = {
  display: "flex", alignItems: "center", gap: 10,
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.18)",
  borderRadius: 10, padding: "10px 14px",
};
const searchInput = { flex: 1, background: "none", border: "none", color: colors.text, fontSize: 14, outline: "none", fontFamily: "inherit" };

const podiumWrap = { display: "flex", gap: 12, marginBottom: 24, alignItems: "flex-end" };
const podiumCard = (rank) => ({
  flex: rank === 1 ? 1.15 : 1,
  background: rank === 1 ? "linear-gradient(165deg, rgba(250,204,21,0.10), rgba(255,255,255,0.02))" : "rgba(255,255,255,0.025)",
  border: `1px solid ${rank === 1 ? "rgba(250,204,21,0.4)" : rank === 2 ? "rgba(203,213,225,0.3)" : "rgba(251,146,60,0.3)"}`,
  borderRadius: 14, padding: "20px 14px 18px", textAlign: "center",
  order: rank === 1 ? 0 : rank === 2 ? -1 : 1,
  position: "relative",
  boxShadow: rank === 1 ? "0 0 36px rgba(250,204,21,0.10)" : "none",
});

const NewsBanner = ({ news, onViewAll }) => {
  if (!news) return null;
  return (
    <button onClick={onViewAll} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
      background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.25)",
      borderRadius: 10, padding: "10px 14px", marginBottom: 14, cursor: "pointer", color: "inherit",
    }}>
      {news.pinned && <span style={{ color: colors.gold, display: "flex" }}><IconPin /></span>}
      <span style={{ fontSize: 12, color: colors.dim, fontWeight: 700, flexShrink: 0 }}>ข่าวล่าสุด</span>
      <span style={{ fontSize: 13, color: colors.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
        {news.title}
      </span>
      <span style={{ fontSize: 12, color: colors.cyan, fontWeight: 700, flexShrink: 0 }}>ดูทั้งหมด ›</span>
    </button>
  );
};

export const LeaderboardTab = ({
  ranked, isAdmin, onAdd, onEdit, onDeleteRequest, onOpenProfile, latestNews, onViewAllNews, clubsByName,
}) => {
  const [search, setSearch] = useState("");
  const filtered = search
    ? ranked.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.club || "").toLowerCase().includes(search.toLowerCase()))
    : ranked;
  const top3 = ranked.slice(0, 3);

  return (
    <div className="fade-in">
      <NewsBanner news={latestNews} onViewAll={onViewAllNews} />

      {!search && top3.length >= 3 && (
        <div style={podiumWrap}>
          {[top3[0], top3[1], top3[2]].map((p) => {
            const club = p.club ? clubsByName?.get(p.club.toLowerCase()) : null;
            const hasClubColors = club?.colorPrimary && club?.colorSecondary;
            return (
              <div key={p.id} style={podiumCard(p.rank)} className={p.rank === 1 ? "gold-glow" : ""}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <Avatar player={p} size={p.rank === 1 ? 52 : 44} radius={14} />
                </div>
                <div style={{ fontSize: p.rank === 1 ? 22 : 18, lineHeight: 1, marginBottom: 4 }}>{rankMedal(p.rank)}</div>
                <button onClick={() => onOpenProfile(p)} style={{
                  background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0,
                  fontWeight: 800, fontSize: p.rank === 1 ? 16 : 14, marginBottom: 2, lineHeight: 1.3,
                }}>{p.name}</button>
                {p.club && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 4 }}>
                    <span style={{
                      display: "inline-flex", borderRadius: 6,
                      boxShadow: hasClubColors ? `0 0 0 1.5px ${club.colorPrimary}` : "none",
                    }}>
                      <ClubLogo name={p.club} logoUrl={club?.logoUrl} size={14} radius={4} />
                    </span>
                    <span style={{ fontSize: 11, color: colors.dim }}>{p.club}</span>
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: p.rank === 1 ? 26 : 22, color: rankColor(p.rank), fontVariantNumeric: "tabular-nums" }}>{p.score}</div>
                <div style={{ fontSize: 11, color: colors.dim, marginTop: 2 }}>คะแนน</div>
                <div style={{ marginTop: 12, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                  <Pill tone="gold">🏆 {p.champion}</Pill>
                  <Pill tone="cyan">{p.winRate.toFixed(1)}%</Pill>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ ...searchBar, flex: 1 }}>
          <span style={{ color: colors.dim }}><IconSearch /></span>
          <input style={searchInput} placeholder="ค้นหาชื่อผู้เล่น หรือสโมสร..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: colors.dim, cursor: "pointer", padding: 0 }}>
              <IconClose />
            </button>
          )}
        </div>
        {isAdmin && (
          <button style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }} onClick={onAdd}>
            <IconPlus />เพิ่มผู้เล่น
          </button>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={table}>
          <thead>
            <tr>
              <th style={{ ...th, width: 52 }}>อันดับ</th>
              <th style={th}>ผู้เล่น</th>
              <th className="hide-mobile" style={th}>สโมสร</th>
              <th style={thR}>คะแนน</th>
              <th className="hide-mobile" style={thR}>🏆 แชมป์</th>
              <th className="hide-mobile" style={thR}>🥈 รองแชมป์</th>
              <th className="hide-tablet hide-mobile" style={thR}>เข้าร่วม</th>
              <th className="hide-tablet hide-mobile" style={thR}>ชนะ</th>
              <th className="hide-tablet hide-mobile" style={thR}>แพ้</th>
              <th style={thR}>Win%</th>
              <th className="hide-mobile" style={thR}>เปลี่ยนแปลง</th>
              {isAdmin && <th style={th}></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={td}>
                  <span style={{ fontWeight: 800, fontSize: p.rank <= 3 ? 18 : 14, color: rankColor(p.rank) }}>
                    {rankMedal(p.rank) || `#${p.rank}`}
                  </span>
                </td>
                <td style={{ ...td, fontWeight: 600 }}>
                  <button onClick={() => onOpenProfile(p)} style={{
                    background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0,
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left", fontFamily: "inherit",
                  }}>
                    <Avatar player={p} size={30} radius={9} />
                    <span>
                      {p.name}
                      {p.club && (
                        <div className="club-row-mobile" style={{ fontSize: 12, color: colors.dim, fontWeight: 500, marginTop: 2 }}>{p.club}</div>
                      )}
                    </span>
                  </button>
                </td>
                <td className="hide-mobile" style={{ ...td, color: "#a39ee0" }}>
                  {p.club ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {(() => {
                        const club = clubsByName?.get(p.club.toLowerCase());
                        const hasColors = club?.colorPrimary && club?.colorSecondary;
                        return (
                          <span style={{ display: "inline-flex", borderRadius: 8, boxShadow: hasColors ? `0 0 0 1.5px ${club.colorPrimary}` : "none" }}>
                            <ClubLogo name={p.club} logoUrl={club?.logoUrl} size={22} radius={6} />
                          </span>
                        );
                      })()}
                      <span>{p.club}</span>
                    </div>
                  ) : "—"}
                </td>
                <td style={{ ...tdR, fontWeight: 800, fontSize: 16, color: colors.cyan }}>{p.score}</td>
                <td className="hide-mobile" style={{ ...tdR, color: colors.gold, fontWeight: 700 }}>{p.champion}</td>
                <td className="hide-mobile" style={{ ...tdR, color: colors.silver }}>{p.runnerUp}</td>
                <td className="hide-tablet hide-mobile" style={tdR}>{p.participated}</td>
                <td className="hide-tablet hide-mobile" style={{ ...tdR, color: colors.green }}>{p.wins}</td>
                <td className="hide-tablet hide-mobile" style={{ ...tdR, color: colors.red }}>{p.losses}</td>
                <td style={tdR}>
                  <span style={{ fontWeight: 700, color: p.winRate >= 60 ? colors.green : p.winRate >= 40 ? colors.gold : colors.red }}>
                    {p.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="hide-mobile" style={tdR}>
                  <MovementPill movement={getMovement(p)} />
                </td>
                {isAdmin && (
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => onEdit(p)} style={iconBtnCyan}><IconEdit /></button>
                      <button onClick={() => onDeleteRequest(p)} style={iconBtnRed}><IconTrash /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={isAdmin ? 11 : 10} style={{ ...td, textAlign: "center", color: colors.faint, padding: 32 }}>
                ไม่พบผู้เล่นที่ค้นหา
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", color: colors.faint, fontSize: 12, fontWeight: 500 }}>
        <span>🏆 แชมป์ = <b style={{ color: colors.gold }}>10 คะแนน</b></span>
        <span>🥈 รองแชมป์ = <b style={{ color: colors.silver }}>6 คะแนน</b></span>
        <span>📅 เข้าร่วม = <b style={{ color: colors.cyan }}>1 คะแนน</b></span>
        <span>⚔️ ชนะแมตช์ = <b style={{ color: colors.green }}>2 คะแนน</b></span>
        <span>▲▼ เปลี่ยนแปลง = เทียบกับอันดับล่าสุดที่ Admin บันทึกไว้</span>
      </div>
    </div>
  );
};
