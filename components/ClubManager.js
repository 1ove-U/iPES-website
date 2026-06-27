// components/ClubManager.js
"use client";

import { useState } from "react";
import { IconEdit, IconTrash, IconPlus, EmptyState } from "./ui";
import { colors, card, btnPrimary, btnGhost, btnDanger, inputStyle, labelStyle } from "../lib/theme";

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

// Club crest display: shows the uploaded logo image if the club has one,
// otherwise falls back to a colored initials badge (same pattern as
// Avatar.js for players) so club rows never look broken while logos are
// still being added one by one.
export const ClubLogo = ({ name, logoUrl, size = 40, radius = 10 }) => {
  const wrap = {
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
  };
  if (logoUrl) {
    return (
      <div style={{ ...wrap, background: "#1a1640" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={name || "club"} width={size} height={size}
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

// Builds the CSS gradient string for a club's two-color theme. Falls back
// to a neutral violet gradient (matching the site's default accent) when a
// club has no custom colors set, so banners never look broken.
export function clubBannerGradient(club, angle = 135) {
  const c1 = club?.colorPrimary || "#a78bfa";
  const c2 = club?.colorSecondary || "#22d3ee";
  return `linear-gradient(${angle}deg, ${c1}, ${c2})`;
}

export const ClubForm = ({ initial, onSave, onClose }) => {
  const [name, setName] = useState(initial?.name || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl || "");
  const [colorPrimary, setColorPrimary] = useState(initial?.colorPrimary || "#a78bfa");
  const [colorSecondary, setColorSecondary] = useState(initial?.colorSecondary || "#22d3ee");
  const [description, setDescription] = useState(initial?.description || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [facebookUrl, setFacebookUrl] = useState(initial?.facebookUrl || "");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <ClubLogo name={name} logoUrl={logoUrl} size={56} radius={14} />
        <div style={{ color: colors.faint, fontSize: 12, lineHeight: 1.5 }}>
          วางลิงก์รูปโลโก้สโมสร์ (เช่นจาก Imgur หรือเว็บฝากรูปอื่นๆ) — ถ้ายังไม่มีลิงก์ ระบบจะแสดงตัวอักษรย่อแทนไปก่อน
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ชื่อสโมสร์</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle}
          placeholder="เช่น Manchester United" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ลิงก์รูปโลโก้ (ไม่บังคับ)</label>
        <input type="text" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={inputStyle}
          placeholder="https://..." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>เมือง/ประเทศ (ไม่บังคับ)</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle}
            placeholder="เช่น กรุงเทพฯ" />
        </div>
        <div>
          <label style={labelStyle}>ลิงก์ Facebook (ไม่บังคับ)</label>
          <input type="text" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} style={inputStyle}
            placeholder="https://facebook.com/..." />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ประวัติ/คำอธิบายสโมสร์ (ไม่บังคับ)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          placeholder="เล่าเรื่องราว ที่มา หรือจุดเด่นของสโมสร์นี้..." />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>สีประจำสโมสร์ (ไม่บังคับ)</label>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="color" value={colorPrimary} onChange={(e) => setColorPrimary(e.target.value)}
              style={{ width: 44, height: 36, borderRadius: 8, border: "1px solid rgba(167,139,250,0.25)", background: "none", padding: 2 }} />
            <span style={{ fontSize: 11, color: colors.faint }}>สีหลัก</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="color" value={colorSecondary} onChange={(e) => setColorSecondary(e.target.value)}
              style={{ width: 44, height: 36, borderRadius: 8, border: "1px solid rgba(167,139,250,0.25)", background: "none", padding: 2 }} />
            <span style={{ fontSize: 11, color: colors.faint }}>สีรอง</span>
          </div>
          <div style={{
            flex: 1, height: 36, borderRadius: 8,
            background: `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary})`,
          }} />
        </div>
        <div style={{ fontSize: 11, color: colors.faint, marginTop: 6 }}>
          สีนี้จะใช้เป็นแบนเนอร์พื้นหลังการ์ดผู้เล่นในสังกัด และพื้นหลังหน้าสโมสร์
        </div>
      </div>

      <div style={{ fontSize: 11, color: colors.faint, marginBottom: 14, lineHeight: 1.6 }}>
        💡 ชื่อสโมสร์นี้ต้องตรงกับที่กรอกไว้ในช่อง &quot;สังกัด / สโมสร&quot; ของผู้เล่น (ไม่สนตัวพิมพ์ใหญ่-เล็ก)
        ถึงจะขึ้นโลโก้ในหน้าอันดับสโมสร์ให้อัตโนมัติ
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
        <button
          onClick={() => { if (name.trim()) { onSave({ name: name.trim(), logoUrl: logoUrl.trim(), colorPrimary, colorSecondary, description: description.trim(), location: location.trim(), facebookUrl: facebookUrl.trim() }); onClose(); } }}
          style={{ ...btnPrimary, flex: 2 }}
        >บันทึก</button>
      </div>
    </div>
  );
};

export const ClubManagerList = ({ clubs, onAdd, onEdit, onDeleteRequest, onClose }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: colors.faint }}>{clubs.length} สโมสร์ที่มีโลโก้ในระบบ</div>
      <button onClick={onAdd} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13 }}>
        <IconPlus />เพิ่มสโมสร์
      </button>
    </div>

    {clubs.length === 0 ? (
      <EmptyState text="ยังไม่มีสโมสร์ที่ตั้งโลโก้ไว้ กดเพิ่มสโมสร์เพื่อเริ่มอัพโลโก้" />
    ) : (
      clubs.map((c) => (
        <div key={c.id} style={{ ...card, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <ClubLogo name={c.name} logoUrl={c.logoUrl} size={40} radius={10} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{c.name}</div>
            {!c.logoUrl && <div style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>ยังไม่มีลิงก์โลโก้</div>}
          </div>
          <button onClick={() => onEdit(c)} style={{ ...btnGhost, padding: "6px 10px", display: "flex" }}><IconEdit /></button>
          <button onClick={() => onDeleteRequest(c)} style={{ ...btnDanger, padding: "6px 10px", display: "flex" }}><IconTrash /></button>
        </div>
      ))
    )}

    <button onClick={onClose} style={{ ...btnGhost, width: "100%", marginTop: 8 }}>ปิด</button>
  </div>
);
