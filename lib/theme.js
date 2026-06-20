// lib/theme.js
// Shared design tokens so every tab/component uses the same brand colors
// and style fragments instead of re-declaring hex codes everywhere.

export const colors = {
  bg: "#07051a",
  text: "#f1f0ff",
  muted: "#9b96c4",
  dim: "#7c77a8",
  faint: "#6e6a96",
  cyan: "#22d3ee",
  violet: "#a78bfa",
  violetLight: "#c4b5fd",
  gold: "#facc15",
  silver: "#cbd5e1",
  bronze: "#fb923c",
  green: "#4ade80",
  red: "#f87171",
  panelBorder: "rgba(167,139,250,0.15)",
  panelBg: "rgba(255,255,255,0.025)",
};

export const tones = {
  gold: { bg: "rgba(250,204,21,0.10)", text: "#facc15", border: "rgba(250,204,21,0.35)" },
  cyan: { bg: "rgba(34,211,238,0.10)", text: "#22d3ee", border: "rgba(34,211,238,0.35)" },
  violet: { bg: "rgba(167,139,250,0.10)", text: "#c4b5fd", border: "rgba(167,139,250,0.35)" },
  green: { bg: "rgba(74,222,128,0.10)", text: "#4ade80", border: "rgba(74,222,128,0.35)" },
  red: { bg: "rgba(248,113,113,0.10)", text: "#f87171", border: "rgba(248,113,113,0.35)" },
  silver: { bg: "rgba(203,213,225,0.10)", text: "#cbd5e1", border: "rgba(203,213,225,0.35)" },
};

export const card = {
  background: colors.panelBg,
  border: `1px solid ${colors.panelBorder}`,
  borderRadius: 14,
  padding: "20px 20px 16px",
};

export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(167,139,250,0.2)",
  borderRadius: 8,
  color: colors.text,
  padding: "10px 14px",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

export const labelStyle = {
  display: "block",
  color: colors.dim,
  fontSize: 11,
  fontWeight: 700,
  marginBottom: 6,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

export const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "rgba(255,255,255,0.02)",
  border: `1px solid ${colors.panelBorder}`,
  borderRadius: 14,
  overflow: "hidden",
};

export const th = {
  padding: "12px 14px",
  textAlign: "left",
  color: colors.dim,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  borderBottom: `1px solid ${colors.panelBorder}`,
  background: "rgba(255,255,255,0.02)",
};

export const thR = { ...th, textAlign: "right" };

export const td = {
  padding: "13px 14px",
  borderBottom: "1px solid rgba(167,139,250,0.06)",
  fontSize: 14,
};

export const tdR = { ...td, textAlign: "right" };

export const btnPrimary = {
  background: "linear-gradient(135deg, #22d3ee, #a78bfa)",
  border: "none",
  borderRadius: 10,
  color: "#0a0820",
  padding: "11px 18px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export const btnGhost = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: colors.muted,
  padding: "11px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

export const btnDanger = {
  background: "rgba(248,113,113,0.10)",
  border: "1px solid #ef4444",
  borderRadius: 10,
  color: "#f87171",
  padding: "11px 18px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

export const iconBtnCyan = {
  background: "rgba(34,211,238,0.10)",
  border: "1px solid rgba(34,211,238,0.3)",
  borderRadius: 7,
  color: colors.cyan,
  cursor: "pointer",
  padding: "5px 8px",
  display: "flex",
};

export const iconBtnRed = {
  background: "rgba(248,113,113,0.10)",
  border: "1px solid rgba(248,113,113,0.3)",
  borderRadius: 7,
  color: colors.red,
  cursor: "pointer",
  padding: "5px 8px",
  display: "flex",
};

export const sectionHeaderWrap = {
  textAlign: "center",
  padding: "24px 0 32px",
  borderBottom: `1px solid ${colors.panelBorder}`,
  marginBottom: 24,
};
