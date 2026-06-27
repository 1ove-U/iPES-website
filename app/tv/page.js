// app/tv/page.js
// Full-screen, unattended display mode meant to run on a TV/projector at an
// in-person event. No header, no tabs, no admin chrome — just a few slides
// that auto-rotate. Has its own Firestore listeners (this is a separate
// route from the main app, so it doesn't share React state with
// app/page.js) but reuses every stat/ranking calculation from lib/ as-is —
// nothing here recomputes logic that already lives elsewhere.
"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { rankPlayers } from "../../lib/scoring";
import { combinePlayerStats, recentCompletedMatches, upcomingTournaments, expandTeamMatches, pendingLobbyMatches } from "../../lib/stats";
import { Avatar } from "../../components/Avatar";
import { TeamLogo } from "../../components/TeamManager";
import { Logo } from "../../components/ui";
import { colors } from "../../lib/theme";

const SLIDE_SECONDS = 12;

function useTvData() {
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      onSnapshot(collection(db, "players"), (snap) => setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), (err) => console.error("TV: players", err)),
      onSnapshot(collection(db, "tournaments"), (snap) => setTournaments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), (err) => console.error("TV: tournaments", err)),
      onSnapshot(collection(db, "matches"), (snap) => { setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); }, (err) => { console.error("TV: matches", err); setLoading(false); }),
      onSnapshot(collection(db, "teams"), (snap) => setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), (err) => console.error("TV: teams", err)),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  return { players, tournaments, matches, teams, loading };
}

const SlideShell = ({ title, subtitle, children }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "clamp(16px, 5vw, 48px) clamp(16px, 8vw, 64px)" }}>
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: "clamp(20px, 4vw, 34px)", fontWeight: 800, color: "#fff" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "clamp(12px, 2vw, 16px)", color: colors.dim, marginTop: 4 }}>{subtitle}</div>}
    </div>
    <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
  </div>
);

const TopRankingSlide = ({ ranked }) => (
  <SlideShell title="🏆 อันดับสูงสุด" subtitle="Top 10 — iPES Ranking Series">
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {ranked.slice(0, 10).map((p) => (
        <div key={p.id} style={{
          display: "flex", alignItems: "center", gap: 20, padding: "14px 24px", borderRadius: 16,
          background: p.rank <= 3 ? "rgba(250,204,21,0.08)" : "rgba(255,255,255,0.03)",
          border: p.rank === 1 ? "1px solid rgba(250,204,21,0.4)" : "1px solid rgba(167,139,250,0.1)",
        }}>
          <div style={{ width: 48, fontSize: 26, fontWeight: 800, color: p.rank <= 3 ? "#facc15" : colors.dim, textAlign: "center" }}>
            {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}
          </div>
          <Avatar player={p} size={48} radius={14} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{p.name}</div>
            {p.club && <div style={{ fontSize: 14, color: colors.faint }}>{p.club}</div>}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#facc15", fontVariantNumeric: "tabular-nums" }}>{p.score}</div>
        </div>
      ))}
    </div>
  </SlideShell>
);

