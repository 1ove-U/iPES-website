// components/Bracket.js
"use client";

import { useState, useMemo } from "react";
import { Avatar } from "./Avatar";
import { Pill, IconEdit, formatDate, VerifyCodeBadge } from "./ui";
import { colors, card, btnPrimary, btnGhost, inputStyle, labelStyle } from "../lib/theme";
import { roundLabel, decideWinner, totalRounds } from "../lib/bracket";

function nameOf(playersById, id) {
  if (!id) return null;
  return playersById.get(id)?.name || "ผู้เล่นที่ถูกลบ";
}

function deadlinePassed(iso) {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

function Countdown({ iso }) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return <span style={{ color: colors.red, fontWeight: 700 }}>หมดเวลาแล้ว</span>;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return <span style={{ color: colors.dim }}>เหลือ {days > 0 ? `${days} วัน ` : ""}{hours} ชม.</span>;
}

const RoundDeadlineRow = ({ isAdmin, deadline, onSave }) => {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState(deadline ? deadline.slice(0, 16) : "");
  if (!isAdmin && !deadline) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: colors.faint, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {deadline ? <><span>Deadline: {formatDate(deadline)}</span><Countdown iso={deadline} /></> : <span>ยังไม่ตั้ง Deadline</span>}
        {isAdmin && (
          <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", color: colors.cyan, cursor: "pointer", fontSize: 11, padding: 0 }}>
            {open ? "ปิด" : "ตั้ง/แก้ Deadline"}
          </button>
        )}
      </div>
      {open && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input type="datetime-local" value={val} onChange={(e) => setVal(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }} />
          <button onClick={() => { onSave(val ? new Date(val).toISOString() : null); setOpen(false); }} style={{ ...btnPrimary, padding: "6px 12px", fontSize: 12 }}>บันทึก</button>
        </div>
      )}
    </div>
  );
};

const MatchCard = ({ match, playersById, isAdmin, deadline, onOpenResult }) => {
  const expired = deadlinePassed(deadline) && match.status !== "completed" && match.status !== "bye";
  const nameA = nameOf(playersById, match.playerAId);
  const nameB = match.playerBId === null && match.status === "bye" ? "BYE" : nameOf(playersById, match.playerBId);
  const pending = match.status === "waiting_prev";
  const clickable = isAdmin && match.status !== "bye" && (match.status === "completed" || (!pending && match.playerAId && (match.playerBId || expired)));

  const Row = ({ id, name, score, isWinner }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", opacity: name ? 1 : 0.4 }}>
      {id ? <Avatar player={playersById.get(id) || { name }} size={24} radius={7} /> : <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,255,255,0.05)" }} />}
      <span style={{ flex: 1, fontSize: 13, fontWeight: isWinner ? 800 : 500, color: isWinner ? "#fff" : colors.muted, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name || "รอผลรอบก่อนหน้า"}
      </span>
      {score != null && <span style={{ fontWeight: 800, fontSize: 13, color: isWinner ? colors.cyan : colors.faint }}>{score}</span>}
    </div>
  );

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => clickable && onOpenResult(match)}
      onKeyDown={(e) => { if (clickable && (e.key === "Enter" || e.key === " ")) onOpenResult(match); }}
      style={{
        ...card, padding: "10px 12px", width: 220, flexShrink: 0, marginBottom: 14,
        cursor: clickable ? "pointer" : "default", textAlign: "left", fontFamily: "inherit",
        border: match.status === "completed" ? "1px solid rgba(74,222,128,0.3)" : card.border,
      }}
    >
      <Row id={match.playerAId} name={nameA} score={match.status === "completed" ? match.scoreA : null} isWinner={match.winnerId === match.playerAId} />
      <div style={{ borderTop: "1px solid rgba(167,139,250,0.08)" }} />
      <Row id={match.playerBId} name={nameB} score={match.status === "completed" ? match.scoreB : null} isWinner={match.winnerId === match.playerBId} />
      {(match.penA != null || match.penB != null) && (
        <div style={{ fontSize: 10, color: colors.faint, marginTop: 4 }}>จุดโทษ {match.penA}-{match.penB}</div>
      )}
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
        <div>
          {match.status === "bye" && <Pill tone="violet">BYE</Pill>}
          {match.status === "waiting_prev" && <Pill tone="silver">รอรอบก่อนหน้า</Pill>}
          {match.status === "waiting" && !expired && <Pill tone="cyan">{isAdmin ? "แตะเพื่อกรอกผล" : "รอผลการแข่งขัน"}</Pill>}
          {expired && <Pill tone="red">หมดเวลา{isAdmin ? " · แตะเพื่อเลือกผู้ชนะ" : ""}</Pill>}
          {match.status === "completed" && <Pill tone="green">จบการแข่งขัน</Pill>}
        </div>
        {match.status !== "bye" && match.playerAId && match.playerBId && (
          <VerifyCodeBadge code={match.verifyCode} />
        )}
      </div>
    </div>
  );
};

