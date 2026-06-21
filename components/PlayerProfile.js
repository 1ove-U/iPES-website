// components/PlayerProfile.js
"use client";

import { Avatar } from "./Avatar";
import { Modal, Pill, MovementPill, IconEdit, IconTrash, IconSwap, IconFacebook, Sparkline, formatDate } from "./ui";
import { colors, card, btnGhost, btnDanger, btnPrimary } from "../lib/theme";
import { getMovement, tournamentsForPlayer, rankMedal, rankColor } from "../lib/scoring";
import { matchesForPlayer, recentForm, headToHead, detectUpsets, winRateInWindow, TREND_WINDOWS } from "../lib/stats";
import { computeBadges } from "../lib/achievements";
import { clubBannerGradient } from "./ClubManager";

// ── Stadium Atmosphere: the header glow reacts to the player's current
// form — on fire while on a hot win streak, cold/frosty during a losing
// run, neutral otherwise. Pure presentation, derived entirely from
// currentWinStreak / recent form already computed elsewhere; nothing new
// stored. ───────────────────────────────────────────────────────────────
function atmosphereOf(player, form) {
  const streak = player.currentWinStreak || 0;
  const recentLosses = form.slice(0, 3).filter((r) => r === "L").length;
  if (streak >= 5) return { glow: "rgba(248,113,113,0.22)", ring: "rgba(248,113,113,0.4)", label: "🔥 ฟอร์มร้อนแรง", tone: "red" };
  if (streak >= 3) return { glow: "rgba(250,204,21,0.18)", ring: "rgba(250,204,21,0.35)", label: "✨ กำลังมา", tone: "gold" };
  if (recentLosses >= 3) return { glow: "rgba(96,165,250,0.14)", ring: "rgba(96,165,250,0.28)", label: "🧊 ฟอร์มเย็นชา", tone: "cyan" };
  return null;
}

