// scripts/seed.mjs
// Usage: node scripts/seed.mjs
// Requires .env.local to be set up (loads via dotenv).

import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const PLAYERS = [
  { name: "ไทเทิล คิง", club: "Manchester City", champion: 5, runnerUp: 3, wins: 42, losses: 8, participated: 12 },
  { name: "สตรีค มาสเตอร์", club: "Real Madrid", champion: 4, runnerUp: 2, wins: 38, losses: 12, participated: 11 },
  { name: "ฟิเนสส์ FC", club: "Liverpool", champion: 3, runnerUp: 5, wins: 35, losses: 15, participated: 13 },
  { name: "เดดบอล สเปเชียลลิสต์", club: "Bayern München", champion: 3, runnerUp: 1, wins: 29, losses: 10, participated: 9 },
  { name: "ทิกิ-ทาก้า", club: "FC Barcelona", champion: 2, runnerUp: 4, wins: 31, losses: 18, participated: 10 },
  { name: "เคาน์เตอร์ คิง", club: "Inter Milan", champion: 2, runnerUp: 2, wins: 26, losses: 14, participated: 8 },
  { name: "ปาร์ค เดอะ บัส", club: "Atletico Madrid", champion: 1, runnerUp: 3, wins: 22, losses: 20, participated: 9 },
  { name: "เจไก ออฟไซด์", club: "Arsenal", champion: 1, runnerUp: 2, wins: 19, losses: 17, participated: 7 },
  { name: "ฟรีคิก ผู้เชี่ยวชาญ", club: "Juventus", champion: 1, runnerUp: 1, wins: 17, losses: 15, participated: 6 },
  { name: "นิวบี้ ราชา", club: "PSG", champion: 0, runnerUp: 2, wins: 14, losses: 18, participated: 7 },
  { name: "กัปตัน เรนโบว์", club: "Chelsea", champion: 0, runnerUp: 1, wins: 10, losses: 14, participated: 5 },
  { name: "ปาเก็ต นิวตัน", club: "AC Milan", champion: 0, runnerUp: 0, wins: 7, losses: 12, participated: 4 },
];

const TOURNAMENTS = [
  {
    name: "iPES Season Cup #4", date: "2026-05-30",
    champion: "ไทเทิล คิง", runnerUp: "สตรีค มาสเตอร์", third: "ฟิเนสส์ FC",
    participants: 32, notes: "แข่งแบบแพ้คัดออก สาย Single Elimination",
  },
  {
    name: "iPES Season Cup #3", date: "2026-03-14",
    champion: "สตรีค มาสเตอร์", runnerUp: "ทิกิ-ทาก้า", third: "เดดบอล สเปเชียลลิสต์",
    participants: 28, notes: "",
  },
  {
    name: "iPES Winter Invitational", date: "2026-01-10",
    champion: "ไทเทิล คิง", runnerUp: "เคาน์เตอร์ คิง", third: "",
    participants: 16, notes: "ทัวร์นาเมนต์เชิญผู้เล่นระดับท็อป 16 คนเท่านั้น",
  },
];

const NEWS = [
  {
    title: "เปิดรับสมัคร iPES Season Cup #5",
    body: "เปิดรับสมัครผู้เล่นเข้าร่วม iPES Season Cup #5 แล้ว ติดต่อแอดมินเพื่อลงทะเบียนได้ตั้งแต่วันนี้ จำนวนจำกัด 32 ที่",
    pinned: true,
  },
  {
    title: "สรุปผล iPES Season Cup #4",
    body: "ขอแสดงความยินดีกับไทเทิล คิง แชมป์ iPES Season Cup #4 คนล่าสุด! ขอบคุณผู้เล่นทุกคนที่เข้าร่วมการแข่งขันในครั้งนี้",
    pinned: false,
  },
];

async function seedCollection(db, name, docs, labelField) {
  const existing = await getDocs(collection(db, name));
  if (!existing.empty) {
    console.log(`${name} collection already has ${existing.size} docs. Skipping seed.`);
    return;
  }
  for (const d of docs) {
    await addDoc(collection(db, name), d);
    console.log(`Added (${name}):`, d[labelField]);
  }
  console.log(`Done seeding ${docs.length} ${name}.`);
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  await seedCollection(db, "players", PLAYERS, "name");
  await seedCollection(db, "tournaments", TOURNAMENTS, "name");
  await seedCollection(db, "news", NEWS, "title");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
