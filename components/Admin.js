// components/Admin.js
"use client";

import { useRef, useState } from "react";
import { IconPlus, IconShield, IconTrophy, IconNews, IconDownload, SectionHeader } from "./ui";
import { colors, card, btnPrimary, btnGhost } from "../lib/theme";

const StatChip = ({ value, label }) => (
  <div style={{ ...card, flex: "1 1 130px", textAlign: "center" }}>
    <div style={{ fontWeight: 800, fontSize: 26, color: colors.cyan }}>{value}</div>
    <div style={{ color: colors.faint, fontSize: 12, marginTop: 4 }}>{label}</div>
  </div>
);

const ActionRow = ({ icon, title, desc, buttonLabel, onClick }) => (
  <div style={{ ...card, display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
    <div style={{
      width: 40, height: 40, borderRadius: 10, background: "rgba(167,139,250,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center", color: colors.violetLight, flexShrink: 0,
    }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{title}</div>
      <div style={{ fontSize: 12, color: colors.faint, marginTop: 2 }}>{desc}</div>
    </div>
    <button onClick={onClick} style={{ ...btnPrimary, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
      <IconPlus />{buttonLabel}
    </button>
  </div>
);

// CSV has no quoting library — escape minimal cases (commas/quotes/newlines) by hand,
// good enough for player names/clubs in this dataset.
const toCsvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadBlob = (filename, text, type) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const BackupRestoreSection = ({ players, tournaments, matches, news, rule, clubs, onImportJSON }) => {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const exportJSON = () => {
    const payload = { exportedAt: new Date().toISOString(), players, tournaments, matches, news, rule, clubs };
    downloadBlob(`ipes-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const exportCSV = () => {
    const cols = ["name", "club", "champion", "runnerUp", "wins", "losses", "participated", "country"];
    const rows = [cols.join(",")].concat(players.map((p) => cols.map((c) => toCsvCell(p[c])).join(",")));
    downloadBlob(`ipes-players-${new Date().toISOString().slice(0, 10)}.csv`, rows.join("\n"), "text/csv");
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || (!data.players && !data.tournaments && !data.matches && !data.news && !data.clubs)) {
        throw new Error("ไฟล์ไม่ถูกต้อง หรือไม่มีข้อมูลที่รู้จัก");
      }
      const counts = [data.players?.length || 0, data.tournaments?.length || 0, data.matches?.length || 0, data.news?.length || 0, data.clubs?.length || 0];
      if (!window.confirm(`นำเข้าข้อมูล: ผู้เล่น ${counts[0]}, ทัวร์นาเมนต์ ${counts[1]}, แมตช์ ${counts[2]}, ข่าว ${counts[3]}, สโมสร์ ${counts[4]} รายการ\nรายการที่มี ID ตรงกับของเดิมจะถูกเขียนทับ ส่วนรายการอื่นจะเพิ่มใหม่ ดำเนินการต่อหรือไม่?`)) {
        return;
      }
      await onImportJSON(data);
      alert("นำเข้าข้อมูลสำเร็จ");
    } catch (err) {
      console.error(err);
      alert("นำเข้าข้อมูลไม่สำเร็จ: " + err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: colors.violetLight, display: "flex" }}><IconDownload /></span>
        <div style={{ fontWeight: 700, color: "#fff" }}>สำรอง / กู้คืนข้อมูล (Backup &amp; Restore)</div>
      </div>
      <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6, marginBottom: 14 }}>
        ดาวน์โหลดข้อมูลทั้งหมดเก็บไว้เป็นไฟล์ JSON ได้ทุกเมื่อ และนำกลับมากู้คืนได้หากข้อมูลผิดพลาด
        (ไฟล์ CSV สำหรับเปิดดูในสเปรดชีตเฉพาะข้อมูลผู้เล่น ไม่รองรับการนำเข้ากลับ)
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={exportJSON} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6 }}>
          <IconDownload />Export JSON (สำรองทั้งหมด)
        </button>
        <button onClick={exportCSV} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 6 }}>
          <IconDownload />Export CSV (ผู้เล่น)
        </button>
        <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ ...btnPrimary, opacity: busy ? 0.6 : 1 }}>
          {busy ? "กำลังนำเข้า..." : "นำเข้าไฟล์ Backup (JSON)"}
        </button>
        <input ref={fileRef} type="file" accept="application/json" onChange={handleFile} style={{ display: "none" }} />
      </div>
    </div>
  );
};

export const AdminDashboardTab = ({
  players, tournaments, matches, news, rule, clubs, lastSnapshotAt, snapshotLoading,
  onSnapshot, onAddPlayer, onAddTournament, onAddNews, onManageClubs, onImportJSON,
}) => (
  <div className="fade-in">
    <SectionHeader title="Admin Dashboard" subtitle="ศูนย์กลางจัดการเว็บไซต์ iPES Leaderboard" />

    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
      <StatChip value={players.length} label="ผู้เล่นในระบบ" />
      <StatChip value={tournaments.length} label="ทัวร์นาเมนต์ในคลัง" />
      <StatChip value={matches ? matches.length : 0} label="แมตช์ทั้งหมด" />
      <StatChip value={news.length} label="ข่าวที่ประกาศ" />
    </div>

    <BackupRestoreSection players={players} tournaments={tournaments} matches={matches || []} news={news} rule={rule} clubs={clubs} onImportJSON={onImportJSON} />

    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: colors.violetLight, display: "flex" }}><IconShield /></span>
        <div style={{ fontWeight: 700, color: "#fff" }}>บันทึกอันดับปัจจุบัน (Ranking Snapshot)</div>
      </div>
      <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6, marginBottom: 14 }}>
        กดปุ่มนี้เพื่อบันทึกอันดับและคะแนนปัจจุบันของผู้เล่นทุกคน ระบบจะใช้ค่านี้เป็นฐานเทียบ
        เพื่อแสดงลูกศร ▲▼ &quot;ความเคลื่อนไหวอันดับ&quot; ในหน้าอันดับและหน้าสถิติ ครั้งถัดไป
        แนะนำให้กดทุกครั้งหลังอัปเดตผลแข่งขันเสร็จในแต่ละสัปดาห์/รอบ
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 12, color: colors.faint }}>
          {lastSnapshotAt ? `บันทึกล่าสุด: ${lastSnapshotAt}` : "ยังไม่เคยบันทึก"}
        </div>
        <button onClick={onSnapshot} disabled={snapshotLoading} style={{ ...btnPrimary, opacity: snapshotLoading ? 0.6 : 1 }}>
          {snapshotLoading ? "กำลังบันทึก..." : "บันทึกอันดับตอนนี้"}
        </button>
      </div>
    </div>

    <div style={{ fontWeight: 700, color: "#f1f0ff", marginBottom: 12, fontSize: 14 }}>เพิ่มข้อมูลด่วน</div>
    <ActionRow icon={<IconPlus />} title="ผู้เล่นใหม่" desc="เพิ่มผู้เล่นเข้าสู่กระดานอันดับ" buttonLabel="เพิ่มผู้เล่น" onClick={onAddPlayer} />
    <ActionRow icon={<IconTrophy />} title="ทัวร์นาเมนต์ใหม่" desc="บันทึกผลการแข่งขันลงคลังทัวร์นาเมนต์" buttonLabel="เพิ่มทัวร์นาเมนต์" onClick={onAddTournament} />
    <ActionRow icon={<IconNews />} title="ประกาศข่าว" desc="แจ้งข่าวสารหรืออัปเดตให้ผู้เล่นเห็น" buttonLabel="ประกาศข่าว" onClick={onAddNews} />
    <ActionRow icon={<IconShield />} title="จัดการโลโก้สโมสร์" desc="อัพโหลดลิงก์รูปโลโก้ให้แต่ละสโมสร์ เพื่อขึ้นแสดงในหน้าอันดับ" buttonLabel="จัดการสโมสร์" onClick={onManageClubs} />

    <div style={{ fontSize: 12, color: colors.faint, marginTop: 16, lineHeight: 1.7 }}>
      💡 การแก้ไข/ลบผู้เล่น สโมสร หรือทัวร์นาเมนต์ที่มีอยู่แล้ว ทำได้จากปุ่มแก้ไข/ลบในแต่ละแท็บ
      (อันดับ, คลังทัวร์นาเมนต์, ข่าวสาร) โดยตรง
    </div>
  </div>
);
