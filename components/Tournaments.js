// components/Tournaments.js
"use client";

import { useState, useMemo } from "react";
import {
  IconPlus, IconEdit, IconTrash, IconTrophy, IconSearch, Pill, EmptyState, SectionHeader, formatDate,
} from "./ui";
import { colors, card, btnPrimary, btnGhost, iconBtnCyan, iconBtnRed, inputStyle, labelStyle } from "../lib/theme";
import { Avatar } from "./Avatar";
import { BracketView } from "./Bracket";
import { BRACKET_SIZES } from "../lib/bracket";

// ─── Legacy / quick manual entry — for results from before the bracket
// system existed, or for recording an outside tournament by hand. Bracket
// tournaments fill champion/runnerUp themselves once the final is played,
// so this form is never needed for those. ──────────────────────────────────
export const EMPTY_TOURNAMENT_FORM = {
  name: "", date: "", season: "", champion: "", runnerUp: "", third: "", participants: 0, notes: "",
};

export const TournamentForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({ ...EMPTY_TOURNAMENT_FORM, ...(initial || {}) });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const field = (label, key, type = "text", span = 1) => (
    <div style={{ marginBottom: 14, gridColumn: span === 2 ? "1 / -1" : "auto" }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        value={form[key]}
        onChange={(e) => set(key, type === "number" ? Number(e.target.value) : e.target.value)}
        style={inputStyle}
      />
    </div>
  );

  return (
    <div>
      <div style={{ fontSize: 12, color: colors.faint, marginBottom: 16, lineHeight: 1.6 }}>
        ใช้สำหรับบันทึกผลย้อนหลัง หรือทัวร์นาเมนต์ที่ไม่ได้แข่งผ่านระบบจับสายของเว็บ — กรอกชื่อแชมป์/รองแชมป์เองได้
      </div>
      {field("ชื่อทัวร์นาเมนต์", "name", "text", 2)}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {field("วันที่จัด", "date", "date")}
        {field("ฤดูกาล (ไม่บังคับ)", "season", "text")}
      </div>
      {field("แชมป์", "champion")}
      {field("รองแชมป์", "runnerUp")}
      {field("อันดับ 3 (ไม่บังคับ)", "third")}
      {field("จำนวนผู้เข้าร่วม", "participants", "number")}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>บันทึกเพิ่มเติม (ไม่บังคับ)</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          style={{ ...inputStyle, resize: "vertical", minHeight: 64 }}
          placeholder="รูปแบบการแข่งขัน, สปอนเซอร์ ฯลฯ"
        />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
        <button
          onClick={() => { if (form.name.trim()) { onSave(form); onClose(); } }}
          style={{ ...btnPrimary, flex: 2 }}
        >บันทึก</button>
      </div>
    </div>
  );
};

// ─── Searchable multi-select for picking REAL players from the database
// only — the spec is explicit that admins must not be able to type names
// in by hand when building a live bracket. ─────────────────────────────────
const PlayerMultiSelect = ({ players, value, onChange }) => {
  const [q, setQ] = useState("");
  const filtered = players.filter((p) =>
    !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || (p.club || "").toLowerCase().includes(q.toLowerCase())
  );
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 12, top: 11, color: colors.faint }}><IconSearch /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาผู้เล่น/สโมสร..." style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>
      <div style={{ fontSize: 12, color: colors.dim, marginBottom: 8 }}>เลือกแล้ว {value.length} คน</div>
      <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 16, color: colors.faint, fontSize: 13, textAlign: "center" }}>ไม่พบผู้เล่น</div>
        ) : filtered.map((p) => {
          const checked = value.includes(p.id);
          return (
            <label key={p.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer",
              borderBottom: "1px solid rgba(167,139,250,0.06)", background: checked ? "rgba(34,211,238,0.06)" : "transparent",
            }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(p.id)} />
              <Avatar player={p} size={26} radius={8} />
              <span style={{ fontSize: 13, color: "#f1f0ff", flex: 1, minWidth: 0 }}>{p.name}</span>
              {p.club && <span style={{ fontSize: 11, color: colors.faint }}>{p.club}</span>}
            </label>
          );
        })}
      </div>
    </div>
  );
};

