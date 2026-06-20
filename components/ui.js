// components/ui.js
"use client";

import { useState } from "react";
import { colors, tones, card, sectionHeaderWrap, btnGhost, btnDanger } from "../lib/theme";

// ─── Icons ─────────────────────────────────────────────────────────────────
export const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
export const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
export const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);
export const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
);
export const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
export const IconUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l8 10H4z" /></svg>
);
export const IconDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20L4 10h16z" /></svg>
);
export const IconTrophy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2h10v2h3a1 1 0 011 1v2a4 4 0 01-4 4h-.2A6 6 0 0113 15.9V18h3v2H8v-2h3v-2.1A6 6 0 017.2 11H7a4 4 0 01-4-4V5a1 1 0 011-1h3V2zm0 4H5v1a2 2 0 002 2V6zm10 0v3a2 2 0 002-2V6h-2z" />
  </svg>
);
export const IconNews = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h13a2 2 0 012 2v13a1 1 0 01-1 1H6a2 2 0 01-2-2V4z" />
    <path d="M8 8h7M8 12h7M8 16h4" />
  </svg>
);
export const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a6 6 0 016 6c0 4.2-4 7-6 12-2-5-6-7.8-6-12a6 6 0 016-6z" />
  </svg>
);

export const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M4 17v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
  </svg>
);
export const IconSwap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l-3 3M17 7l3 3" />
  </svg>
);
export const IconCopy = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
  </svg>
);
export const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// ─── Sparkline / LineChart ───────────────────────────────────────────────
// Minimal dependency-free SVG line chart so Win Rate Trend / Ranking
// History don't need to pull in a charting library (keeps the bundle and
// build fast). `points` is an array of numbers; nulls/undefined are
// allowed and simply skipped (gaps in the line).
export const Sparkline = ({ points, width = 280, height = 64, color = colors.cyan, fillBaseline = null }) => {
  const valid = points.map((v, i) => ({ v, i })).filter((p) => p.v != null);
  if (valid.length < 2) {
    return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: colors.faint, fontSize: 12 }}>ยังไม่มีข้อมูลพอแสดงกราฟ</div>;
  }
  const xs = valid.map((p) => p.i);
  const ys = valid.map((p) => p.v);
  const minX = Math.min(...xs), maxX = Math.max(...xs) || 1;
  let minY = fillBaseline != null ? Math.min(fillBaseline, ...ys) : Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const pad = 6;
  const sx = (i) => pad + ((i - minX) / (maxX - minX || 1)) * (width - pad * 2);
  const sy = (v) => height - pad - ((v - minY) / (maxY - minY || 1)) * (height - pad * 2);
  const d = valid.map((p, idx) => `${idx === 0 ? "M" : "L"}${sx(p.i).toFixed(1)},${sy(p.v).toFixed(1)}`).join(" ");
  const last = valid[valid.length - 1];
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx(last.i)} cy={sy(last.v)} r="3.5" fill={color} />
    </svg>
  );
};


// Logo: uses the iPES brand logo image (public/logo.png). Height is fixed
// to `size`; width is automatic so the logo's real aspect ratio is kept
// (the artwork is a wide wordmark, not a square icon) — never stretches it.
export const Logo = ({ size = 40 }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="/logo.png"
    alt="iPES"
    style={{ height: size, width: "auto", display: "block", objectFit: "contain" }}
  />
);

// ─── Pill ──────────────────────────────────────────────────────────────────
export const Pill = ({ tone, children }) => {
  const c = tones[tone] || tones.cyan;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
};

// ─── Movement Pill (Ranking Movement indicator) ─────────────────────────────
export const MovementPill = ({ movement }) => {
  if (!movement || movement.direction === "new") return <Pill tone="cyan">ใหม่</Pill>;
  if (movement.direction === "up")
    return <Pill tone="green"><span style={{ display: "flex", alignItems: "center", gap: 3 }}><IconUp />{movement.delta}</span></Pill>;
  if (movement.direction === "down")
    return <Pill tone="red"><span style={{ display: "flex", alignItems: "center", gap: 3 }}><IconDown />{movement.delta}</span></Pill>;
  return <span style={{ color: colors.faint, fontSize: 13 }}>–</span>;
};

// ─── Match Verification Code badge ──────────────────────────────────────
// Shows the unique per-match code (e.g. "IPES-7K2X") generated the instant
// the bracket was drawn, with a one-tap copy button. Visible to everyone —
// both players show the same code on their own screens to confirm they've
// found the right fixture before they play, no login required to view it.
export const VerifyCodeBadge = ({ code, size = "sm" }) => {
  const [copied, setCopied] = useState(false);
  if (!code) return null;

  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // clipboard API unavailable (e.g. insecure context) — still flash
      // feedback so the tap doesn't feel broken, code is on-screen to copy by hand
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const big = size === "lg";
  return (
    <button
      onClick={copy}
      title="แตะเพื่อคัดลอกรหัสยืนยันคู่แข่งขัน"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.28)",
        borderRadius: 7, padding: big ? "7px 12px" : "4px 8px", cursor: "pointer",
        fontFamily: "ui-monospace, monospace", letterSpacing: "0.04em",
        fontSize: big ? 15 : 11.5, fontWeight: 700, color: copied ? colors.green : colors.cyan,
      }}
    >
      {code}
      <span style={{ display: "flex", opacity: 0.85 }}>{copied ? <IconCheck /> : <IconCopy />}</span>
    </button>
  );
};


export const Modal = ({ title, onClose, children, maxWidth = 460 }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(5,4,18,0.78)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    backdropFilter: "blur(6px)"
  }} onClick={onClose}>
    <div style={{
      background: "#0e0c24", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 16,
      padding: 28, width: "100%", maxWidth, boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      maxHeight: "88vh", overflowY: "auto",
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <span style={{ color: "#f1f0ff", fontWeight: 700, fontSize: 17 }}>{title}</span>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8,
          color: "#9b96c4", cursor: "pointer", padding: "6px 8px", display: "flex"
        }}><IconClose /></button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Generic confirm-delete modal, reused for players / tournaments / news ──
export const ConfirmDeleteModal = ({ title, message, onCancel, onConfirm }) => (
  <Modal title={title} onClose={onCancel}>
    <div style={{ color: "#9b96c4", marginBottom: 24, lineHeight: 1.6 }}>{message}</div>
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={onCancel} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
      <button onClick={onConfirm} style={{ ...btnDanger, flex: 1 }}>ลบออก</button>
    </div>
  </Modal>
);

// ─── Section header, used by Tournament Archive / Hall of Fame / News tabs ──
export const SectionHeader = ({ title, subtitle }) => (
  <div style={sectionHeaderWrap}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Logo size={48} /></div>
    <div style={{ fontWeight: 800, fontSize: 24, color: "#fff", marginBottom: 6 }}>{title}</div>
    {subtitle && <div style={{ color: colors.dim, fontSize: 14 }}>{subtitle}</div>}
  </div>
);

export const EmptyState = ({ text }) => (
  <div style={{ ...card, textAlign: "center", color: colors.faint, fontSize: 13, padding: "36px 20px" }}>
    {text}
  </div>
);

export const Spinner = ({ text = "กำลังโหลดข้อมูล..." }) => (
  <div style={{ textAlign: "center", color: colors.dim, padding: "40px 0" }}>{text}</div>
);

// Format a Firestore Timestamp, JS Date, or date-string into Thai-friendly text.
export function formatDate(value) {
  if (!value) return "";
  let d;
  if (typeof value === "string") d = new Date(value);
  else if (value.toDate) d = value.toDate();
  else d = new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "";
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}
