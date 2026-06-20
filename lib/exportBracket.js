// lib/exportBracket.js
// Export a single elimination bracket out of the website, two ways:
//   - exportBracketAsImage(): draws the whole bracket on an off-screen
//     <canvas> using the native Canvas 2D API and downloads it as a PNG.
//   - openBracketPrintView(): opens a clean, print-formatted HTML page in a
//     new tab and triggers the browser print dialog — on iPad Safari this
//     lets the person pick "Save as PDF" right from the share sheet.
// Both are dependency-free (no canvas/pdf library) so they work the same
// in dev, on Vercel, and offline-built Codespaces installs.

import { roundLabel, totalRounds } from "./bracket";

function nameOf(playersById, id) {
  if (!id) return null;
  return playersById.get(id)?.name || "ผู้เล่นที่ถูกลบ";
}

// Groups the flat matches array into rounds (array of arrays), each round
// sorted by slot — same shape BracketView builds for rendering on-screen.
function groupRounds(matches, size) {
  const rCount = totalRounds(size);
  return [...Array(rCount).keys()].map((r) =>
    matches.filter((m) => m.round === r).sort((a, b) => a.slot - b.slot)
  );
}

const FILENAME_SAFE = (s) => (s || "bracket").replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\-_]+/g, "_").slice(0, 60);

