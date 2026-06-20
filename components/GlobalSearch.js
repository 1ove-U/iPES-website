// components/GlobalSearch.js
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Avatar } from "./Avatar";
import { IconSearch, IconClose, IconTrophy, IconNews } from "./ui";
import { colors, inputStyle } from "../lib/theme";

const RESULT_LIMIT = 6;

export const GlobalSearch = ({ players, tournaments, news, onOpenProfile, onGoTab }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQ("");
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { players: [], tournaments: [], news: [] };
    return {
      players: players.filter((p) => p.name.toLowerCase().includes(term) || (p.club || "").toLowerCase().includes(term)).slice(0, RESULT_LIMIT),
      tournaments: tournaments.filter((t) => (t.name || "").toLowerCase().includes(term)).slice(0, RESULT_LIMIT),
      news: news.filter((n) => (n.title || "").toLowerCase().includes(term)).slice(0, RESULT_LIMIT),
    };
  }, [q, players, tournaments, news]);

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

            <div style={{ padding: q.trim() ? "8px 0" : 0 }}>
              {!q.trim() ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: colors.faint, fontSize: 13 }}>
                  พิมพ์เพื่อค้นหาผู้เล่น ทัวร์นาเมนต์ หรือข่าวสาร
                </div>
              ) : !hasResults ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: colors.faint, fontSize: 13 }}>
                  ไม่พบผลลัพธ์สำหรับ &quot;{q}&quot;
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
                          {p.club && <span style={{ fontSize: 11, color: colors.faint }}>{p.club}</span>}
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
