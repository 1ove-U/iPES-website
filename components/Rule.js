// components/Rule.js
"use client";

import { useState } from "react";
import { IconEdit, SectionHeader, EmptyState } from "./ui";
import { colors, card, btnPrimary, btnGhost, inputStyle, labelStyle } from "../lib/theme";

export const RuleForm = ({ initial, onSave, onClose }) => {
  const [body, setBody] = useState(initial?.body || "");
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>เนื้อหากฎการแข่งขัน</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ ...inputStyle, resize: "vertical", minHeight: 320, lineHeight: 1.7, fontSize: 13.5 }}
          placeholder={"พิมพ์กฎการแข่งขันที่นี่ ขึ้นบรรทัดใหม่ได้ตามต้องการ เช่น\n\n1. รูปแบบการแข่งขัน...\n2. การนับผล...\n3. บทลงโทษ..."}
        />
      </div>
      <div style={{ fontSize: 11, color: colors.faint, marginBottom: 14, lineHeight: 1.6 }}>
        รองรับการขึ้นบรรทัดใหม่ตามที่พิมพ์ ไม่รองรับการจัดรูปแบบตัวหนา/หัวข้อพิเศษ — ใช้ตัวเลข/เครื่องหมายขีดเองได้ตามสะดวก
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
        <button
          onClick={() => { onSave({ body }); onClose(); }}
          style={{ ...btnPrimary, flex: 2 }}
        >บันทึก</button>
      </div>
    </div>
  );
};

export const RuleTab = ({ rule, isAdmin, onEdit }) => (
  <div className="fade-in">
    <SectionHeader title="กฎการแข่งขัน" subtitle="ข้อกำหนดและกฎกติกาการแข่งขัน iPES" />

    {isAdmin && (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }} onClick={onEdit}>
          <IconEdit />{rule?.body ? "แก้ไขกฎ" : "เพิ่มกฎการแข่งขัน"}
        </button>
      </div>
    )}

    {rule?.body ? (
      <div style={{ ...card, lineHeight: 1.9, fontSize: 14.5, color: colors.text, whiteSpace: "pre-wrap" }}>
        {rule.body}
      </div>
    ) : (
      <EmptyState text="ยังไม่มีการกำหนดกฎการแข่งขัน" />
    )}
  </div>
);
