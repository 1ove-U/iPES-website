// components/TeamManager.js
"use client";

import { useState } from "react";
import { IconEdit, IconTrash, IconPlus, IconSearch, EmptyState } from "./ui";
import { Avatar } from "./Avatar";
import { colors, card, btnPrimary, btnGhost, btnDanger, inputStyle, labelStyle } from "../lib/theme";

export const TEAM_SIZES = [3, 4, 5];

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2) : (parts[0][0] + parts[1][0]);
}

function hashColor(name) {
  const palette = ["#22d3ee", "#a78bfa", "#facc15", "#4ade80", "#f472b6", "#fb923c"];
  let h = 0;
  for (const ch of name || "") h = (h * 31 + ch.charCodeAt(0)) % 997;
  return palette[h % palette.length];
}

// Team crest display — same fallback pattern as ClubLogo/Avatar: shows the
// uploaded logo if there is one, otherwise a colored initials badge so a
// team never looks broken before its logo gets uploaded.
export const TeamLogo = ({ name, logoUrl, size = 40, radius = 10 }) => {
  const wrap = {
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
  };
  if (logoUrl) {
    return (
      <div style={{ ...wrap, background: "#1a1640" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name || "team"} width={size} height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  const color = hashColor(name);
  return (
    <div style={{ ...wrap, background: "rgba(255,255,255,0.06)", border: `1px solid ${color}55` }}>
      <span style={{ color, fontWeight: 800, fontSize: size * 0.32 }}>{initialsOf(name)}</span>
    </div>
  );
};

// Searchable multi-select for picking exactly `size` real players from the
// database — same restriction as the solo bracket's PlayerMultiSelect (no
// typing names by hand), capped at the team's squad size.
const MemberPicker = ({ players, size, value, onChange }) => {
  const [q, setQ] = useState("");
  const filtered = players.filter((p) =>
    !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || (p.club || "").toLowerCase().includes(q.toLowerCase())
  );
  const toggle = (id) => {
    if (value.includes(id)) { onChange(value.filter((v) => v !== id)); return; }
    if (value.length >= size) return; // squad full
    onChange([...value, id]);
  };

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 12, top: 11, color: colors.faint }}><IconSearch /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาผู้เล่น/สโมสร์..." style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>
      <div style={{ fontSize: 12, color: value.length === size ? colors.green : colors.dim, marginBottom: 8 }}>
        เลือกแล้ว {value.length} / {size} คน
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 16, color: colors.faint, fontSize: 13, textAlign: "center" }}>ไม่พบผู้เล่น</div>
        ) : filtered.map((p) => {
          const checked = value.includes(p.id);
          const full = value.length >= size && !checked;
          return (
            <label key={p.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              cursor: full ? "default" : "pointer", opacity: full ? 0.4 : 1,
              borderBottom: "1px solid rgba(167,139,250,0.06)", background: checked ? "rgba(34,211,238,0.06)" : "transparent",
            }}>
              <input type="checkbox" checked={checked} disabled={full} onChange={() => toggle(p.id)} />
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

export const TeamForm = ({ initial, players, onSave, onClose }) => {
  const [name, setName] = useState(initial?.name || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl || "");
  const [size, setSize] = useState(initial?.size || 3);
  const [memberIds, setMemberIds] = useState(initial?.memberIds || []);

  const changeSize = (s) => { setSize(s); setMemberIds((ids) => ids.slice(0, s)); };
  const valid = name.trim() && memberIds.length === size;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <TeamLogo name={name} logoUrl={logoUrl} size={56} radius={14} />
        <div style={{ color: colors.faint, fontSize: 12, lineHeight: 1.5 }}>
          วางลิงก์รูปโลโก้ทีม (เช่นจาก Imgur) — ถ้ายังไม่มีลิงก์ ระบบจะแสดงตัวอักษรย่อแทนไปก่อน
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ชื่อทีม</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle}
          placeholder="เช่น Thunder Squad" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ลิงก์รูปโลโก้ทีม (ไม่บังคับ)</label>
        <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={inputStyle}
          placeholder="https://..." />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ขนาดทีม</label>
        <div style={{ display: "flex", gap: 8 }}>
          {TEAM_SIZES.map((s) => (
            <button key={s} onClick={() => changeSize(s)} style={{
              ...(size === s ? btnPrimary : btnGhost), flex: 1, padding: "8px", fontSize: 13,
            }}>{s} v {s}</button>
          ))}
        </div>
        {initial && initial.size !== size && (
          <div style={{ fontSize: 11, color: colors.bronze, marginTop: 6 }}>
            ⚠ เปลี่ยนขนาดทีมจะไม่กระทบทัวร์นาเมนต์ที่เคยจบไปแล้ว แต่ทีมนี้จะใช้แข่งทัวร์นาเมนต์ทีมขนาดอื่นไม่ได้จนกว่าจะเลือกสมาชิกให้ครบขนาดใหม่
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>สมาชิกทีม (ต้องเลือกให้ครบ {size} คน)</label>
        <MemberPicker players={players} size={size} value={memberIds} onChange={setMemberIds} />
      </div>

      <div style={{ fontSize: 11, color: colors.faint, marginBottom: 14, lineHeight: 1.6 }}>
        💡 ผลแข่งของทีม (แชมป์/รองแชมป์/ชนะ/แพ้/ยิงประตู) จะนับรวมเข้าสถิติส่วนตัวของสมาชิกทุกคนในทีมด้วยอัตโนมัติ
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
        <button
          onClick={() => { if (valid) { onSave({ name: name.trim(), logoUrl: logoUrl.trim(), size, memberIds }); onClose(); } }}
          style={{ ...btnPrimary, flex: 2, opacity: valid ? 1 : 0.5 }}
          disabled={!valid}
        >บันทึก</button>
      </div>
    </div>
  );
};

export const TeamManagerList = ({ teams, playersById, onAdd, onEdit, onDeleteRequest, onClose }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: colors.faint }}>{teams.length} ทีมในระบบ</div>
      <button onClick={onAdd} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13 }}>
        <IconPlus />สร้างทีม
      </button>
    </div>

    {teams.length === 0 ? (
      <EmptyState text="ยังไม่มีทีมในระบบ กดสร้างทีมเพื่อเริ่มจัดทีมสำหรับทัวร์นาเมนต์แบบทีม" />
    ) : (
      teams.map((t) => (
        <div key={t.id} style={{ ...card, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <TeamLogo name={t.name} logoUrl={t.logoUrl} size={40} radius={10} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{t.name}</div>
              <div style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>{t.size} v {t.size} · {(t.memberIds || []).length} สมาชิก</div>
            </div>
            <button onClick={() => onEdit(t)} style={{ ...btnGhost, padding: "6px 10px", display: "flex" }}><IconEdit /></button>
            <button onClick={() => onDeleteRequest(t)} style={{ ...btnDanger, padding: "6px 10px", display: "flex" }}><IconTrash /></button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(t.memberIds || []).map((id) => {
              const p = playersById.get(id);
              return p ? (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "3px 8px 3px 3px" }}>
                  <Avatar player={p} size={18} radius={5} />
                  <span style={{ fontSize: 11, color: colors.muted }}>{p.name}</span>
                </div>
              ) : (
                <span key={id} style={{ fontSize: 11, color: colors.faint }}>ผู้เล่นที่ถูกลบ</span>
              );
            })}
          </div>
        </div>
      ))
    )}

    <button onClick={onClose} style={{ ...btnGhost, width: "100%", marginTop: 8 }}>ปิด</button>
  </div>
);