const RecentMatchesSlide = ({ matches, playersById, tournamentsById }) => (
  <SlideShell title="⚡ แมตช์ล่าสุด" subtitle="Recent Results">
    {matches.length === 0 ? (
      <EmptyBig text="ยังไม่มีแมตช์ที่จบไปแล้ว" />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {matches.slice(0, 8).map((m) => {
          const a = playersById.get(m.playerAId), b = playersById.get(m.playerBId);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 20, fontWeight: m.winnerId === m.playerAId ? 800 : 500, color: m.winnerId === m.playerAId ? "#fff" : colors.faint }}>{a?.name || "—"}</span>
                <Avatar player={a || { name: "?" }} size={36} radius={10} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: colors.cyan, minWidth: 90, textAlign: "center" }}>{m.scoreA} : {m.scoreB}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar player={b || { name: "?" }} size={36} radius={10} />
                <span style={{ fontSize: 20, fontWeight: m.winnerId === m.playerBId ? 800 : 500, color: m.winnerId === m.playerBId ? "#fff" : colors.faint }}>{b?.name || "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </SlideShell>
);

const LobbySlide = ({ lobbyMatches, playersById, teamsById }) => (
  <SlideShell title="⏳ รอแข่งต่อไป" subtitle="Up Next">
    {lobbyMatches.length === 0 ? (
      <EmptyBig text="ไม่มีคู่ที่รอแข่งอยู่ตอนนี้" />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {lobbyMatches.slice(0, 8).map((m) => {
          const isTeam = m.tournament?.format === "team";
          const lookup = isTeam ? teamsById : playersById;
          const a = lookup.get(m.playerAId), b = lookup.get(m.playerBId);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 24px", borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
              <div style={{ width: 220, fontSize: 14, color: colors.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.tournament?.name}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{a?.name || "—"}</span>
                {isTeam ? <TeamLogo name={a?.name} logoUrl={a?.logoUrl} size={36} radius={10} /> : <Avatar player={a || { name: "?" }} size={36} radius={10} />}
              </div>
              <div style={{ fontSize: 16, color: colors.faint, fontWeight: 700 }}>VS</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                {isTeam ? <TeamLogo name={b?.name} logoUrl={b?.logoUrl} size={36} radius={10} /> : <Avatar player={b || { name: "?" }} size={36} radius={10} />}
                <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{b?.name || "—"}</span>
              </div>
              {m.verifyCode && (
                <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: colors.cyan, background: "rgba(34,211,238,0.1)", padding: "4px 10px", borderRadius: 6 }}>
                  {m.verifyCode}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </SlideShell>
);

const UpcomingSlide = ({ upcoming }) => (
  <SlideShell title="📅 ทัวร์นาเมนต์ที่กำลังจะมาถึง" subtitle="Upcoming Tournaments">
    {upcoming.length === 0 ? (
      <EmptyBig text="ไม่มีทัวร์นาเมนต์ที่กำลังจะมาถึงตอนนี้" />
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {upcoming.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 28px", borderRadius: 16, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
            <div style={{ fontSize: 32 }}>🏆</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{t.name}</div>
              <div style={{ fontSize: 15, color: colors.dim, marginTop: 4 }}>
                {t.date || "ยังไม่กำหนดวันที่"}{t.season ? ` · ${t.season}` : ""}{t.format === "team" ? " · แบบทีม" : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </SlideShell>
);

const EmptyBig = ({ text }) => (
  <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: colors.faint, fontSize: 22 }}>
    {text}
  </div>
);

export default function TvDisplayPage() {
  const { players, tournaments, matches, teams, loading } = useTvData();
  const [slideIndex, setSlideIndex] = useState(0);

  const tournamentsById = useMemo(() => new Map(tournaments.map((t) => [t.id, t])), [tournaments]);
  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const expandedMatches = useMemo(() => expandTeamMatches(matches, teamsById), [matches, teamsById]);
  const ranked = useMemo(() => {
    const combined = players.map((p) => combinePlayerStats(p, expandedMatches, tournamentsById, teamsById));
    return rankPlayers(combined);
  }, [players, expandedMatches, tournamentsById, teamsById]);
  const rankedById = useMemo(() => new Map(ranked.map((p) => [p.id, p])), [ranked]);
  const recentMatches = useMemo(() => recentCompletedMatches(matches, tournamentsById, 8), [matches, tournamentsById]);
  const lobbyMatches = useMemo(() => pendingLobbyMatches(matches, tournaments), [matches, tournaments]);
  const upcoming = useMemo(() => upcomingTournaments(tournaments, 5), [tournaments]);

  const slides = [
    <TopRankingSlide key="rank" ranked={ranked} />,
    <RecentMatchesSlide key="recent" matches={recentMatches} playersById={rankedById} tournamentsById={tournamentsById} />,
    <LobbySlide key="lobby" lobbyMatches={lobbyMatches} playersById={rankedById} teamsById={teamsById} />,
    <UpcomingSlide key="upcoming" upcoming={upcoming} />,
  ];

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex((i) => (i + 1) % slides.length), SLIDE_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) {
    return (
      <div style={{ height: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.dim, fontSize: 20 }}>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100vw", background: colors.bg, overflow: "hidden", position: "relative" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px clamp(16px, 6vw, 64px)", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, overflow: "hidden" }}>
          <Logo size={32} />
          <div style={{
            fontSize: 13, color: colors.faint, fontWeight: 700, letterSpacing: "0.06em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>IPES RANKING SERIES · LIVE</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              width: 24, height: 4, borderRadius: 2, flexShrink: 0,
              background: i === slideIndex ? colors.cyan : "rgba(255,255,255,0.15)",
            }} />
          ))}
        </div>
      </div>
      <div style={{ height: "100%", paddingTop: 64 }}>
        {slides[slideIndex]}
      </div>
    </div>
  );
}
