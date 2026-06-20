// components/PlayerCompare.js
"use client";

import { useState, useMemo } from "react";
import { Avatar } from "./Avatar";
import { Modal, IconSearch } from "./ui";
import { colors, card, inputStyle } from "../lib/theme";
import { rankMedal, rankColor } from "../lib/scoring";
import { headToHead } from "../lib/stats";

const Row = ({ label, valueA, valueB, betterIsHigher = true, format = (v) => v }) => {
  const a = Number(valueA) || 0;
  const b = Number(valueB) || 0;
  const aWins = betterIsHigher ? a > b : a < b;
  const bWins = betterIsHigher ? b > a : b < a;
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(167,139,250,0.08)" }}>
      <div style={{ flex: 1, textAlign: "right", fontWeight: 800, fontSize: 15, color: aWins ? colors.green : "#f1f0ff" }}>
        {format(valueA)}
      </div>
      <div style={{ width: 110, textAlign: "center", fontSize: 11, color: colors.faint, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ flex: 1, textAlign: "left", fontWeight: 800, fontSize: 15, color: bWins ? colors.green : "#f1f0ff" }}>
        {format(valueB)}
      </div>
    </div>
  );
};

const PlayerHead = ({ p }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
    <Avatar player={p} size={56} radius={14} />
    <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", textAlign: "center" }}>{p.name}</div>
    {p.club && <div style={{ fontSize: 11, color: colors.dim }}>{p.club}</div>}
    <div style={{ fontSize: 12, fontWeight: 700, color: rankColor(p.rank) }}>{rankMedal(p.rank) || `#${p.rank}`}</div>
  </div>
);

// players: ranked array (already has score/winRate/rank from rankPlayers).
export const PlayerCompare = ({ players, initialPlayer, matches, tournamentsById, onClose }) => {
  const [bId, setBId] = useState(null);
  const [q, setQ] = useState("");

  const playerA = initialPlayer;
  const playerB = bId ? players.find((p) => p.id === bId) || null : null;

  const candidates = useMemo(() => {
    return players
      .filter((p) => p.id !== playerA.id)
      .filter((p) => !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || (p.club || "").toLowerCase().includes(q.toLowerCase()))
      .slice(0, 30);
  }, [players, playerA, q]);

  const h2h = playerB && matches ? headToHead(matches, playerA.id, playerB.id) : null;

  return (
    <Modal title="เปรียบเทียบผู้เล่น" onClose={onClose} maxWidth={520}>
      {!playerB ? (
        <div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <PlayerHead p={playerA} />
          </div>
          <div style={{ textAlign: "center", color: colors.faint, fontSize: 12, marginBottom: 12 }}>เลือกผู้เล่นอีกคนเพื่อเปรียบเทียบ</div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 12, top: 11, color: colors.faint }}><IconSearch /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาผู้เล่น..." style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 10 }}>
            {candidates.length === 0 ? (
              <div style={{ padding: 16, color: colors.faint, fontSize: 13, textAlign: "center" }}>ไม่พบผู้เล่น</div>
            ) : candidates.map((p) => (
              <button key={p.id} onClick={() => setBId(p.id)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", width: "100%",
                background: "none", border: "none", borderBottom: "1px solid rgba(167,139,250,0.06)",
                cursor: "pointer", color: "inherit", fontFamily: "inherit", textAlign: "left",
              }}>
                <Avatar player={p} size={26} radius={8} />
                <span style={{ fontSize: 13, color: "#f1f0ff", flex: 1, minWidth: 0 }}>{p.name}</span>
                {p.club && <span style={{ fontSize: 11, color: colors.faint }}>{p.club}</span>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <PlayerHead p={playerA} />
            <div style={{ fontWeight: 900, fontSize: 13, color: colors.faint, padding: "0 6px" }}>VS</div>
            <PlayerHead p={playerB} />
          </div>

          {h2h && h2h.meetings > 0 && (
            <div style={{ ...card, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: colors.faint, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ประวัติการเจอกัน ({h2h.meetings} นัด)
              </div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                <span style={{ color: h2h.winsA > h2h.winsB ? colors.green : "#f1f0ff" }}>{h2h.winsA}</span>
                <span style={{ color: colors.faint, fontWeight: 600, fontSize: 13 }}> ชนะ — แพ้ </span>
                <span style={{ color: h2h.winsB > h2h.winsA ? colors.green : "#f1f0ff" }}>{h2h.winsB}</span>
              </div>
              <div style={{ fontSize: 11, color: colors.faint, marginTop: 4 }}>ประตู {h2h.goalsA}-{h2h.goalsB}</div>
            </div>
          )}

          <div style={card}>
            <Row label="คะแนน" valueA={playerA.score} valueB={playerB.score} />
            <Row label="อันดับ" valueA={playerA.rank} valueB={playerB.rank} betterIsHigher={false} format={(v) => `#${v}`} />
            <Row label="แชมป์" valueA={playerA.champion} valueB={playerB.champion} />
            <Row label="รองแชมป์" valueA={playerA.runnerUp} valueB={playerB.runnerUp} />
            <Row label="อัตราชนะ" valueA={playerA.winRate} valueB={playerB.winRate} format={(v) => `${Number(v).toFixed(1)}%`} />
            <Row label="ชนะ" valueA={playerA.wins} valueB={playerB.wins} />
            <Row label="แพ้" valueA={playerA.losses} valueB={playerB.losses} betterIsHigher={false} />
            <Row label="ประตูได้" valueA={playerA.goalsFor || 0} valueB={playerB.goalsFor || 0} />
            <Row label="Win Streak สูงสุด" valueA={playerA.bestWinStreak || 0} valueB={playerB.bestWinStreak || 0} />
          </div>

          <button onClick={() => { setBId(null); setQ(""); }} style={{
            background: "none", border: "none", color: colors.cyan, cursor: "pointer", fontSize: 13, marginTop: 14, padding: 0,
          }}>← เลือกผู้เล่นอื่น</button>
        </div>
      )}
    </Modal>
  );
};
