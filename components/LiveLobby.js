// components/LiveLobby.js
"use client";

import { EmptyState, VerifyCodeBadge } from "./ui";
import { Avatar } from "./Avatar";
import { TeamLogo } from "./TeamManager";
import { colors, card } from "../lib/theme";
import { roundLabel } from "../lib/bracket";

function Countdown({ ms, expired }) {
  if (expired) return <span style={{ color: colors.red, fontWeight: 700 }}>⏰ เลยเวลาแล้ว รอแอดมินตัดสิน</span>;
  if (ms == null) return <span style={{ color: colors.faint }}>ยังไม่ตั้งเวลาปิดรับผล</span>;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const label = days > 0 ? `เหลือ ${days} วัน ${hours} ชม.` : hours > 0 ? `เหลือ ${hours} ชม. ${mins} นาที` : `เหลือ ${mins} นาที`;
  return <span style={{ color: colors.cyan }}>{label}</span>;
}

const FighterChip = ({ id, entity, isTeamMode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
    {isTeamMode
      ? <TeamLogo name={entity?.name} logoUrl={entity?.logoUrl} size={32} radius={9} />
      : <Avatar player={entity || { name: "?" }} size={32} radius={9} />}
    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {entity?.name || "ผู้เล่นที่ถูกลบ"}
    </span>
  </div>
);

const LobbyCard = ({ m, playersById, teamsById, onGoTournament }) => {
  const isTeamMode = m.tournament?.format === "team";
  const lookup = isTeamMode ? teamsById : playersById;
  const a = lookup.get(m.playerAId);
  const b = lookup.get(m.playerBId);

  return (
    <button
      onClick={() => onGoTournament(m.tournament)}
      style={{
        ...card, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
        marginBottom: 12, display: "block",
        border: m._expired ? "1px solid rgba(248,113,113,0.35)" : card.border,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f0ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.tournament?.name}
          </div>
          <div style={{ fontSize: 11, color: colors.faint, marginTop: 1 }}>
            {roundLabel(m.round, m.tournament?.bracketSize)}{isTeamMode ? " · ทีม" : ""}
          </div>
        </div>
        {m.verifyCode && <VerifyCodeBadge code={m.verifyCode} />}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <FighterChip id={m.playerAId} entity={a} isTeamMode={isTeamMode} />
        <span style={{ color: colors.faint, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>VS</span>
        <FighterChip id={m.playerBId} entity={b} isTeamMode={isTeamMode} />
      </div>

      <div style={{ marginTop: 10, fontSize: 12 }}>
        <Countdown ms={m._deadlineMs != null ? m._deadlineMs - Date.now() : null} expired={m._expired} />
      </div>
    </button>
  );
};

export const LiveLobbyTab = ({ lobbyMatches, playersById, teamsById, onGoTournament }) => {
  if (lobbyMatches.length === 0) {
    return <EmptyState text="ตอนนี้ไม่มีแมตช์ที่รอแข่งอยู่ — รอแอดมินจับสายทัวร์นาเมนต์ใหม่ หรือทุกคู่ที่จับไว้แข่งจบหมดแล้ว" />;
  }
  return (
    <div className="fade-in">
      <div style={{ color: colors.dim, fontSize: 13, marginBottom: 16 }}>
        ทุกคู่ที่รอแข่งอยู่ตอนนี้จากทุกทัวร์นาเมนต์ที่กำลังดำเนินอยู่ · คู่ที่เลยเวลาขึ้นก่อนเพื่อรอแอดมินตัดสิน · แตะการ์ดเพื่อดูตารางสายเต็ม
      </div>
      {lobbyMatches.map((m) => (
        <LobbyCard key={m.id} m={m} playersById={playersById} teamsById={teamsById} onGoTournament={onGoTournament} />
      ))}
    </div>
  );
};
