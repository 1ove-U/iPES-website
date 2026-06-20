// components/Avatar.js
"use client";

// Player Profile avatars. These are original geometric "player card" badges
// in the iPES brand gradient — NOT screenshots or artwork taken from the
// eFootball game itself (that's Konami's copyrighted material and can't be
// reproduced here). Each preset pairs a glyph with a gradient so players can
// pick a card that feels personalized. Admins can also paste their own image
// URL instead (e.g. a cropped photo they own the rights to).
export const AVATAR_PRESETS = [
  { id: "av1", glyph: "ball", from: "#22d3ee", to: "#0891b2" },
  { id: "av2", glyph: "bolt", from: "#a78bfa", to: "#6d28d9" },
  { id: "av3", glyph: "star", from: "#facc15", to: "#b45309" },
  { id: "av4", glyph: "flame", from: "#fb923c", to: "#c2410c" },
  { id: "av5", glyph: "crown", from: "#e879f9", to: "#a21caf" },
  { id: "av6", glyph: "target", from: "#4ade80", to: "#15803d" },
  { id: "av7", glyph: "wing", from: "#cbd5e1", to: "#475569" },
  { id: "av8", glyph: "gem", from: "#60a5fa", to: "#1d4ed8" },
  { id: "av9", glyph: "comet", from: "#f472b6", to: "#9d174d" },
  { id: "av10", glyph: "shieldstar", from: "#34d399", to: "#0f766e" },
  { id: "av11", glyph: "trophy", from: "#fbbf24", to: "#92400e" },
  { id: "av12", glyph: "pad", from: "#818cf8", to: "#3730a3" },
];

function Glyph({ type, color = "#fff" }) {
  const common = { width: "55%", height: "55%", fill: "none", stroke: color, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" };
  switch (type) {
    case "ball":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9" /><path d="M12 6l4 3-1.5 5h-5L8 9z" /><path d="M12 6V3M16 9l3-1M16 14l2.5 2M8 14l-2.5 2M8 9l-3-1" /></svg>;
    case "bolt":
      return <svg viewBox="0 0 24 24" {...common} fill={color} stroke="none"><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></svg>;
    case "star":
      return <svg viewBox="0 0 24 24" {...common} fill={color} stroke="none"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 6.9L12 17.7 5.8 21.1l1.4-6.9L2 9.4l7-.9z" /></svg>;
    case "flame":
      return <svg viewBox="0 0 24 24" {...common} fill={color} stroke="none"><path d="M12 2c2 3-3 4-1 8 1 2 4 1 4 4a5 5 0 11-10 0c0-5 4-6 7-12z" /></svg>;
    case "crown":
      return <svg viewBox="0 0 24 24" {...common} fill={color} stroke="none"><path d="M3 8l4 4 5-7 5 7 4-4 1 11H2z" /></svg>;
    case "target":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill={color} /></svg>;
    case "wing":
      return <svg viewBox="0 0 24 24" {...common}><path d="M3 14c4 1 6-2 6-6 2 3 2 7-1 9M21 14c-4 1-6-2-6-6-2 3-2 7 1 9" /></svg>;
    case "gem":
      return <svg viewBox="0 0 24 24" {...common} fill={color} stroke="none"><path d="M6 3h12l3 5-9 13L3 8z" /></svg>;
    case "comet":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="17" cy="7" r="3" fill={color} stroke="none" /><path d="M14 10 4 20" /><path d="M11 12l-5-1m6 6-1-5" /></svg>;
    case "shieldstar":
      return <svg viewBox="0 0 24 24" {...common}><path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" /><path d="M12 8l1.4 2.8 3.1.4-2.2 2.2.5 3.1L12 15l-2.8 1.5.5-3.1-2.2-2.2 3.1-.4z" fill={color} stroke="none" /></svg>;
    case "trophy":
      return <svg viewBox="0 0 24 24" {...common} fill={color} stroke="none"><path d="M7 2h10v2h3v3a4 4 0 01-4 4 6 6 0 01-2 4.5V18h3v2H7v-2h3v-2.5A6 6 0 018 11 4 4 0 014 7V4h3z" /></svg>;
    case "pad":
      return <svg viewBox="0 0 24 24" {...common}><rect x="2" y="8" width="20" height="10" rx="4" /><path d="M7 12h2M8 11v2M16 12.5h.01M18.5 10.5h.01" /></svg>;
    default:
      return null;
  }
}

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0].slice(0, 2) : (parts[0][0] + parts[1][0]);
}

function hashColor(name) {
  const palette = ["#22d3ee", "#a78bfa", "#facc15", "#4ade80", "#f472b6", "#fb923c"];
  let h = 0;
  for (const ch of name || "") h = (h * 31 + ch.charCodeAt(0)) % 997;
  return palette[h % palette.length];
}

// size in px. player = { avatarUrl?, avatarId?, name }
export const Avatar = ({ player, size = 44, radius = 12 }) => {
  const wrap = {
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
  };

  if (player?.avatarUrl) {
    return (
      <div style={{ ...wrap, background: "#1a1640" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={player.avatarUrl} alt={player.name || "avatar"} width={size} height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  const preset = AVATAR_PRESETS.find((a) => a.id === player?.avatarId);
  if (preset) {
    return (
      <div style={{ ...wrap, background: `linear-gradient(150deg, ${preset.from}, ${preset.to})` }}>
        <Glyph type={preset.glyph} color="rgba(255,255,255,0.95)" />
      </div>
    );
  }

  const color = hashColor(player?.name || "");
  return (
    <div style={{ ...wrap, background: "rgba(255,255,255,0.06)", border: `1px solid ${color}55` }}>
      <span style={{ color, fontWeight: 800, fontSize: size * 0.36 }}>{initialsOf(player?.name)}</span>
    </div>
  );
};

// Grid picker used inside PlayerForm so an admin can assign a card to a player.
export const AvatarPicker = ({ value, onChange }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
    {AVATAR_PRESETS.map((preset) => {
      const active = value === preset.id;
      return (
        <button
          key={preset.id}
          type="button"
          onClick={() => onChange(active ? null : preset.id)}
          style={{
            border: active ? "2px solid #22d3ee" : "2px solid transparent",
            borderRadius: 12, padding: 2, background: "none", cursor: "pointer",
          }}
        >
          <div style={{
            width: "100%", aspectRatio: "1", borderRadius: 10,
            background: `linear-gradient(150deg, ${preset.from}, ${preset.to})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Glyph type={preset.glyph} color="rgba(255,255,255,0.95)" />
          </div>
        </button>
      );
    })}
  </div>
);