export const BracketView = ({ tournament, matches, playersById, isAdmin, onOpenResult, onSetDeadline }) => {
  const size = tournament.bracketSize;
  const rounds = useMemo(() => {
    const rCount = totalRounds(size);
    return [...Array(rCount).keys()].map((r) =>
      matches.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot)
    );
  }, [matches, size]);

  return (
    <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 8 }}>
      {rounds.map((roundMatches, r) => (
        <div key={r} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f0ff", marginBottom: 8 }}>{roundLabel(r, size)}</div>
          <RoundDeadlineRow isAdmin={isAdmin} deadline={tournament.deadlines?.[r]} onSave={(iso) => onSetDeadline(r, iso)} />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", flex: 1 }}>
            {roundMatches.map((m) => (
              <MatchCard key={m.id} match={m} playersById={playersById} isAdmin={isAdmin}
                deadline={tournament.deadlines?.[r]} onOpenResult={onOpenResult} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const MatchResultForm = ({ match, playersById, allowWinnerOnly, onSave, onClose }) => {
  const [scoreA, setScoreA] = useState(match.scoreA ?? 0);
  const [scoreB, setScoreB] = useState(match.scoreB ?? 0);
  const [penA, setPenA] = useState(match.penA ?? "");
  const [penB, setPenB] = useState(match.penB ?? "");
  const [pickedWinner, setPickedWinner] = useState(match.winnerId || "");
  const [mode, setMode] = useState(allowWinnerOnly && match.status !== "completed" ? "winner_only" : "score");

  const nameA = nameOf(playersById, match.playerAId);
  const nameB = nameOf(playersById, match.playerBId);
  const tied = Number(scoreA) === Number(scoreB);
  const wasCompleted = match.status === "completed";

  const submit = () => {
    if (mode === "winner_only") {
      if (!pickedWinner) { alert("กรุณาเลือกผู้ชนะ"); return; }
      onSave({ scoreA: null, scoreB: null, penA: null, penB: null, winnerId: pickedWinner });
      onClose();
      return;
    }
    const draftMatch = { ...match, scoreA: Number(scoreA), scoreB: Number(scoreB), penA: penA === "" ? null : Number(penA), penB: penB === "" ? null : Number(penB) };
    const winnerId = decideWinner(draftMatch);
    if (!winnerId) { alert(tied ? "สกอร์เสมอ กรุณากรอกผลจุดโทษเพื่อตัดสินผู้ชนะ" : "กรุณากรอกผลให้ครบ"); return; }
    onSave({ scoreA: draftMatch.scoreA, scoreB: draftMatch.scoreB, penA: draftMatch.penA, penB: draftMatch.penB, winnerId });
    onClose();
  };

  return (
    <div>
      {match.verifyCode && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: colors.faint }}>รหัสยืนยันคู่นี้:</span>
          <VerifyCodeBadge code={match.verifyCode} />
        </div>
      )}

      {wasCompleted && (
        <div style={{ ...card, marginBottom: 16, fontSize: 12, color: colors.bronze, lineHeight: 1.6 }}>
          ⚠ แมตช์นี้จบไปแล้ว การแก้ผลย้อนหลังจะล้างผลทุกรอบถัดไปที่อิงจากผลเดิม และคำนวณสถิติใหม่ทั้งหมดโดยอัตโนมัติ
        </div>
      )}

      {allowWinnerOnly && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode("score")} style={{ ...(mode === "score" ? btnPrimary : btnGhost), flex: 1, padding: "8px" }}>กรอกสกอร์</button>
          <button onClick={() => setMode("winner_only")} style={{ ...(mode === "winner_only" ? btnPrimary : btnGhost), flex: 1, padding: "8px" }}>เลือกผู้ชนะ (หมดเวลา)</button>
        </div>
      )}

      {mode === "winner_only" ? (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>ผู้ชนะ</label>
          {[match.playerAId, match.playerBId].map((id) => (
            <label key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", cursor: "pointer", color: colors.muted }}>
              <input type="radio" checked={pickedWinner === id} onChange={() => setPickedWinner(id)} />
              {nameOf(playersById, id)}
            </label>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>{nameA}</label>
              <input type="number" min={0} value={scoreA} onChange={(e) => setScoreA(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{nameB}</label>
              <input type="number" min={0} value={scoreB} onChange={(e) => setScoreB(e.target.value)} style={inputStyle} />
            </div>
          </div>
          {tied && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 6 }}>
              <div>
                <label style={labelStyle}>จุดโทษ {nameA}</label>
                <input type="number" min={0} value={penA} onChange={(e) => setPenA(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>จุดโทษ {nameB}</label>
                <input type="number" min={0} value={penB} onChange={(e) => setPenB(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}
          <div style={{ fontSize: 11, color: colors.faint, marginBottom: 10 }}>เสมอแล้วต้องตัดสินด้วยจุดโทษ (ไม่มีการเสมอในระบบแพ้คัดออก)</div>
        </>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
        <button onClick={submit} style={{ ...btnPrimary, flex: 2 }}>บันทึกผล</button>
      </div>
    </div>
  );
};
