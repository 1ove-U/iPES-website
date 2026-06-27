// components/Summaries.js
"use client";

import { useState } from "react";
import { Modal, EmptyState, formatDate } from "./ui";
import { colors, card, btnPrimary, btnGhost, inputStyle, labelStyle } from "../lib/theme";

// ── Generate form: admin types a label ("มิถุนายน 2026", "Season 2026")
// and confirms — the actual numbers are computed by the caller (page.js
// has all the live data already) and passed in as `buildSummary()`. ──────
export const GenerateSummaryForm = ({ onGenerate, onClose }) => {
  const [label, setLabel] = useState("");
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>ชื่อสรุป (เดือน/ฤดูกาล)</label>
        <input
          type="text" value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle}
          placeholder="เช่น มิถุนายน 2026 หรือ Season 2026"
        />
      </div>
      <div style={{ fontSize: 11, color: colors.faint, marginBottom: 16, lineHeight: 1.6 }}>
        ระบบจะจับภาพอันดับ Top 10, ผู้ที่ขยับอันดับมากสุด, ฟอร์มร้อนแรงที่สุด ณ ตอนนี้ เก็บไว้เป็นบันทึกย้อนดูได้ — ตัวเลขจะไม่เปลี่ยนหลังจากบันทึกแล้ว แม้อันดับจริงจะเปลี่ยนไปต่อก็ตาม (ไม่ส่งออกไปไหน เก็บไว้ในเว็บให้ย้อนดูเท่านั้น)
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ยกเลิก</button>
        <button
          onClick={() => { if (label.trim()) { onGenerate(label.trim()); onClose(); } }}
          style={{ ...btnPrimary, flex: 2 }}
        >สร้างสรุป</button>
      </div>
    </div>
  );
};

const StatRow = ({ icon, name, sub, value, valueColor }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f0ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
      {sub && <div style={{ fontSize: 11, color: colors.faint }}>{sub}</div>}
    </div>
    <div style={{ fontWeight: 700, fontSize: 13, color: valueColor || colors.cyan, flexShrink: 0 }}>{value}</div>
  </div>
);

export const SummaryDetailModal = ({ summary, onClose }) => {
  if (!summary) return null;
  return (
    <Modal title={summary.label} onClose={onClose} maxWidth={480}>
      <div style={{ fontSize: 11, color: colors.faint, marginBottom: 16 }}>
        สร้างเมื่อ {formatDate(summary.generatedAt)}
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 8 }}>🏆 Top 10</div>
      <div style={{ ...card, padding: "4px 16px", marginBottom: 18 }}>
        {summary.top10.map((p) => (
          <StatRow key={p.id} icon={`#${p.rank}`} name={p.name} sub={p.club} value={`${p.score} pts`} />
        ))}
      </div>

      {summary.climbers.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 8 }}>📈 ขยับอันดับขึ้นมากสุด</div>
          <div style={{ ...card, padding: "4px 16px", marginBottom: 18 }}>
            {summary.climbers.map((p) => (
              <StatRow key={p.id} icon="▲" name={p.name} value={`+${p.delta}`} valueColor={colors.green} />
            ))}
          </div>
        </>
      )}

      {summary.fallers.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 8 }}>📉 ร่วงอันดับมากสุด</div>
          <div style={{ ...card, padding: "4px 16px", marginBottom: 18 }}>
            {summary.fallers.map((p) => (
              <StatRow key={p.id} icon="▼" name={p.name} value={`-${p.delta}`} valueColor={colors.red} />
            ))}
          </div>
        </>
      )}

      {summary.hottestForm.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 8 }}>🔥 ฟอร์มร้อนแรงที่สุด</div>
          <div style={{ ...card, padding: "4px 16px", marginBottom: 18 }}>
            {summary.hottestForm.map((p) => (
              <StatRow key={p.id} icon="🔥" name={p.name} sub={`ชนะ ${p.wins} จาก 5 นัดล่าสุด`} value={`${p.points} แต้ม`} valueColor={colors.gold} />
            ))}
          </div>
        </>
      )}

      {summary.topClub && (
        <>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 8 }}>🛡️ สโมสร์อันดับ 1</div>
          <div style={{ ...card, padding: "4px 16px" }}>
            <StatRow icon="🥇" name={summary.topClub.name} value={`${summary.topClub.totalScore} pts`} valueColor={colors.gold} />
          </div>
        </>
      )}
    </Modal>
  );
};

export const SummaryListTab = ({ summaries, isAdmin, onGenerate, onOpen, onDeleteRequest }) => (
  <div className="fade-in">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10 }}>
      <div style={{ color: colors.dim, fontSize: 13 }}>
        บันทึกสรุปสถิติย้อนหลัง เก็บไว้ดูภาพรวมแต่ละช่วงเวลา
      </div>
      {isAdmin && (
        <button onClick={onGenerate} style={{ ...btnPrimary, flexShrink: 0, fontSize: 13, padding: "8px 14px" }}>
          + สร้างสรุปใหม่
        </button>
      )}
    </div>

    {summaries.length === 0 ? (
      <EmptyState text="ยังไม่มีสรุปสถิติที่บันทึกไว้" />
    ) : (
      summaries.map((s) => (
        <div key={s.id} style={{ ...card, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => onOpen(s)} style={{
            flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12,
            background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left", fontFamily: "inherit", padding: 0,
          }}>
            <span style={{ fontSize: 22 }}>🗒️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{s.label}</div>
              <div style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>สร้างเมื่อ {formatDate(s.generatedAt)}</div>
            </div>
          </button>
          {isAdmin && (
            <button onClick={() => onDeleteRequest(s)} style={{ background: "none", border: "none", color: colors.faint, cursor: "pointer", fontSize: 12 }}>
              ลบ
            </button>
          )}
        </div>
      ))
    )}
  </div>
);
