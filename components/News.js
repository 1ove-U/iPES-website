// components/News.js
"use client";

import { useState } from "react";
import { IconPlus, IconEdit, IconTrash, IconPin, Pill, EmptyState, SectionHeader, formatDate } from "./ui";
import { colors, card, btnPrimary, btnGhost, iconBtnCyan, iconBtnRed, inputStyle, labelStyle } from "../lib/theme";

export const EMPTY_NEWS_FORM = { title: "", body: "", pinned: false };

export const NewsForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({ ...EMPTY_NEWS_FORM, ...(initial || {}) });
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>หัวข้อข่าว</label>
        <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>เนื้อหา</label>
        <textarea
          value={form.body}
          onChange={(e) => set("body", e.target.value)}
          style={{ ...inputStyle, resize: "vertical", minHeight: 110 }}
        />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: colors.muted, fontSize: 13, cursor: "pointer" }}>
        <input type="checkbox" checked={form.pinned} onChange={(e) => set("pinned", e.target.checked)} />
        ปักหมุดไว้บนสุด
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
        <button
          onClick={() => { if (form.title.trim()) { onSave(form); onClose(); } }}
          style={{ ...btnPrimary, flex: 2 }}
        >บันทึก</button>
      </div>
    </div>
  );
};

const NewsCard = ({ n, isAdmin, onEdit, onDeleteRequest }) => (
  <div style={{
    ...card, marginBottom: 12,
    border: n.pinned ? "1px solid rgba(250,204,21,0.35)" : card.border,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {n.pinned && <span style={{ color: colors.gold, flexShrink: 0 }}><IconPin /></span>}
        <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{n.title}</div>
      </div>
      {isAdmin && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(n)} style={iconBtnCyan}><IconEdit /></button>
          <button onClick={() => onDeleteRequest(n)} style={iconBtnRed}><IconTrash /></button>
        </div>
      )}
    </div>
    <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 10 }}>{n.body}</div>
    <div style={{ fontSize: 11, color: colors.faint }}>
      {n.author ? `โดย ${n.author} · ` : ""}{formatDate(n.createdAt)}
    </div>
  </div>
);

export const NewsTab = ({ news, isAdmin, onAdd, onEdit, onDeleteRequest }) => {
  const sorted = [...news].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    const ad = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const bd = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return bd - ad;
  });
  return (
    <div className="fade-in">
      <SectionHeader title="ข่าวสารจาก Admin" subtitle="ประกาศ อัปเดต และเรื่องที่ผู้เล่นควรรู้" />
      {isAdmin && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }} onClick={onAdd}>
            <IconPlus />ประกาศข่าว
          </button>
        </div>
      )}
      {sorted.length === 0 ? (
        <EmptyState text="ยังไม่มีประกาศข่าวจาก Admin" />
      ) : (
        sorted.map((n) => <NewsCard key={n.id} n={n} isAdmin={isAdmin} onEdit={onEdit} onDeleteRequest={onDeleteRequest} />)
      )}
    </div>
  );
};

// Returns the single news item to surface on the Leaderboard banner: the
// most recently pinned item, else the most recent item overall.
export function pickLatestNews(news) {
  if (!news || news.length === 0) return null;
  const toDate = (n) => (n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt || 0));
  const pinned = news.filter((n) => n.pinned).sort((a, b) => toDate(b) - toDate(a));
  if (pinned.length > 0) return pinned[0];
  return [...news].sort((a, b) => toDate(b) - toDate(a))[0];
}
