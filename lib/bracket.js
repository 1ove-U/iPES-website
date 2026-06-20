// lib/bracket.js
// Pure, dependency-free Single Elimination bracket logic.
// - No seeding, random draw only (per spec).
// - BYEs are only ever introduced in Round 0 (first round) to pad the
//   bracket up to a power-of-two size, and a BYE always auto-advances the
//   real player paired against it.
// - Everything here works on plain arrays/objects so it can run both in the
//   browser (components/Bracket.js) and in scripts/seed.mjs.

export const BRACKET_SIZES = [8, 16, 32, 64, 128];

// ── Match Verification Code ──────────────────────────────────────────────
// A short, human-typeable code unique to each match, generated the moment
// the bracket is drawn ("จับสาย") so both players can show it on-screen to
// confirm they're looking at the right fixture before they play. Format:
// "IPES-XXXX" using an unambiguous 32-char alphabet (no 0/O/1/I/L) to avoid
// confusion when read aloud or typed on a phone keyboard.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCode(len = 4) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `IPES-${out}`;
}

// Generates `count` verification codes guaranteed unique against each other
// AND against any codes already in use elsewhere in the system (pass the
// full existing set in `existingCodes`, e.g. every match's verifyCode from
// Firestore) — so codes never repeat across tournaments either.
export function generateVerificationCodes(count, existingCodes = new Set()) {
  const used = new Set(existingCodes);
  const codes = [];
  for (let i = 0; i < count; i++) {
    let code;
    do {
      code = randomCode();
    } while (used.has(code));
    used.add(code);
    codes.push(code);
  }
  return codes;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function totalRounds(size) {
  return Math.log2(size);
}

// Human (Thai) label for a round, given its index (0 = first round) and the
// bracket size the tournament started with.
export function roundLabel(roundIndex, size) {
  const rounds = totalRounds(size);
  const remaining = rounds - roundIndex; // matches left including this one
  if (remaining === 1) return "รอบชิงชนะเลิศ";
  if (remaining === 2) return "รอบรองชนะเลิศ";
  if (remaining === 3) return "รอบก่อนรองชนะเลิศ";
  const teamsInRound = size / Math.pow(2, roundIndex);
  return `รอบ ${teamsInRound} ทีม`;
}

// Builds every round of a fresh bracket in one shot. Rounds after the first
// start with playerAId/playerBId = null ("waiting_prev") except where a
// Round 0 BYE lets a winner cascade straight in.
// Returns a flat array of match objects: { round, slot, playerAId,
// playerBId, status, winnerId }. Caller is responsible for attaching
// tournamentId and writing each one as its own Firestore doc.
export function buildBracket(playerIds, size, existingCodes = new Set()) {
  const n = playerIds.length;
  if (n < 1) throw new Error("ต้องเลือกผู้เล่นอย่างน้อย 1 คน");
  if (n > size) throw new Error("จำนวนผู้เล่นที่เลือกมากกว่าขนาดสายที่เลือก");
  if (n < size / 2) {
    throw new Error("จำนวนผู้เล่นน้อยเกินไปสำหรับขนาดสายนี้ (ต้องมีอย่างน้อยครึ่งหนึ่งของขนาดสาย) กรุณาเลือกขนาดสายให้เล็กลง");
  }

  const matchCount0 = size / 2;
  const byes = size - n;
  const byeMatchIndices = new Set(shuffle([...Array(matchCount0).keys()]).slice(0, byes));
  const shuffledPlayers = shuffle(playerIds);

  // Every match in the bracket — including BYE and not-yet-decided
  // "waiting_prev" matches — gets its own permanent verification code right
  // away, so the code is already on display the instant the draw happens
  // and never changes as the bracket fills in.
  const totalMatchCount = matchCount0 * 2 - 1; // full single-elim match count for this size
  const codes = generateVerificationCodes(totalMatchCount, existingCodes);
  let codeCursor = 0;
  const nextCode = () => codes[codeCursor++];

  const rounds = [];
  const round0 = [];
  let cursor = 0;
  for (let i = 0; i < matchCount0; i++) {
    const hasBye = byeMatchIndices.has(i);
    const playerAId = shuffledPlayers[cursor++];
    const playerBId = hasBye ? null : shuffledPlayers[cursor++];
    round0.push({
      round: 0,
      slot: i,
      playerAId,
      playerBId,
      status: hasBye ? "bye" : "waiting",
      winnerId: hasBye ? playerAId : null,
      scoreA: null, scoreB: null, penA: null, penB: null,
      verifyCode: nextCode(),
    });
  }
  rounds.push(round0);

  const rCount = totalRounds(size);
  for (let r = 1; r < rCount; r++) {
    const prev = rounds[r - 1];
    const round = [];
    for (let i = 0; i < prev.length / 2; i++) {
      const feedA = prev[i * 2];
      const feedB = prev[i * 2 + 1];
      const playerAId = feedA.winnerId || null;
      const playerBId = feedB.winnerId || null;
      round.push({
        round: r,
        slot: i,
        playerAId,
        playerBId,
        status: playerAId && playerBId ? "waiting" : "waiting_prev",
        winnerId: null,
        scoreA: null, scoreB: null, penA: null, penB: null,
        verifyCode: nextCode(),
      });
    }
    rounds.push(round);
  }

  return rounds.flat();
}

// Decide a match winner from entered scores. If scores tie, the penalty
// score (if provided) breaks the tie. Returns the winning player's id, or
// null if not decidable yet.
export function decideWinner(match) {
  const { playerAId, playerBId, scoreA, scoreB, penA, penB } = match;
  if (scoreA == null || scoreB == null) return null;
  if (scoreA > scoreB) return playerAId;
  if (scoreB > scoreA) return playerBId;
  if (penA == null || penB == null) return null; // tied, no shootout entered yet
  if (penA > penB) return playerAId;
  if (penB > penA) return playerBId;
  return null; // still tied — invalid, caller should ask again
}

// Given the full match list (with Firestore doc ids attached as `id`) for a
// tournament and the match that was just completed, figure out which other
// doc needs updating to push the winner into the next round — or, if it was
// the final, return the tournament-completion payload instead.
// matches: [{ id, round, slot, ... }]
export function computeAdvancement(matches, completedMatch, size) {
  const rCount = totalRounds(size);
  const isFinal = completedMatch.round === rCount - 1;
  if (isFinal) {
    const loserId = completedMatch.winnerId === completedMatch.playerAId
      ? completedMatch.playerBId
      : completedMatch.playerAId;
    return { tournamentComplete: true, championId: completedMatch.winnerId, runnerUpId: loserId };
  }
  const nextRound = completedMatch.round + 1;
  const nextSlot = Math.floor(completedMatch.slot / 2);
  const isA = completedMatch.slot % 2 === 0;
  const target = matches.find((m) => m.round === nextRound && m.slot === nextSlot);
  if (!target) return null;
  const updates = isA ? { playerAId: completedMatch.winnerId } : { playerBId: completedMatch.winnerId };
  const otherFilled = isA ? target.playerBId : target.playerAId;
  updates.status = otherFilled ? "waiting" : "waiting_prev";
  return { matchUpdate: { id: target.id, updates } };
}

// Retroactive editing: when a previously-completed match's winner changes
// (or is cleared), every later-round match that was populated from the OLD
// winner — and anything that cascaded further from those — must be wiped
// back to "waiting_prev" so the bracket re-plays honestly from that point
// forward. Returns a list of { id, updates } to apply (does not mutate).
export function computeRetroactiveReset(matches, editedMatch, size) {
  const rCount = totalRounds(size);
  const resets = [];
  let round = editedMatch.round;
  let slot = editedMatch.slot;

  while (round < rCount - 1) {
    const nextRound = round + 1;
    const nextSlot = Math.floor(slot / 2);
    const isA = slot % 2 === 0;
    const target = matches.find((m) => m.round === nextRound && m.slot === nextSlot);
    if (!target) break;

    const wasDecided = !!target.winnerId;
    const updates = isA
      ? { playerAId: null, status: "waiting_prev", scoreA: null, scoreB: null, penA: null, penB: null, winnerId: null }
      : { playerBId: null, status: "waiting_prev", scoreA: null, scoreB: null, penA: null, penB: null, winnerId: null };
    resets.push({ id: target.id, updates });

    if (!wasDecided) break; // nothing further down depended on this match yet
    round = nextRound;
    slot = nextSlot;
  }
  return resets;
}
