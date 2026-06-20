"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { rankPlayers } from "../lib/scoring";
import { combinePlayerStats, recentCompletedMatches, upcomingTournaments } from "../lib/stats";
import { buildBracket, computeAdvancement, computeRetroactiveReset, totalRounds } from "../lib/bracket";
import { Logo, Pill, IconShield, Modal, ConfirmDeleteModal, Spinner, formatDate } from "../components/ui";
import { LoginModal } from "../components/LoginModal";
import { PlayerForm } from "../components/PlayerForm";
import { PlayerProfileModal } from "../components/PlayerProfile";
import { PlayerCompare } from "../components/PlayerCompare";
import { GlobalSearch } from "../components/GlobalSearch";
import { LeaderboardTab } from "../components/Leaderboard";
import { ClubRankingTab } from "../components/ClubRanking";
import { TournamentArchiveTab, TournamentForm, TournamentCreateChooser } from "../components/Tournaments";
import { MatchResultForm } from "../components/Bracket";
import { HallOfFameTab } from "../components/HallOfFame";
import { NewsTab, NewsForm, pickLatestNews } from "../components/News";
import { DashboardTab } from "../components/Dashboard";
import { AdminDashboardTab } from "../components/Admin";
import { StatsRankingTab } from "../components/Stats";
import { RuleTab, RuleForm } from "../components/Rule";
import { RecentMatchesWidget, UpcomingTournamentWidget } from "../components/HomeWidgets";

const NEWS_SEEN_KEY = "ipes_news_last_seen";

// ─── Page-level layout styles (header / tab-bar chrome only — everything
// inside a tab now owns its own styles via lib/theme + the tab components) ──
const s = {
  wrap: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse 120% 60% at 50% -10%, rgba(167,139,250,0.16), transparent 60%), #07051a",
    fontFamily: "'Inter','Noto Sans Thai',sans-serif",
    color: "#f1f0ff",
  },
  header: {
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(7,5,26,0.85)", backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(167,139,250,0.15)",
    padding: "0 16px",
  },
  headerInner: {
    maxWidth: 1080, margin: "0 auto",
    display: "flex", alignItems: "center", gap: 12, height: 64,
  },
  logoText: { fontWeight: 900, fontSize: 20, letterSpacing: "0.04em", color: "#fff", lineHeight: 1 },
  logoSub: { fontSize: 10, color: "#7c77a8", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 2 },
  main: { maxWidth: 1080, margin: "0 auto", padding: "20px 16px 48px" },
  tabs: {
    display: "flex", gap: 4, background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(167,139,250,0.15)", borderRadius: 12, padding: 4, marginBottom: 22,
    overflowX: "auto",
  },
  tab: (active) => ({
    flex: "0 0 auto", padding: "10px 16px", borderRadius: 9, border: "none",
    fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap",
    background: active ? "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(167,139,250,0.18))" : "transparent",
    color: active ? "#fff" : "#7c77a8",
    letterSpacing: "0.02em",
    boxShadow: active ? "inset 0 0 0 1px rgba(167,139,250,0.35)" : "none",
  }),
  unreadDot: {
    display: "inline-block", width: 6, height: 6, borderRadius: 3,
    background: "#f87171", marginLeft: 5, verticalAlign: "middle",
  },
};

const TABS = [
  ["leaderboard", "อันดับ"],
  ["clubs", "สโมสร"],
  ["statsranking", "สถิติยิง/สตรีค"],
  ["tournaments", "ทัวร์นาเมนต์"],
  ["halloffame", "หอเกียรติยศ"],
  ["news", "ข่าว"],
  ["dashboard", "สถิติ"],
  ["rule", "กฎการแข่งขัน"],
];