// ── PNG export via Canvas 2D ─────────────────────────────────────────────
export function exportBracketAsImage(tournament, matches, playersById) {
  const size = tournament.bracketSize;
  const rounds = groupRounds(matches, size);

  // Layout constants
  const cardW = 240, cardH = 64, cardGapY = 22, colGapX = 70;
  const headerH = 90;
  const padding = 40;

  // Column x position for each round; vertical position computed per-match
  // using the classic bracket spacing formula (each round's gap doubles).
  const colX = rounds.map((_, r) => padding + r * (cardW + colGapX));
  const baseGap = cardH + cardGapY;
  const colTopY = (r) => headerH + (Math.pow(2, r) - 1) * (baseGap / 2);
  const colStepY = (r) => baseGap * Math.pow(2, r);

  const width = padding * 2 + rounds.length * cardW + (rounds.length - 1) * colGapX;
  const round0Height = rounds[0].length * baseGap;
  const height = headerH + round0Height + padding;

  const canvas = document.createElement("canvas");
  const scale = 2; // crisp on retina/iPad screens
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#07051a";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#f1f0ff";
  ctx.font = "bold 22px 'Noto Sans Thai', sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(tournament.name || "ตารางสายการแข่งขัน", padding, 22);
  ctx.fillStyle = "#9b96c4";
  ctx.font = "13px 'Noto Sans Thai', sans-serif";
  const sub = [tournament.season, tournament.date].filter(Boolean).join(" · ");
  if (sub) ctx.fillText(sub, padding, 52);

  const cardCenterY = (r, slot) => colTopY(r) + slot * colStepY(r) + cardH / 2;

  // Connector lines between rounds (drawn first, under the cards)
  ctx.strokeStyle = "rgba(167,139,250,0.25)";
  ctx.lineWidth = 1.5;
  for (let r = 1; r < rounds.length; r++) {
    rounds[r].forEach((m, slot) => {
      const x = colX[r];
      const yTo = cardCenterY(r, slot);
      const yFromA = cardCenterY(r - 1, slot * 2);
      const yFromB = cardCenterY(r - 1, slot * 2 + 1);
      const midX = colX[r - 1] + cardW + colGapX / 2;
      ctx.beginPath();
      ctx.moveTo(colX[r - 1] + cardW, yFromA);
      ctx.lineTo(midX, yFromA);
      ctx.lineTo(midX, yFromB);
      ctx.lineTo(colX[r - 1] + cardW, yFromB);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, (yFromA + yFromB) / 2);
      ctx.lineTo(x, yTo);
      ctx.stroke();
    });
  }

  // Round headers + match cards
  rounds.forEach((roundMatches, r) => {
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "bold 13px 'Noto Sans Thai', sans-serif";
    ctx.fillText(roundLabel(r, size), colX[r], headerH - 26);

    roundMatches.forEach((m, slot) => {
      const x = colX[r];
      const y = cardCenterY(r, slot) - cardH / 2;
      const completed = m.status === "completed";
      const isBye = m.status === "bye";

      // Card background
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.strokeStyle = completed ? "rgba(74,222,128,0.35)" : "rgba(167,139,250,0.15)";
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();

      // Divider
      ctx.strokeStyle = "rgba(167,139,250,0.12)";
      ctx.beginPath();
      ctx.moveTo(x + 10, y + cardH / 2);
      ctx.lineTo(x + cardW - 10, y + cardH / 2);
      ctx.stroke();

      const nameA = nameOf(playersById, m.playerAId) || (isBye ? "" : "รอผลรอบก่อนหน้า");
      const nameB = isBye ? "BYE" : (nameOf(playersById, m.playerBId) || "รอผลรอบก่อนหน้า");
      const winnerA = m.winnerId === m.playerAId;
      const winnerB = m.winnerId === m.playerBId;

      drawRow(ctx, x, y, cardW, nameA, completed ? m.scoreA : null, winnerA, !!m.playerAId);
      drawRow(ctx, x, y + cardH / 2, cardW, nameB, completed ? m.scoreB : null, winnerB, !!m.playerBId || isBye);

      // Verification code, small, bottom-right corner under the card
      if (m.verifyCode && !isBye) {
        ctx.fillStyle = "#22d3ee";
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText(m.verifyCode, x + cardW - 8, y + cardH + 4);
        ctx.textAlign = "left";
      }
    });
  });

  // Footer credit
  ctx.fillStyle = "#6e6a96";
  ctx.font = "11px 'Noto Sans Thai', sans-serif";
  ctx.fillText("iPES Tournament Leaderboard", padding, height - 22);

  const link = document.createElement("a");
  link.download = `${FILENAME_SAFE(tournament.name)}-bracket.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRow(ctx, x, y, w, name, score, isWinner, hasPlayer) {
  ctx.fillStyle = hasPlayer ? (isWinner ? "#ffffff" : "#9b96c4") : "rgba(155,150,196,0.5)";
  ctx.font = isWinner ? "bold 13px 'Noto Sans Thai', sans-serif" : "13px 'Noto Sans Thai', sans-serif";
  const maxNameW = score != null ? w - 60 : w - 20;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, 32);
  ctx.clip();
  ctx.fillText(truncateToWidth(ctx, name || "—", maxNameW), x + 12, y + 9);
  ctx.restore();
  if (score != null) {
    ctx.fillStyle = isWinner ? "#22d3ee" : "#6e6a96";
    ctx.font = "bold 13px 'Noto Sans Thai', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(String(score), x + w - 12, y + 9);
    ctx.textAlign = "left";
  }
}

function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid) + "…";
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid; else hi = mid - 1;
  }
  return text.slice(0, lo) + "…";
}

// ── PDF export via browser print dialog ─────────────────────────────────
// Opens a new tab with a clean, print-formatted version of the bracket and
// triggers window.print(). On iPad Safari the print sheet has a built-in
// "Save to Files" / share option that produces a real PDF — no library
// needed. Uses CSS so each round's column stays together and the page
// prints landscape, which fits a wide bracket far better than portrait.
export function openBracketPrintView(tournament, matches, playersById) {
  const size = tournament.bracketSize;
  const rounds = groupRounds(matches, size);

  const cardHtml = (m, isBye) => {
    const nameA = nameOf(playersById, m.playerAId) || (isBye ? "" : "รอผลรอบก่อนหน้า");
    const nameB = isBye ? "BYE" : (nameOf(playersById, m.playerBId) || "รอผลรอบก่อนหน้า");
    const winnerA = m.winnerId === m.playerAId;
    const winnerB = m.winnerId === m.playerBId;
    const showPenalty = m.status === "completed" && m.penA != null && m.penB != null;
    return `
      <div class="match ${m.status === "completed" ? "done" : ""}">
        <div class="row ${winnerA ? "winner" : ""}">
          <span class="name">${escapeHtml(nameA || "—")}</span>
          <span class="score">${m.status === "completed" && m.scoreA != null ? m.scoreA : ""}</span>
        </div>
        <div class="divider"></div>
        <div class="row ${winnerB ? "winner" : ""}">
          <span class="name">${escapeHtml(nameB || "—")}</span>
          <span class="score">${m.status === "completed" && m.scoreB != null ? m.scoreB : ""}</span>
        </div>
        ${m.verifyCode && !isBye ? `<div class="code">${m.verifyCode}</div>` : ""}
        ${showPenalty ? `<div class="pen">จุดโทษ ${m.penA}-${m.penB}</div>` : ""}
      </div>`;
  };

  const columnsHtml = rounds.map((roundMatches, r) => `
    <div class="col">
      <div class="col-title">${roundLabel(r, size)}</div>
      ${roundMatches.map((m) => cardHtml(m, m.status === "bye")).join("")}
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8" />
<title>${escapeHtml(tournament.name || "ตารางสายการแข่งขัน")}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans Thai', 'Segoe UI', sans-serif; margin: 0; padding: 0; color: #111; }
  header { margin-bottom: 14px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .sub { font-size: 12px; color: #555; }
  .board { display: flex; gap: 18px; align-items: flex-start; }
  .col { flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 14px; }
  .col-title { font-size: 12px; font-weight: 700; color: #555; margin-bottom: 2px; }
  .match { border: 1px solid #ccc; border-radius: 8px; padding: 6px 8px; font-size: 12px; page-break-inside: avoid; }
  .match.done { border-color: #16a34a; }
  .row { display: flex; justify-content: space-between; gap: 8px; padding: 3px 0; }
  .row.winner { font-weight: 700; }
  .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .score { font-weight: 700; }
  .divider { border-top: 1px solid #ddd; }
  .code { margin-top: 4px; font-family: ui-monospace, monospace; font-size: 9px; color: #0891b2; text-align: right; }
  .pen { font-size: 9px; color: #777; }
  footer { margin-top: 16px; font-size: 10px; color: #888; }
  @media print { .noprint { display: none; } }
</style>
</head><body>
  <header>
    <h1>${escapeHtml(tournament.name || "ตารางสายการแข่งขัน")}</h1>
    <div class="sub">${escapeHtml([tournament.season, tournament.date].filter(Boolean).join(" · "))}</div>
  </header>
  <div class="board">${columnsHtml}</div>
  <footer>iPES Tournament Leaderboard</footer>
  <script>window.onload = () => setTimeout(() => window.print(), 200);</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("เบราว์เซอร์บล็อกการเปิดหน้าต่างใหม่ กรุณาอนุญาต Pop-up สำหรับเว็บนี้แล้วลองอีกครั้ง");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
