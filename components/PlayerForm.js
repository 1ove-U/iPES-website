// components/PlayerForm.js
"use client";

import { useState } from "react";
import { inputStyle, labelStyle, btnGhost, btnPrimary } from "../lib/theme";
import { AvatarPicker, Avatar } from "./Avatar";

export const EMPTY_PLAYER_FORM = {
  name: "", club: "", champion: 0, runnerUp: 0, wins: 0, losses: 0, participated: 0,
  avatarId: null, avatarUrl: "", country: "", bio: "",
};

const textAreaStyle = { ...inputStyle, resize: "vertical", minHeight: 64, fontFamily: "inherit" };

export const PlayerForm = ({ initial, onSave, onClose, clubs = [] }) => {
  const [form, setForm] = useState({ ...EMPTY_PLAYER_FORM, ...(initial || {}) });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const field = (label, key, type = "number", span = 1) => (
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
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <Avatar player={form} size={56} radius={14} />
        <div style={{ color: "#7c77a8", fontSize: 12, lineHeight: 1.5 }}>
          เลือกการ์ดผู้เล่นด้านล่าง หรือวางลิงก์รูปของตัวเองในช่อง &quot;ลิงก์รูปโปรไฟล์&quot;
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>การ์ดผู้เล่น (Player Card)</label>
        <AvatarPicker value={form.avatarId} onChange={(id) => set("avatarId", id)} />
      </div>

      {field("ลิงก์รูปโปรไฟล์ (ไม่บังคับ)", "avatarUrl", "text", 2)}
      {field("ชื่อผู้เล่น", "name", "text", 2)}

      <div style={{ marginBottom: 14, gridColumn: "1 / -1" }}>
        <label style={labelStyle}>สังกัด / สโมสร์</label>
        <input
          type="text" list="club-suggestions" value={form.club}
          onChange={(e) => set("club", e.target.value)}
          style={inputStyle}
          placeholder="พิมพ์ชื่อสโมสร์ หรือเลือกจากรายการที่มีโลโก้แล้ว"
        />
        <datalist id="club-suggestions">
          {clubs.map((c) => <option key={c.id} value={c.name} />)}
        </datalist>
        {clubs.length > 0 && (
          <div style={{ fontSize: 11, color: "#6e6a96", marginTop: 6 }}>
            💡 พิมพ์ชื่อให้ตรงกับสโมสร์ที่มีโลโก้ไว้แล้ว เพื่อให้โลโก้ขึ้นในหน้าอันดับอัตโนมัติ
          </div>
        )}
      </div>

      {field("ประเทศ / เซิร์ฟเวอร์ (ไม่บังคับ)", "country", "text", 2)}

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>แนะนำตัว (ไม่บังคับ)</label>
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          style={textAreaStyle}
          placeholder="สไตล์การเล่น, ฟอร์เมชันประจำ ฯลฯ"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {field("แชมป์", "champion")}
        {field("รองแชมป์", "runnerUp")}
        {field("ชนะ", "wins")}
        {field("แพ้", "losses")}
        {field("เข้าร่วมแข่งขัน", "participated", "number", 2)}
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
