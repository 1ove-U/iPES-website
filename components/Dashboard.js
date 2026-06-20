// components/Dashboard.js
"use client";

import { IconUp, IconDown } from "./ui";
import { Avatar } from "./Avatar";
import { colors, card } from "../lib/theme";
import { rankMedal, topMovers } from "../lib/scoring";
import { detectRivalries, detectUpsets } from "../lib/stats";

const StatCard = ({ value, label, color, small }) => (
  <div style={{ ...card, textAlign: "center" }}>
    <div style={{
      fontWeight: 800, color, fontSize: small ? 16 : 32, lineHeight: 1.1, marginBottom: 8,
      fontVariantNumeric: "tabular-nums",
    }}>{value}</div>
    <div style={{ color: colors.faint, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em" }}>{label}</div>
  </div>
);

const MoverRow = ({ p, direction, onOpenProfile }) => (
  <button onClick={() => onOpenProfile(p)} style={{
    display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none",
    cursor: "pointer", color: "inherit", textAlign: "left", padding: "8px 0", fontFamily: "inherit",
  }}>
    <Avatar player={p} size={30} radius={9} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{p.name}</div>
      {p.club && <div style={{ fontSize: 11, color: colors.faint }}>{p.club}</div>}
    </div>
    <span style={{
      display: "flex", alignItems: "center", gap: 3, fontWeight: 800, fontSize: 13,
      color: direction === "up" ? colors.green : colors.red,
    }}>
      {direction === "up" ? <IconUp /> : <IconDown />}{p.movement.delta}
    </span>
  </button>
);

export const DashboardTab = ({
  players, ranked, lastSnapshotAt, onOpenProfile,
  matches, playersById, tournamentsById, rankById,
}) => {
  const totalChampions = players.reduce((s, p) => s + p.champion, 0);
  const totalMatches = players.reduce((s, p) => s + p.wins + p.losses, 0);
  const { climbers, fallers } = topMovers(ranked, 3);
  const showHighlights = matches && matches.length > 0 && playersById && rankById;
  const upsets = showHighlights ? detectUpsets(matches, rankById, tournamentsById, 15, 4) : [];
  const rivalries = showHighlights ? detectRivalries(matches, playersById, 3, 2).slice(0, 4) : [];

  return (
    <div className="fade-in">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard value={players.length} label="ผู้เล่นทั้งหมด" color={colors.cyan} />
        <StatCard value={totalMatches} label="แมตช์ที่แข่งแล้ว" color={colors.green} />
        <StatCard value={totalChampions} label="แชมป์รวมทุกรายการ" color={colors.gold} />
        <StatCard value={ranked[0]?.name || "-"} label="อันดับ 1 ปัจจุบัน" color={colors.violetLight} small />
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 20, color: "#f1f0ff" }}>5 อันดับคะแนนสูงสุด</div>
        {ranked.slice(0, 5).map((p, i) => {
          const pct = (p.score / (ranked[0]?.score || 1)) * 100;
          return (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13, fontWeight: 600 }}>
                <span style={{ color: "#f1f0ff" }}>{rankMedal(p.rank) || `#${p.rank}`} {p.name}</span>
                <span style={{ color: colors.cyan, fontVariantNumeric: "tabular-nums" }}>{p.score} pts</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${pct}%`, borderRadius: 4,
                  background: i === 0 ? "linear-gradient(90deg, #facc15, #f59e0b)"
                    : i === 1 ? "linear-gradient(90deg, #cbd5e1, #94a3b8)"
                    : i === 2 ? "linear-gradient(90deg, #fb923c, #ea580c)"
                    : "linear-gradient(90deg, #22d3ee, #a78bfa)",
                  transition: "width .6s ease",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 16, color: "#f1f0ff" }}>อัตราชนะสูงสุด</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[...ranked].sort((a, b) => b.winRate - a.winRate).slice(0, 5).map((p, i) => (
            <div key={p.id} style={{
              flex: "1 1 140px", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(167,139,250,0.15)", borderRadius: 10, padding: "14px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 12, color: colors.faint, marginBottom: 4 }}>#{i + 1}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#f1f0ff", lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: colors.green }}>{p.winRate.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {showHighlights && (upsets.length > 0 || rivalries.length > 0) && (
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, color: "#f1f0ff" }}>ไฮไลท์ล่าสุด</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {upsets.length > 0 && (
              <div style={{ flex: "1 1 220px" }}>
                <div style={{ fontSize: 12, color: colors.bronze, fontWeight: 700, marginBottom: 6 }}>⚔ Upset ล่าสุด</div>
                {upsets.map((u, i) => (
                  <button key={i} onClick={() => onOpenProfile(playersById.get(u.winnerId))} style={{
                    display: "block", width: "100%", textAlign: "left", background: "none", border: "none",
                    cursor: "pointer", color: "inherit", fontFamily: "inherit", padding: "6px 0",
                    borderBottom: i === upsets.length - 1 ? "none" : "1px solid rgba(167,139,250,0.06)",
                  }}>
                    <span style={{ fontSize: 12.5, color: "#f1f0ff" }}>
                      <b>{playersById.get(u.winnerId)?.name}</b> เอาชนะ <b>{playersById.get(u.loserId)?.name}</b>
                    </span>
                    <div style={{ fontSize: 10, color: colors.faint, marginTop: 1 }}>ส่วนต่างอันดับ {u.gap}</div>
                  </button>
                ))}
              </div>
            )}
            {rivalries.length > 0 && (
              <div style={{ flex: "1 1 220px" }}>
                <div style={{ fontSize: 12, color: colors.violetLight, fontWeight: 700, marginBottom: 6 }}>🔥 คู่ปรับ</div>
                {rivalries.map((r, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: i === rivalries.length - 1 ? "none" : "1px solid rgba(167,139,250,0.06)" }}>
                    <span style={{ fontSize: 12.5, color: "#f1f0ff" }}>
                      {playersById.get(r.idA)?.name} <span style={{ color: colors.faint }}>vs</span> {playersById.get(r.idB)?.name}
                    </span>
                    <div style={{ fontSize: 10, color: colors.faint, marginTop: 1 }}>เจอกัน {r.meetings} นัด · {r.winsA}-{r.winsB}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: "#f1f0ff" }}>ผู้ไต่อันดับ (Ranking Movement)</div>
          <div style={{ fontSize: 11, color: colors.faint }}>
            {lastSnapshotAt ? `บันทึกล่าสุด: ${lastSnapshotAt}` : "ยังไม่มีการบันทึกอันดับ"}
          </div>
        </div>
        {climbers.length === 0 && fallers.length === 0 ? (
          <div style={{ color: colors.faint, fontSize: 13 }}>
            Admin ยังไม่ได้บันทึกอันดับครั้งล่าสุด จึงยังไม่มีข้อมูลความเคลื่อนไหวให้แสดง
          </div>
        ) : (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ fontSize: 12, color: colors.green, fontWeight: 700, marginBottom: 4 }}>ไต่อันดับขึ้นสูงสุด</div>
              {climbers.length === 0
                ? <div style={{ color: colors.faint, fontSize: 12 }}>ไม่มีผู้เล่นที่อันดับดีขึ้น</div>
                : climbers.map((p) => <MoverRow key={p.id} p={p} direction="up" onOpenProfile={onOpenProfile} />)}
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ fontSize: 12, color: colors.red, fontWeight: 700, marginBottom: 4 }}>หลุดอันดับมากสุด</div>
              {fallers.length === 0
                ? <div style={{ color: colors.faint, fontSize: 12 }}>ไม่มีผู้เล่นที่อันดับตกลง</div>
                : fallers.map((p) => <MoverRow key={p.id} p={p} direction="down" onOpenProfile={onOpenProfile} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
