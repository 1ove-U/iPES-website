// components/ClubDetail.js
"use client";

import { Modal, Pill, EmptyState, formatDate, IconFacebook } from "./ui";
import { Avatar } from "./Avatar";
import { ClubLogo, clubBannerGradient } from "./ClubManager";
import { colors, card } from "../lib/theme";
import { clubChampionships } from "../lib/scoring";

const PlacementBadge = ({ placement }) => (
  <span style={{
    width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: 14, background: placement === 1 ? "#facc15" : "#cbd5e1",
  }}>{placement === 1 ? "🥇" : "🥈"}</span>
);

export const ClubDetailModal = ({ club, tournaments, rankedById, onOpenProfile, onClose }) => {
  if (!club) return null;
  const hasColors = club.colorPrimary && club.colorSecondary;
  const history = clubChampionships(club.players.map((p) => p.id), tournaments, rankedById);

  return (
    <Modal title="รายละเอียดสโมสร์" onClose={onClose} maxWidth={520}>
      <div style={{ position: "relative", marginBottom: 18 }}>
        {hasColors && (
          <div style={{
            position: "absolute", inset: -4, borderRadius: 16, opacity: 0.08, pointerEvents: "none",
            background: clubBannerGradient(club),
          }} />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <span style={{
            display: "inline-flex", borderRadius: 16, flexShrink: 0,
            boxShadow: hasColors ? `0 0 0 2px ${club.colorPrimary}` : "none",
          }}>
            <ClubLogo name={club.club} logoUrl={club.logoUrl} size={64} radius={14} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#fff" }}>{club.club}</div>
              {club.facebookUrl && (
                <a href={club.facebookUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  background: "rgba(59,89,152,0.18)", color: "#7f9fe0",
                }} title="เปิดเพจ Facebook">
                  <IconFacebook />
                </a>
              )}
            </div>
            {club.location && <div style={{ fontSize: 13, color: colors.dim, marginTop: 1 }}>📍 {club.location}</div>}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <Pill tone="violet">อันดับสโมสร์ #{club.rank}</Pill>
              <Pill tone="cyan">{club.memberCount} สมาชิก</Pill>
            </div>
          </div>
        </div>
      </div>

      {club.description && (
        <div style={{ ...card, marginBottom: 16, fontSize: 13, color: colors.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {club.description}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <div style={{ ...card, flex: 1, textAlign: "center", padding: "12px 6px", minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: colors.gold }}>{club.champion}</div>
          <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2, lineHeight: 1.3 }}>แชมป์</div>
        </div>
        <div style={{ ...card, flex: 1, textAlign: "center", padding: "12px 6px", minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: colors.silver }}>{club.runnerUp}</div>
          <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2, lineHeight: 1.3 }}>รองแชมป์</div>
        </div>
        <div style={{ ...card, flex: 1, textAlign: "center", padding: "12px 6px", minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: colors.green }}>{club.winRate.toFixed(0)}%</div>
          <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2, lineHeight: 1.3 }}>อัตราชนะ</div>
        </div>
        <div style={{ ...card, flex: 1, textAlign: "center", padding: "12px 6px", minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: colors.cyan }}>{club.totalScore}</div>
          <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2, lineHeight: 1.3 }}>คะแนนรวม</div>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 10 }}>
        สมาชิกปัจจุบัน ({club.players.length} คน)
      </div>
      <div style={{ ...card, padding: "6px 0", marginBottom: 20 }}>
        {club.players.map((p, i) => (
          <button key={p.id} onClick={() => onOpenProfile(p)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 16px",
            background: "none", border: "none", cursor: "pointer", color: "inherit", textAlign: "left", fontFamily: "inherit",
            borderBottom: i === club.players.length - 1 ? "none" : "1px solid rgba(167,139,250,0.06)",
          }}>
            <Avatar player={p} size={28} radius={8} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            <span style={{ fontSize: 12, color: colors.faint, flexShrink: 0 }}>#{p.rank} โลก</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: colors.cyan, flexShrink: 0 }}>{p.score} pts</span>
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors.faint, marginBottom: 20, lineHeight: 1.6 }}>
        💡 ระบบเก็บแค่สังกัดปัจจุบันของผู้เล่นแต่ละคน ไม่มีบันทึกประวัติย้ายสโมสร์ — รายชื่อนี้คือผู้เล่นที่สังกัดอยู่ตอนนี้เท่านั้น
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f0ff", marginBottom: 10 }}>
        ผลงานในอดีตของสมาชิก ({history.length} ครั้ง)
      </div>
      {history.length === 0 ? (
        <EmptyState text="สมาชิกปัจจุบันของสโมสร์นี้ยังไม่เคยแชมป์/รองแชมป์ทัวร์นาเมนต์ใดเลย" />
      ) : (
        <div style={{ ...card, padding: "6px 0" }}>
          {history.map((t, i) => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
              borderBottom: i === history.length - 1 ? "none" : "1px solid rgba(167,139,250,0.06)",
            }}>
              <PlacementBadge placement={t.placement} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: colors.faint, marginTop: 1 }}>
                  {t.player?.name || "—"} · {formatDate(t.date)}{t.season ? ` · ${t.season}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