const StatBox = ({ value, label, color }) => (
  <div style={{ textAlign: "center", flex: "1 1 80px" }}>
    <div style={{ fontWeight: 800, fontSize: 20, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    <div style={{ fontSize: 11, color: colors.dim, marginTop: 2 }}>{label}</div>
  </div>
);

const placementLabel = (placement) => placement === 1 ? "🏆 แชมป์" : placement === 2 ? "🥈 รองแชมป์" : placement === 3 ? "🥉 อันดับ 3" : null;

const FormDots = ({ form }) => (
  <div style={{ display: "flex", gap: 5 }}>
    {form.length === 0 && <span style={{ fontSize: 12, color: colors.faint }}>ยังไม่มีข้อมูล</span>}
    {form.map((r, i) => (
      <span key={i} style={{
        width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: "#0a0820",
        background: r === "W" ? colors.green : colors.red,
      }}>{r}</span>
    ))}
  </div>
);

export const PlayerProfileModal = ({
  player, tournaments, matches, playersById, tournamentsById, rankById, clubsByName, teamsById,
  isAdmin, onClose, onEdit, onDelete, onCompare,
}) => {
  if (!player) return null;
  const movement = getMovement(player);
  const history = tournamentsForPlayer(tournaments || [], player, teamsById);
  const playedMatches = matches ? matchesForPlayer(matches, player.id, tournamentsById) : [];
  const form = matches ? recentForm(matches, player.id, tournamentsById, 5) : [];
  const giantKills = matches && rankById ? detectUpsets(matches, rankById, tournamentsById, 15, 999).filter((u) => u.winnerId === player.id) : [];
  const badges = computeBadges(player, { allTournaments: tournaments || [], giantKillCount: giantKills.length });
  const trendPoints = matches ? TREND_WINDOWS.map((w) => winRateInWindow(matches, player.id, tournamentsById, w.days)) : [];
  const hasTrend = trendPoints.filter((v) => v != null).length >= 2;
  const club = player.club ? clubsByName?.get(player.club.toLowerCase()) : null;
  const hasClubColors = club?.colorPrimary && club?.colorSecondary;
  const atmosphere = atmosphereOf(player, form);

  return (
    <Modal title="โปรไฟล์ผู้เล่น" onClose={onClose} maxWidth={480}>
      <div style={{
        display: "flex", gap: 16, alignItems: "center", marginBottom: 18,
        position: "relative", padding: atmosphere ? "14px" : 0,
        borderRadius: 14,
        background: atmosphere ? `radial-gradient(circle at 30% 30%, ${atmosphere.glow}, transparent 70%)` : "none",
        border: atmosphere ? `1px solid ${atmosphere.ring}` : "none",
      }}>
        {hasClubColors && (
          <div style={{
            position: "absolute", top: 0, left: 14, right: 14, height: 3, borderRadius: 2,
            background: clubBannerGradient(club),
          }} />
        )}
        <Avatar player={player} size={72} radius={16} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 800, fontSize: 19, color: "#fff" }}>{player.name}</div>
            {player.facebookUrl && (
              <a href={player.facebookUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  background: "rgba(59,89,152,0.18)", color: "#7f9fe0",
                }}
                title="เปิดโปรไฟล์ Facebook"
              >
                <IconFacebook />
              </a>
            )}
          </div>
          {player.club && <div style={{ fontSize: 13, color: colors.dim, marginTop: 1 }}>{player.club}</div>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <Pill tone="violet">{rankMedal(player.rank) || `#${player.rank}`} อันดับ</Pill>
            {player.country && <Pill tone="cyan">{player.country}</Pill>}
            <MovementPill movement={movement} />
            {atmosphere && <Pill tone={atmosphere.tone}>{atmosphere.label}</Pill>}
          </div>
        </div>
      </div>

      {player.bio && (
        <div style={{ ...card, marginBottom: 16, fontSize: 13, color: colors.muted, lineHeight: 1.6 }}>
          {player.bio}
        </div>
      )}

      {badges.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {badges.map((b) => <Pill key={b.id} tone="gold">{b.icon} {b.label}</Pill>)}
        </div>
      )}

      <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <StatBox value={player.score} label="คะแนนรวม" color={rankColor(player.rank)} />
        <StatBox value={player.champion} label="แชมป์" color={colors.gold} />
        <StatBox value={player.runnerUp} label="รองแชมป์" color={colors.silver} />
        <StatBox value={`${player.winRate.toFixed(1)}%`} label="อัตราชนะ" color={colors.green} />
        <StatBox value={player.wins + player.losses} label="แมตช์รวม" color={colors.cyan} />
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, color: "#f1f0ff", fontSize: 13 }}>ฟอร์ม 5 นัดล่าสุด</div>
          <div style={{ fontSize: 11, color: colors.faint }}>Win Streak สูงสุด: {player.bestWinStreak || 0}</div>
        </div>
        <FormDots form={form} />
      </div>

      {hasTrend && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: "#f1f0ff", fontSize: 13 }}>เทรนด์อัตราชนะ</div>
            <div style={{ display: "flex", gap: 10 }}>
              {TREND_WINDOWS.map((w, i) => (
                <span key={w.label} style={{ fontSize: 10, color: colors.faint }}>
                  {w.label}{trendPoints[i] != null ? ` ${trendPoints[i].toFixed(0)}%` : ""}
                </span>
              ))}
            </div>
          </div>
          <Sparkline points={trendPoints} height={48} color={colors.green} />
        </div>
      )}

      <div style={{ fontWeight: 700, color: "#f1f0ff", marginBottom: 10, fontSize: 14 }}>
        ผลงานทัวร์นาเมนต์ {history.length > 0 && <span style={{ color: colors.faint, fontWeight: 500 }}>({history.length})</span>}
      </div>
      {history.length === 0 ? (
        <div style={{ color: colors.faint, fontSize: 13, marginBottom: 18 }}>ยังไม่มีประวัติในคลังทัวร์นาเมนต์</div>
      ) : (
        <div style={{ marginBottom: 18 }}>
          {history.map((t, i) => (
            <div key={t.id || i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i === history.length - 1 ? "none" : "1px solid rgba(167,139,250,0.08)",
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f0ff" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: colors.faint }}>{formatDate(t.date)}</div>
              </div>
              <Pill tone={t.placement === 1 ? "gold" : t.placement === 2 ? "silver" : "violet"}>{placementLabel(t.placement)}</Pill>
            </div>
          ))}
        </div>
      )}

      {playedMatches.length > 0 && playersById && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontWeight: 700, color: "#f1f0ff", marginBottom: 10, fontSize: 14 }}>Match History ({playedMatches.length})</div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {playedMatches.slice(0, 20).map((m) => {
              const oppId = m.playerAId === player.id ? m.playerBId : m.playerAId;
              const myScore = m.playerAId === player.id ? m.scoreA : m.scoreB;
              const oppScore = m.playerAId === player.id ? m.scoreB : m.scoreA;
              const won = m.winnerId === player.id;
              return (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", fontSize: 12.5 }}>
                  <span style={{ color: colors.muted }}>vs {playersById.get(oppId)?.name || "ผู้เล่นที่ถูกลบ"}</span>
                  <span style={{ fontWeight: 700, color: won ? colors.green : colors.red }}>{myScore}-{oppScore}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        {onCompare && (
          <button onClick={() => onCompare(player)} style={{ ...btnPrimary, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <IconSwap />เปรียบเทียบ
          </button>
        )}
        {isAdmin && (
          <>
            <button onClick={() => onEdit(player)} style={{ ...btnGhost, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <IconEdit />แก้ไข
            </button>
            <button onClick={() => onDelete(player)} style={{ ...btnDanger, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <IconTrash />ลบ
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};
