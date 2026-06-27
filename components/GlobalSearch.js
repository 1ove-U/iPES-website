// components/GlobalSearch.js
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import { IconSearch, IconClose, IconTrophy, IconNews } from "./ui";
import { colors, inputStyle } from "../lib/theme";

const RESULT_LIMIT = 6;
const HOT_STREAK_THRESHOLD = 3;

// Advanced filters apply only to the player results — tournaments/news
// keep matching on text alone, since "club"/"never champion"/"hot streak"
// only make sense for players.
const FILTERS = [
  { key: "club", label: "เฉพาะสโมสร์เดียวกับคำค้นหา" },
  { key: "neverChampion", label: "ยังไม่เคยแชมป์" },
  { key: "hotStreak", label: "ฟอร์มร้อนแรง 🔥" },
];

export const GlobalSearch = ({ players, tournaments, news, onOpenProfile, onGoTab }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeFilters, setActiveFilters] = useState(new Set());
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(""); setActiveFilters(new Set()); }
  }, [open]);

  const toggleFilter = (key) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const browsing = !term && activeFilters.size > 0 && !activeFilters.has("club");
    if (!term && !browsing) return { players: [], tournaments: [], news: [] };

    let filteredPlayers = !term
      ? players
      : players.filter((p) => p.name.toLowerCase().includes(term) || (p.club || "").toLowerCase().includes(term));
    if (activeFilters.has("club")) {
      filteredPlayers = term ? filteredPlayers.filter((p) => (p.club || "").toLowerCase().includes(term)) : [];
    }
    if (activeFilters.has("neverChampion")) {
      filteredPlayers = filteredPlayers.filter((p) => (p.champion || 0) === 0);
    }
    if (activeFilters.has("hotStreak")) {
      filteredPlayers = filteredPlayers.filter((p) => (p.currentWinStreak || 0) >= HOT_STREAK_THRESHOLD);
    }

    return {
      players: filteredPlayers.slice(0, RESULT_LIMIT),
      tournaments: term ? tournaments.filter((t) => (t.name || "").toLowerCase().includes(term)).slice(0, RESULT_LIMIT) : [],
      news: term ? news.filter((n) => (n.title || "").toLowerCase().includes(term)).slice(0, RESULT_LIMIT) : [],
    };
  }, [q, players, tournaments, news, activeFilters]);

  const hasResults = results.players.length || results.tournaments.length || results.news.length;
  const close = () => setOpen(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8,
        color: "#9b96c4", padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center",
      }} aria-label="ค้นหา">
        <IconSearch />
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(5,4,18,0.78)", zIndex: 1100,
          display: "flex", justifyContent: "center", padding: "12vh 16px 16px", backdropFilter: "blur(6px)",
        }} onClick={close}>
          <div style={{
            background: "#0e0c24", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 16,
            width: "100%", maxWidth: 480, maxHeight: "70vh", overflowY: "auto",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, borderBottom: "1px solid rgba(167,139,250,0.12)" }}>
              <span style={{ color: colors.faint }}><IconSearch /></span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาผู้เล่น, ทัวร์นาเมนต์, ข่าว..."
                style={{ ...inputStyle, border: "none", background: "none", padding: 0 }}
              />
              <button onClick={close} style={{ background: "none", border: "none", color: colors.faint, cursor: "pointer", display: "flex" }}>
                <IconClose />
              </button>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "10px 16px", borderBottom: "1px solid rgba(167,139,250,0.08)" }}>
              {FILTERS.map((f) => {
                const active = activeFilters.has(f.key);
                const disabled = f.key === "club" && !q.trim();
                return (
                  <button key={f.key} onClick={() => !disabled && toggleFilter(f.key)} disabled={disabled} style={{
                    fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 20, cursor: disabled ? "default" : "pointer",
                    border: `1px solid ${active ? "rgba(34,211,238,0.5)" : "rgba(167,139,250,0.2)"}`,
                    background: active ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.03)",
                    color: active ? colors.cyan : colors.faint,
                    opacity: disabled ? 0.4 : 1,
                  }}>
                    {f.label}
                  </button>
                );
              })}
            </div>
            {activeFilters.has("club") && !q.trim() && (
              <div style={{ fontSize: 11, color: colors.faint, padding: "0 16px 8px" }}>
                พิมพ์ชื่อสโมสร์ในช่องค้นหาด้านบนเพื่อใช้ตัวกรองนี้
              </div>
            )}

            <div style={{ padding: (q.trim() || activeFilters.size > 0) ? "8px 0" : 0 }}>
              {!q.trim() && activeFilters.size === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: colors.faint, fontSize: 13 }}>
                  พิมพ์เพื่อค้นหาผู้เล่น ทัวร์นาเมนต์ หรือข่าวสาร หรือเลือกตัวกรองด้านบนเพื่อไล่ดูผู้เล่นได้เลย
                </div>
              ) : !hasResults ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: colors.faint, fontSize: 13 }}>
                  {q.trim()
                    ? <>ไม่พบผลลัพธ์สำหรับ &quot;{q}&quot;{activeFilters.size > 0 ? " ตามตัวกรองที่เลือก" : ""}</>
                    : "ไม่พบผู้เล่นที่ตรงกับตัวกรองที่เลือก"}
                </div>
              ) : (
                <>
                  {results.players.length > 0 && (
                    <div style={{ padding: "4px 16px 10px" }}>
                      <div style={{ fontSize: 11, color: colors.faint, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>ผู้เล่น</div>
                      {results.players.map((p) => (
                        <button key={p.id} onClick={() => { onOpenProfile(p); close(); }} style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 0",
                          background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", textAlign: "left",
                        }}>
                          <Avatar player={p} size={28} radius={8} />
                          <span style={{ fontSize: 13, color: "#f1f0ff", flex: 1, minWidth: 0 }}>{p.name}</span>
                          {activeFilters.has("hotStreak") && (p.currentWinStreak || 0) >= HOT_STREAK_THRESHOLD && (
                            <span style={{ fontSize: 11, color: colors.gold }}>🔥 ชนะ {p.currentWinStreak} นัดติด</span>
                          )}
                          {!activeFilters.has("hotStreak") && p.club && <span style={{ fontSize: 11, color: colors.faint }}>{p.club}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {results.tournaments.length > 0 && (
                    <div style={{ padding: "4px 16px 10px", borderTop: "1px solid rgba(167,139,250,0.08)" }}>
                      <div style={{ fontSize: 11, color: colors.faint, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: "6px 0" }}>ทัวร์นาเมนต์</div>
                      {results.tournaments.map((t) => (
                        <button key={t.id} onClick={() => { onGoTab("tournaments"); close(); }} style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 0",
                          background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", textAlign: "left",
                        }}>
                          <span style={{ color: colors.gold, display: "flex" }}><IconTrophy /></span>
                          <span style={{ fontSize: 13, color: "#f1f0ff" }}>{t.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.news.length > 0 && (
                    <div style={{ padding: "4px 16px 10px", borderTop: "1px solid rgba(167,139,250,0.08)" }}>
                      <div style={{ fontSize: 11, color: colors.faint, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: "6px 0" }}>ข่าว</div>
                      {results.news.map((n) => (
                        <button key={n.id} onClick={() => { onGoTab("news"); close(); }} style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 0",
                          background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", textAlign: "left",
                        }}>
                          <span style={{ color: colors.violetLight, display: "flex" }}><IconNews /></span>
                          <span style={{ fontSize: 13, color: "#f1f0ff" }}>{n.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