// ─── New live-bracket tournament creation: pick real players + bracket
// size, random draw, auto BYE fill. ─────────────────────────────────────────
export const BracketCreateForm = ({ players, onCreate, onClose }) => {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [season, setSeason] = useState("");
  const [size, setSize] = useState(8);
  const [playerIds, setPlayerIds] = useState([]);
  const [busy, setBusy] = useState(false);

  const minNeeded = Math.ceil(size / 2);
  const valid = name.trim() && playerIds.length >= minNeeded && playerIds.length <= size;

  const submit = async () => {
    setBusy(true);
    try {
      await onCreate({ name: name.trim(), date, season, bracketSize: size, playerIds });
      onClose();
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ชื่อทัวร์นาเมนต์</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>วันที่จัด</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>ฤดูกาล (ไม่บังคับ)</label>
          <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="เช่น Season 2026" style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ขนาดสาย</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BRACKET_SIZES.map((s) => (
            <button key={s} onClick={() => setSize(s)} style={{
              ...(size === s ? btnPrimary : btnGhost), padding: "8px 16px", fontSize: 13,
            }}>{s} ทีม</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>เลือกผู้เล่นจากฐานข้อมูล (ต้องมีอย่างน้อย {minNeeded} คน, ไม่เกิน {size} คน)</label>
        <PlayerMultiSelect players={players} value={playerIds} onChange={setPlayerIds} />
      </div>
      <div style={{ fontSize: 11, color: colors.faint, marginBottom: 14, lineHeight: 1.6 }}>
        ระบบจะจับสายแบบสุ่มเท่านั้น (ไม่มี Seed) หากผู้เล่นไม่ครบขนาดสาย ช่องที่เหลือจะเป็น BYE และผ่านเข้ารอบถัดไปอัตโนมัติ
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
        <button disabled={!valid || busy} onClick={submit} style={{ ...btnPrimary, flex: 2, opacity: valid && !busy ? 1 : 0.5 }}>
          {busy ? "กำลังจับสาย..." : "สร้างและจับสาย"}
        </button>
      </div>
    </div>
  );
};

// ─── Combined "เพิ่มทัวร์นาเมนต์" modal content: choose live bracket
// (default, recommended) or legacy manual entry. ───────────────────────────
export const TournamentCreateChooser = ({ players, onCreateBracket, onCreateLegacy, onClose }) => {
  const [mode, setMode] = useState("bracket");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setMode("bracket")} style={{ ...(mode === "bracket" ? btnPrimary : btnGhost), flex: 1, padding: "10px" }}>สร้างสายแข่งใหม่</button>
        <button onClick={() => setMode("legacy")} style={{ ...(mode === "legacy" ? btnPrimary : btnGhost), flex: 1, padding: "10px" }}>บันทึกผลย้อนหลัง</button>
      </div>
      {mode === "bracket"
        ? <BracketCreateForm players={players} onCreate={onCreateBracket} onClose={onClose} />
        : <TournamentForm onSave={onCreateLegacy} onClose={onClose} />}
    </div>
  );
};

const statusPill = (t) => {
  if (!t.bracketSize) return null;
  if (t.status === "draft") return <Pill tone="silver">Draft</Pill>;
  if (t.status === "active") return <Pill tone="cyan">กำลังแข่งขัน</Pill>;
  if (t.status === "completed") return <Pill tone="green">จบแล้ว</Pill>;
  return null;
};

const TournamentCard = ({ t, isAdmin, isOpen, onToggle, onEdit, onDeleteRequest }) => (
  <div style={{ ...card, marginBottom: isOpen ? 0 : 12, borderRadius: isOpen ? "14px 14px 0 0" : 14 }}>
    <button onClick={onToggle} style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer", color: "inherit", fontFamily: "inherit", padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
          <span style={{ color: colors.gold, marginTop: 2, flexShrink: 0 }}><IconTrophy /></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{t.name}</div>
            <div style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>
              {formatDate(t.date)}{t.season ? ` · ${t.season}` : ""}{t.participants ? ` · ${t.participants} ผู้เข้าร่วม` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          {statusPill(t)}
          {isAdmin && !t.bracketSize && (
            <>
              <span onClick={(e) => { e.stopPropagation(); onEdit(t); }} style={iconBtnCyan}><IconEdit /></span>
              <span onClick={(e) => { e.stopPropagation(); onDeleteRequest(t); }} style={iconBtnRed}><IconTrash /></span>
            </>
          )}
          {isAdmin && t.bracketSize && (
            <span onClick={(e) => { e.stopPropagation(); onDeleteRequest(t); }} style={iconBtnRed}><IconTrash /></span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {t.champion && <Pill tone="gold">🏆 {t.champion}</Pill>}
        {t.runnerUp && <Pill tone="silver">🥈 {t.runnerUp}</Pill>}
        {t.third && <Pill tone="violet">🥉 {t.third}</Pill>}
        {t.bracketSize && <Pill tone="cyan">{isOpen ? "ซ่อนสาย ▲" : "ดูสาย ▼"}</Pill>}
      </div>
      {t.notes && <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6, marginTop: 10 }}>{t.notes}</div>}
    </button>
  </div>
);

export const TournamentArchiveTab = ({
  tournaments, matchesByTournament, playersById, isAdmin,
  onAdd, onEdit, onDeleteRequest, onOpenResult, onSetDeadline,
}) => {
  const [expanded, setExpanded] = useState(null);
  const [season, setSeason] = useState("all");

  const seasons = useMemo(() => {
    const set = new Set(tournaments.map((t) => t.season).filter(Boolean));
    return [...set].sort();
  }, [tournaments]);

  const filtered = tournaments.filter((t) => season === "all" || t.season === season);
  const sorted = [...filtered].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="fade-in">
      <SectionHeader title="คลังทัวร์นาเมนต์" subtitle="ประวัติการแข่งขัน iPES ทุกรายการที่ผ่านมา" />

      {seasons.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => setSeason("all")} style={{ ...(season === "all" ? btnPrimary : btnGhost), padding: "6px 14px", fontSize: 12 }}>ทั้งหมด</button>
          {seasons.map((s) => (
            <button key={s} onClick={() => setSeason(s)} style={{ ...(season === s ? btnPrimary : btnGhost), padding: "6px 14px", fontSize: 12 }}>{s}</button>
          ))}
        </div>
      )}

      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }} onClick={onAdd}>
            <IconPlus />เพิ่มทัวร์นาเมนต์
          </button>
        </div>
      )}
      {sorted.length === 0 ? (
        <EmptyState text="ยังไม่มีทัวร์นาเมนต์ในคลังข้อมูล" />
      ) : (
        sorted.map((t) => {
          const isOpen = expanded === t.id;
          return (
            <div key={t.id} style={{ marginBottom: 12 }}>
              <TournamentCard t={t} isAdmin={isAdmin} isOpen={isOpen}
                onToggle={() => setExpanded(isOpen ? null : (t.bracketSize ? t.id : null))}
                onEdit={onEdit} onDeleteRequest={onDeleteRequest} />
              {isOpen && t.bracketSize && (
                <div style={{ ...card, borderRadius: "0 0 14px 14px", borderTop: "none", overflowX: "auto" }}>
                  <BracketView
                    tournament={t}
                    matches={matchesByTournament.get(t.id) || []}
                    playersById={playersById}
                    isAdmin={isAdmin}
                    onOpenResult={(m) => onOpenResult(m, t)}
                    onSetDeadline={(roundIndex, iso) => onSetDeadline(t, roundIndex, iso)}
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