export default function App() {
  // ── Core data ──
  const [players, setPlayers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [news, setNews] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("leaderboard");

  // ── Auth ──
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // ── Player modals ──
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [deletePlayerTarget, setDeletePlayerTarget] = useState(null);

  // ── Tournament modals ──
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [editTournament, setEditTournament] = useState(null);
  const [deleteTournamentTarget, setDeleteTournamentTarget] = useState(null);

  // ── News modals ──
  const [showAddNews, setShowAddNews] = useState(false);
  const [editNews, setEditNews] = useState(null);
  const [deleteNewsTarget, setDeleteNewsTarget] = useState(null);

  // ── Rule modal ──
  const [showEditRule, setShowEditRule] = useState(false);

  // ── Player Profile / Compare modals (store id only; the live ranked
  // object is looked up by id on every render so edits/deletes stay in sync) ──
  const [profileOpenPlayerId, setProfileOpenPlayerId] = useState(null);
  const [compareOpenPlayerId, setCompareOpenPlayerId] = useState(null);

  // ── Match result entry modal (bracket system) ──
  const [matchResultTarget, setMatchResultTarget] = useState(null); // { match, tournament }

  // ── Ranking Movement snapshot ──
  const [lastSnapshotAt, setLastSnapshotAt] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // ── Unread news (lightweight, localStorage-only replacement for a full
  // push-based Notification Center, which would need FCM + service workers) ──
  const [hasUnreadNews, setHasUnreadNews] = useState(false);

  // ── Real-time Firestore listeners ──
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "players"), (snap) => {
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Firestore error (players):", err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tournaments"), (snap) => {
      setTournaments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Firestore error (tournaments):", err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "news"), (snap) => {
      setNews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Firestore error (news):", err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "matches"), (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Firestore error (matches):", err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "meta", "rankingSnapshot"), (snap) => {
      setLastSnapshotAt(snap.exists() ? snap.data().updatedAt : null);
    }, (err) => console.error("Firestore error (meta):", err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "meta", "rule"), (snap) => {
      setRule(snap.exists() ? snap.data() : null);
    }, (err) => console.error("Firestore error (rule):", err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // ── Unread news tracking ──
  const latestNewsTime = (list) => {
    if (!list || list.length === 0) return 0;
    const toDate = (n) => (n.createdAt?.toDate ? n.createdAt.toDate() : new Date(n.createdAt || 0));
    return Math.max(...list.map((n) => toDate(n).getTime()));
  };
  useEffect(() => {
    const latest = latestNewsTime(news);
    if (latest === 0) { setHasUnreadNews(false); return; }
    let seen = 0;
    try { seen = Number(localStorage.getItem(NEWS_SEEN_KEY) || 0); } catch (e) { /* ignore */ }
    setHasUnreadNews(latest > seen);
  }, [news]);

  useEffect(() => {
    if (tab === "news" && news.length > 0) {
      try { localStorage.setItem(NEWS_SEEN_KEY, String(latestNewsTime(news))); } catch (e) { /* ignore */ }
      setHasUnreadNews(false);
    }
  }, [tab, news]);

  // ── Derived data: matches/tournaments are merged live into player stats
  // on every render — see lib/stats.js combinePlayerStats. Nothing is ever
  // written back to Firestore as a recalculated aggregate, so there is no
  // "recalculate" step to remember to run. ──
  const playersById = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const tournamentsById = useMemo(() => new Map(tournaments.map((t) => [t.id, t])), [tournaments]);
  const matchesByTournament = useMemo(() => {
    const map = new Map();
    for (const m of matches) {
      if (!map.has(m.tournamentId)) map.set(m.tournamentId, []);
      map.get(m.tournamentId).push(m);
    }
    return map;
  }, [matches]);

  const ranked = useMemo(() => {
    const combined = players.map((p) => combinePlayerStats(p, matches, tournamentsById));
    return rankPlayers(combined);
  }, [players, matches, tournamentsById]);
  const rankedById = useMemo(() => new Map(ranked.map((p) => [p.id, p])), [ranked]);
  const rankById = useMemo(() => new Map(ranked.map((p) => [p.id, p.rank])), [ranked]);

  const recentMatches = useMemo(() => recentCompletedMatches(matches, tournamentsById, 6), [matches, tournamentsById]);
  const upcomingTs = useMemo(() => upcomingTournaments(tournaments, 4), [tournaments]);

  const latestNews = pickLatestNews(news);
  const profilePlayer = profileOpenPlayerId ? rankedById.get(profileOpenPlayerId) || null : null;
  const comparePlayer = compareOpenPlayerId ? rankedById.get(compareOpenPlayerId) || null : null;
  const tabsWithAdmin = isAdmin ? [...TABS, ["admin", "Admin"]] : TABS;

  const matchDeadlineExpired = (match, tournament) => {
    const iso = tournament?.deadlines?.[match.round];
    return !!iso && new Date(iso).getTime() < Date.now();
  };

  // ── Auth handlers ──
  const handleLogin = async (email, pass) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (err) {
      return false;
    }
  };
  const handleLogout = async () => {
    await signOut(auth);
  };

  // ── Player CRUD ──
  const addPlayer = async (form) => {
    const { name, club, champion, runnerUp, wins, losses, participated, avatarId, avatarUrl, country, bio } = form;
    try {
      await addDoc(collection(db, "players"), {
        name, club, champion, runnerUp, wins, losses, participated, avatarId, avatarUrl, country, bio,
      });
      alert("เพิ่มผู้เล่นสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  const updatePlayer = async (form) => {
    const { name, club, champion, runnerUp, wins, losses, participated, avatarId, avatarUrl, country, bio } = form;
    try {
      await updateDoc(doc(db, "players", editPlayer.id), {
        name, club, champion, runnerUp, wins, losses, participated, avatarId, avatarUrl, country, bio,
      });
      alert("แก้ไขข้อมูลผู้เล่นสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  const deletePlayer = async (id) => {
    try {
      await deleteDoc(doc(db, "players", id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setDeletePlayerTarget(null);
    }
  };

  // ── Tournament CRUD (legacy / manual entry — used both for editing
  // existing pre-bracket tournaments and as the "บันทึกผลย้อนหลัง" option
  // inside TournamentCreateChooser) ──
  const addTournament = async (form) => {
    try {
      await addDoc(collection(db, "tournaments"), form);
      alert("เพิ่มทัวร์นาเมนต์สำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  const updateTournament = async (form) => {
    try {
      await updateDoc(doc(db, "tournaments", editTournament.id), form);
      alert("แก้ไขทัวร์นาเมนต์สำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  const deleteTournament = async (id) => {
    try {
      const tMatches = matchesByTournament.get(id) || [];
      if (tMatches.length > 0) {
        const batch = writeBatch(db);
        tMatches.forEach((m) => batch.delete(doc(db, "matches", m.id)));
        batch.delete(doc(db, "tournaments", id));
        await batch.commit();
      } else {
        await deleteDoc(doc(db, "tournaments", id));
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setDeleteTournamentTarget(null);
    }
  };

  // ── Bracket creation: random draw + auto-BYE fill, all computed
  // client-side in lib/bracket.js — one atomic batch write, no Cloud
  // Functions needed. ──
  const createBracketTournament = async ({ name, date, season, bracketSize, playerIds }) => {
    const existingCodes = new Set(matches.map((m) => m.verifyCode).filter(Boolean));
    const builtMatches = buildBracket(playerIds, bracketSize, existingCodes); // throws Thai validation errors — let the form catch + alert them
    const tournamentRef = doc(collection(db, "tournaments"));
    const batch = writeBatch(db);
    batch.set(tournamentRef, {
      name, date, season: season || "", bracketSize, playerIds,
      status: "active", createdAt: serverTimestamp(),
    });
    builtMatches.forEach((m) => {
      const mRef = doc(collection(db, "matches"));
      batch.set(mRef, { ...m, tournamentId: tournamentRef.id, matchDate: date || null, createdAt: serverTimestamp() });
    });
    await batch.commit();
  };

  // ── Round deadline (purely a stored ISO string per round — "expired" is
  // computed live on every render by comparing to Date.now(), so there is
  // no cron job / scheduled function needed to enforce it) ──
  const onSetDeadline = async (tournament, roundIndex, iso) => {
    try {
      await updateDoc(doc(db, "tournaments", tournament.id), {
        deadlines: { ...(tournament.deadlines || {}), [roundIndex]: iso || null },
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ── Match result entry + retroactive editing. Retroactive resets and
  // forward advancement are both pure functions (lib/bracket.js) — this
  // handler just merges their outputs into one Firestore batch so the
  // bracket is always left in a consistent state in a single write. ──
  const onOpenResult = (match, tournament) => setMatchResultTarget({ match, tournament });

  const recordMatchResult = async (match, tournament, payload) => {
    try {
      const tournamentMatches = matchesByTournament.get(tournament.id) || [];
      const wasCompletedBefore = match.status === "completed" && !!match.winnerId;
      const isRetroactive = wasCompletedBefore && match.winnerId !== payload.winnerId;
      const finalRound = totalRounds(tournament.bracketSize) - 1;

      const batch = writeBatch(db);
      batch.update(doc(db, "matches", match.id), { ...payload, status: "completed" });

      const updatesMap = new Map();
      let revertFinal = false;

      if (isRetroactive) {
        const resets = computeRetroactiveReset(tournamentMatches, match, tournament.bracketSize);
        resets.forEach((r) => {
          updatesMap.set(r.id, { ...(updatesMap.get(r.id) || {}), ...r.updates });
          const original = tournamentMatches.find((m) => m.id === r.id);
          if (original && original.round === finalRound) revertFinal = true;
        });
      }

      const updatedMatch = { ...match, ...payload, status: "completed" };
      const advancement = computeAdvancement(tournamentMatches, updatedMatch, tournament.bracketSize);

      let tournamentUpdate = null;
      if (advancement?.tournamentComplete) {
        const champ = playersById.get(advancement.championId);
        const runnerUp = playersById.get(advancement.runnerUpId);
        tournamentUpdate = {
          status: "completed",
          championId: advancement.championId,
          runnerUpId: advancement.runnerUpId,
          champion: champ?.name || "",
          runnerUp: runnerUp?.name || "",
        };
      } else if (advancement?.matchUpdate) {
        updatesMap.set(advancement.matchUpdate.id, {
          ...(updatesMap.get(advancement.matchUpdate.id) || {}), ...advancement.matchUpdate.updates,
        });
      }

      if (revertFinal && tournament.status === "completed" && !advancement?.tournamentComplete) {
        tournamentUpdate = { status: "active", championId: null, runnerUpId: null, champion: "", runnerUp: "" };
      }

      updatesMap.forEach((updates, id) => batch.update(doc(db, "matches", id), updates));
      if (tournamentUpdate) batch.update(doc(db, "tournaments", tournament.id), tournamentUpdate);

      await batch.commit();
      setMatchResultTarget(null);

      // Auto-post a News item for semifinal/final results only, so large
      // brackets don't spam the News feed with every single early-round
      // match (explicit scope decision — see DEPLOY_GUIDE.md).
      try {
        const isLateRound = finalRound - match.round <= 1;
        if (!isRetroactive && isLateRound && payload.winnerId) {
          const winnerName = playersById.get(payload.winnerId)?.name || "ผู้เล่น";
          const isFinal = match.round === finalRound;
          await addDoc(collection(db, "news"), {
            title: isFinal ? `🏆 ${winnerName} คว้าแชมป์ ${tournament.name}` : `${winnerName} ผ่านเข้ารอบชิงชนะเลิศ ${tournament.name}`,
            body: isFinal
              ? `${winnerName} คว้าชัยชนะในรอบชิงชนะเลิศของทัวร์นาเมนต์ ${tournament.name} ขอแสดงความยินดี!`
              : `${winnerName} เอาชนะคู่แข่งในรอบรองชนะเลิศ ผ่านเข้าสู่รอบชิงชนะเลิศของ ${tournament.name}`,
            pinned: isFinal,
            author: "ระบบอัตโนมัติ",
            createdAt: serverTimestamp(),
          });
        }
      } catch (newsErr) {
        console.error("Auto-news post failed (non-critical):", newsErr);
      }
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ── News CRUD ──
  const addNews = async (form) => {
    try {
      await addDoc(collection(db, "news"), {
        ...form,
        author: auth.currentUser?.email || "Admin",
        createdAt: serverTimestamp(),
      });
      alert("ประกาศข่าวสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  const updateNews = async (form) => {
    try {
      await updateDoc(doc(db, "news", editNews.id), {
        title: form.title, body: form.body, pinned: form.pinned,
      });
      alert("แก้ไขข่าวสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  const deleteNews = async (id) => {
    try {
      await deleteDoc(doc(db, "news", id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setDeleteNewsTarget(null);
    }
  };

  // ── Rule (single doc, meta/rule). Uses setDoc+merge instead of updateDoc
  // since this doc may not exist yet the first time an admin saves it. ──
  const updateRule = async (form) => {
    try {
      await setDoc(doc(db, "meta", "rule"), {
        body: form.body,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      alert("บันทึกกฎการแข่งขันสำเร็จ");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ── Ranking Movement snapshot: freezes current rank/score on every player
  // doc + stamps meta/rankingSnapshot, so next time getMovement() has a
  // baseline to compare against. No Cloud Functions/cron required. ──
  const handleSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      const batch = writeBatch(db);
      ranked.forEach((p) => {
        batch.update(doc(db, "players", p.id), { previousRank: p.rank, previousScore: p.score });
      });
      batch.set(doc(db, "meta", "rankingSnapshot"), { updatedAt: serverTimestamp() });
      await batch.commit();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSnapshotLoading(false);
    }
  };

  // ── Backup & Restore: client-side JSON export/import only (no Excel
  // dependency, keeps the bundle light). Import is additive/merge — items
  // whose id matches an existing doc are overwritten, everything else is
  // added, nothing is ever deleted automatically. ──
  const onImportJSON = async (data) => {
    const collections = [
      ["players", data.players],
      ["tournaments", data.tournaments],
      ["matches", data.matches],
      ["news", data.news],
    ];
    let batch = writeBatch(db);
    let count = 0;
    for (const [colName, items] of collections) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (!item || !item.id) continue;
        const { id, ...rest } = item;
        batch.set(doc(db, colName, id), rest, { merge: true });
        count++;
        if (count >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
    }
    if (count > 0) await batch.commit();

    // rule isn't a collection — it's the single meta/rule doc — restore it
    // separately if the backup file has one.
    if (data.rule?.body) {
      await setDoc(doc(db, "meta", "rule"), { body: data.rule.body, updatedAt: serverTimestamp() }, { merge: true });
    }
  };

  return (
    <div style={s.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Thai:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        tr:last-child td { border-bottom: none !important; }
        tr:hover td { background: rgba(167,139,250,0.05) !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #07051a; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.25); border-radius: 3px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn .35s ease; }
        @keyframes glow { 0%,100% { box-shadow: 0 0 18px rgba(250,204,21,0.10); } 50% { box-shadow: 0 0 36px rgba(250,204,21,0.22); } }
        .gold-glow { animation: glow 3s ease-in-out infinite; }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
        @media (min-width: 641px) {
          .club-row-mobile { display: none !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .hide-tablet { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <Logo size={38} />
          <div style={{ flex: 1 }}>
            <div style={s.logoText}>iPES</div>
            <div style={s.logoSub}>Tournament Leaderboard</div>
          </div>
          <GlobalSearch
            players={ranked}
            tournaments={tournaments}
            news={news}
            onOpenProfile={(p) => setProfileOpenPlayerId(p.id)}
            onGoTab={setTab}
          />
          {isAdmin ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Pill tone="green"><span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconShield />Admin</span></Pill>
              <button onClick={handleLogout} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                color: "#9b96c4", padding: "6px 12px", fontSize: 12, cursor: "pointer"
              }}>ออกจากระบบ</button>
            </div>
          ) : (
            authChecked && (
              <button onClick={() => setShowLogin(true)} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8,
                color: "#9b96c4", padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}><IconShield />Admin</button>
            )
          )}
        </div>
      </header>

      {/* Main */}
      <main style={s.main}>
        <div style={s.tabs}>
          {tabsWithAdmin.map(([key, label]) => (
            <button key={key} style={s.tab(tab === key)} onClick={() => setTab(key)}>
              {label}{key === "news" && hasUnreadNews && <span style={s.unreadDot} />}
            </button>
          ))}
        </div>

        {loading && <Spinner />}

        {!loading && (
          <>
            {tab === "leaderboard" && (
              <>
                <RecentMatchesWidget
                  matches={recentMatches}
                  playersById={rankedById}
                  tournamentsById={tournamentsById}
                  onOpenProfile={(p) => setProfileOpenPlayerId(p.id)}
                />
                <UpcomingTournamentWidget
                  tournaments={upcomingTs}
                  onGoTournament={() => setTab("tournaments")}
                />
                <LeaderboardTab
                  ranked={ranked}
                  isAdmin={isAdmin}
                  onAdd={() => setShowAddPlayer(true)}
                  onEdit={(p) => setEditPlayer(p)}
                  onDeleteRequest={(p) => setDeletePlayerTarget(p)}
                  onOpenProfile={(p) => setProfileOpenPlayerId(p.id)}
                  latestNews={latestNews}
                  onViewAllNews={() => setTab("news")}
                />
              </>
            )}

            {tab === "clubs" && (
              <ClubRankingTab ranked={ranked} onOpenProfile={(p) => setProfileOpenPlayerId(p.id)} />
            )}

            {tab === "tournaments" && (
              <TournamentArchiveTab
                tournaments={tournaments}
                matchesByTournament={matchesByTournament}
                playersById={rankedById}
                isAdmin={isAdmin}
                onAdd={() => setShowAddTournament(true)}
                onEdit={(t) => setEditTournament(t)}
                onDeleteRequest={(t) => setDeleteTournamentTarget(t)}
                onOpenResult={onOpenResult}
                onSetDeadline={onSetDeadline}
              />
            )}

            {tab === "statsranking" && (
              <StatsRankingTab ranked={ranked} onOpenProfile={(p) => setProfileOpenPlayerId(p.id)} />
            )}

            {tab === "halloffame" && (
              <HallOfFameTab
                ranked={ranked}
                tournaments={tournaments}
                rankedById={rankedById}
                onOpenProfile={(p) => setProfileOpenPlayerId(p.id)}
              />
            )}

            {tab === "news" && (
              <NewsTab
                news={news}
                isAdmin={isAdmin}
                onAdd={() => setShowAddNews(true)}
                onEdit={(n) => setEditNews(n)}
                onDeleteRequest={(n) => setDeleteNewsTarget(n)}
              />
            )}

            {tab === "dashboard" && (
              <DashboardTab
                players={players}
                ranked={ranked}
                lastSnapshotAt={formatDate(lastSnapshotAt)}
                onOpenProfile={(p) => setProfileOpenPlayerId(p.id)}
                matches={matches}
                playersById={rankedById}
                tournamentsById={tournamentsById}
                rankById={rankById}
              />
            )}

            {tab === "rule" && (
              <RuleTab rule={rule} isAdmin={isAdmin} onEdit={() => setShowEditRule(true)} />
            )}

            {tab === "admin" && isAdmin && (
              <AdminDashboardTab
                players={players}
                tournaments={tournaments}
                matches={matches}
                news={news}
                rule={rule}
                lastSnapshotAt={formatDate(lastSnapshotAt)}
                snapshotLoading={snapshotLoading}
                onSnapshot={handleSnapshot}
                onAddPlayer={() => setShowAddPlayer(true)}
                onAddTournament={() => setShowAddTournament(true)}
                onAddNews={() => setShowAddNews(true)}
                onImportJSON={onImportJSON}
              />
            )}
          </>
        )}
      </main>

      {/* ── Auth modal ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />}

      {/* ── Player modals ── */}
      {showAddPlayer && (
        <Modal title="เพิ่มผู้เล่นใหม่" onClose={() => setShowAddPlayer(false)}>
          <PlayerForm onSave={addPlayer} onClose={() => setShowAddPlayer(false)} />
        </Modal>
      )}
      {editPlayer && (
        <Modal title={`แก้ไข: ${editPlayer.name}`} onClose={() => setEditPlayer(null)}>
          <PlayerForm initial={editPlayer} onSave={updatePlayer} onClose={() => setEditPlayer(null)} />
        </Modal>
      )}
      {deletePlayerTarget && (
        <ConfirmDeleteModal
          title="ยืนยันการลบผู้เล่น"
          message={<>คุณต้องการลบข้อมูลของ <b style={{ color: "#f87171" }}>{deletePlayerTarget.name}</b> ออกจากระบบหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</>}
          onCancel={() => setDeletePlayerTarget(null)}
          onConfirm={() => deletePlayer(deletePlayerTarget.id)}
        />
      )}

      {/* ── Tournament modals ── */}
      {showAddTournament && (
        <Modal title="เพิ่มทัวร์นาเมนต์" onClose={() => setShowAddTournament(false)}>
          <TournamentCreateChooser
            players={players}
            onCreateBracket={createBracketTournament}
            onCreateLegacy={addTournament}
            onClose={() => setShowAddTournament(false)}
          />
        </Modal>
      )}
      {editTournament && (
        <Modal title={`แก้ไข: ${editTournament.name}`} onClose={() => setEditTournament(null)}>
          <TournamentForm initial={editTournament} onSave={updateTournament} onClose={() => setEditTournament(null)} />
        </Modal>
      )}
      {deleteTournamentTarget && (
        <ConfirmDeleteModal
          title="ยืนยันการลบทัวร์นาเมนต์"
          message={<>คุณต้องการลบ <b style={{ color: "#f87171" }}>{deleteTournamentTarget.name}</b> ออกจากคลังทัวร์นาเมนต์หรือไม่?{deleteTournamentTarget.bracketSize ? " (รวมถึงผลการแข่งขันทุกแมตช์ในสายนี้)" : ""} การกระทำนี้ไม่สามารถย้อนกลับได้</>}
          onCancel={() => setDeleteTournamentTarget(null)}
          onConfirm={() => deleteTournament(deleteTournamentTarget.id)}
        />
      )}

      {/* ── Match result entry modal (bracket system) ── */}
      {matchResultTarget && (
        <Modal title="กรอกผลการแข่งขัน" onClose={() => setMatchResultTarget(null)}>
          <MatchResultForm
            match={matchResultTarget.match}
            playersById={rankedById}
            allowWinnerOnly={matchDeadlineExpired(matchResultTarget.match, matchResultTarget.tournament)}
            onSave={(payload) => recordMatchResult(matchResultTarget.match, matchResultTarget.tournament, payload)}
            onClose={() => setMatchResultTarget(null)}
          />
        </Modal>
      )}

      {/* ── News modals ── */}
      {showAddNews && (
        <Modal title="ประกาศข่าวใหม่" onClose={() => setShowAddNews(false)}>
          <NewsForm onSave={addNews} onClose={() => setShowAddNews(false)} />
        </Modal>
      )}
      {editNews && (
        <Modal title="แก้ไขข่าว" onClose={() => setEditNews(null)}>
          <NewsForm initial={editNews} onSave={updateNews} onClose={() => setEditNews(null)} />
        </Modal>
      )}
      {deleteNewsTarget && (
        <ConfirmDeleteModal
          title="ยืนยันการลบข่าว"
          message={<>คุณต้องการลบข่าว <b style={{ color: "#f87171" }}>{deleteNewsTarget.title}</b> หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</>}
          onCancel={() => setDeleteNewsTarget(null)}
          onConfirm={() => deleteNews(deleteNewsTarget.id)}
        />
      )}

      {/* ── Rule modal ── */}
      {showEditRule && (
        <Modal title={rule?.body ? "แก้ไขกฎการแข่งขัน" : "เพิ่มกฎการแข่งขัน"} onClose={() => setShowEditRule(false)}>
          <RuleForm initial={rule} onSave={updateRule} onClose={() => setShowEditRule(false)} />
        </Modal>
      )}

      {/* ── Player Profile modal ── */}
      {profilePlayer && (
        <PlayerProfileModal
          player={profilePlayer}
          tournaments={tournaments}
          matches={matches}
          playersById={rankedById}
          tournamentsById={tournamentsById}
          rankById={rankById}
          isAdmin={isAdmin}
          onClose={() => setProfileOpenPlayerId(null)}
          onEdit={(p) => { setProfileOpenPlayerId(null); setEditPlayer(p); }}
          onDelete={(p) => { setProfileOpenPlayerId(null); setDeletePlayerTarget(p); }}
          onCompare={(p) => { setProfileOpenPlayerId(null); setCompareOpenPlayerId(p.id); }}
        />
      )}

      {/* ── Player Compare modal ── */}
      {comparePlayer && (
        <PlayerCompare
          players={ranked}
          initialPlayer={comparePlayer}
          matches={matches}
          tournamentsById={tournamentsById}
          onClose={() => setCompareOpenPlayerId(null)}
        />
      )}
    </div>
  );
}
